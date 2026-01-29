import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const SYSTEM_PROMPT = `
You are HealthFlow.

You must output ONLY valid JSON that matches the schema exactly.
No markdown. No extra keys. No commentary.

Goal:
Turn the user's input into ONE calm, clear daily plan plus meals plus shopping list.

Rules:
- Supportive, practical tone
- Short phrases
- No guilt, no pressure
- Focus on low-UPF, real food when requested
- No medical advice
- No extreme dieting
- Keep it realistic for one day
- Suggest exactly ONE priority action

Schema (must match exactly):
{
  "do_this_first": "string",
  "todays_plan": {
    "work": ["string"],
    "personal": ["string"],
    "errands": ["string"],
    "health_meals": ["string"]
  },
  "meals": [
    {
      "name": "string",
      "type": "breakfast|lunch|dinner|snack",
      "prep_time_min": number,
      "low_upf": boolean,
      "highlights_good": ["string"],
      "highlights_caution": ["string"],
      "nutrition": {
        "calories": number,
        "protein_g": number,
        "carbs_g": number,
        "fat_g": number,
        "fibre_g": number
      },
      "ingredients": ["string"],
      "steps": ["string"]
    }
  ],
  "shopping_list": {
    "produce": ["string"],
    "protein": ["string"],
    "dairy": ["string"],
    "pantry": ["string"],
    "other": ["string"]
  },
  "health_notes": ["string"]
}

Constraints:
- Use 2 to 4 meals total unless user asks otherwise.
- Each list should have 0 to 6 items max.
- prep_time_min: 5 to 60
- Nutrition numbers must be reasonable estimates.
`.trim();

type Body = {
  text: string;
  diet?: "Balanced" | "High protein" | "Low carb" | "Fibre focused";
  lowUPF?: boolean;
  time?: "Quick" | "Normal";
  favourites?: string[];
};

function safeJsonParse(s: string) {
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callModel(userContext: string) {
  return client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContext }
    ],
    max_output_tokens: 1100,
    
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.text || body.text.trim().length < 3) {
    return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
  }

  const userContext = [
    `User notes: ${body.text}`,
    body.diet ? `Diet preference: ${body.diet}` : "",
    typeof body.lowUPF === "boolean" ? `Low-UPF focus: ${body.lowUPF ? "Yes" : "No"}` : "",
    body.time ? `Time available: ${body.time}` : "",
    body.favourites?.length ? `Favourites to prioritise where possible: ${body.favourites.join(", ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  // retry once automatically if JSON fails
  for (let attempt = 1; attempt <= 2; attempt++) {
    const resp = await callModel(userContext);
    const text = (resp as any).output_text ?? "";
    const parsed = safeJsonParse(text);

    if (parsed) {
      return new Response(JSON.stringify(parsed), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ error: "AI returned invalid JSON. Please try again." }), {
    status: 502,
    headers: { "Content-Type": "application/json" }
  });
}
