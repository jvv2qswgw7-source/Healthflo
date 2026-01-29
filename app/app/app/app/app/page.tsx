"use client";

import { useEffect, useMemo, useState } from "react";

type Diet = "Balanced" | "High protein" | "Low carb" | "Fibre focused";
type TimeAvail = "Quick" | "Normal";

type HealthFlowPlan = {
  do_this_first: string;
  todays_plan: {
    work: string[];
    personal: string[];
    errands: string[];
    health_meals: string[];
  };
  meals: Array<{
    name: string;
    type: "breakfast" | "lunch" | "dinner" | "snack";
    prep_time_min: number;
    low_upf: boolean;
    highlights_good: string[];
    highlights_caution: string[];
    nutrition: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fibre_g: number;
    };
    ingredients: string[];
    steps: string[];
  }>;
  shopping_list: {
    produce: string[];
    protein: string[];
    dairy: string[];
    pantry: string[];
    other: string[];
  };
  health_notes: string[];
};

const PREFS_KEY = "hf_prefs";
const FAVS_KEY = "hf_favs";

function loadPrefs(): { diet: Diet; lowUPF: boolean; time: TimeAvail } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { diet: "Balanced", lowUPF: true, time: "Normal" };
    return JSON.parse(raw);
  } catch {
    return { diet: "Balanced", lowUPF: true, time: "Normal" };
  }
}

function savePrefs(p: any) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

function loadFavs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]");
  } catch {
    return [];
  }
}

function addFav(item: string) {
  const favs = new Set(loadFavs());
  favs.add(item);
  localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
}

function removeFav(item: string) {
  localStorage.setItem(
    FAVS_KEY,
    JSON.stringify(loadFavs().filter((x) => x !== item))
  );
}

function shoppingListToText(list: any) {
  const sections: Array<[string, string[]]> = [
    ["Produce", list.produce || []],
    ["Protein", list.protein || []],
    ["Dairy", list.dairy || []],
    ["Pantry", list.pantry || []],
    ["Other", list.other || []],
  ];

  return sections
    .filter(([, items]) => items.length)
    .map(([title, items]) => `${title}:\n- ${items.join("\n- ")}`)
    .join("\n\n");
}

export default function AppPage() {
  const [text, setText] = useState("");
  const [diet, setDiet] = useState<Diet>("Balanced");
  const [lowUPF, setLowUPF] = useState(true);
  const [time, setTime] = useState<TimeAvail>("Normal");
  const [favs, setFavs] = useState<string[]>([]);

  const [plan, setPlan] = useState<HealthFlowPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPrefs();
    setDiet(p.diet);
    setLowUPF(p.lowUPF);
    setTime(p.time);
    setFavs(loadFavs());
  }, []);

  useEffect(() => {
    savePrefs({ diet, lowUPF, time });
  }, [diet, lowUPF, time]);

  async function createPlan() {
    setLoading(true);
    setErr(null);
    setPlan(null);

    try {
      const res = await fetch("/api/healthflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, diet, lowUPF, time, favourites: favs }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong");
      setPlan(data);
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function copyShopping() {
    if (!plan) return;
    await navigator.clipboard.writeText(
      shoppingListToText(plan.shopping_list)
    );
    alert("Shopping list copied!");
  }

  function printPlan() {
    window.print();
  }

  function toggleFav(item: string) {
    if (favs.includes(item)) {
      removeFav(item);
      setFavs(loadFavs());
    } else {
      addFav(item);
      setFavs(loadFavs());
    }
  }

  return (
    <>
      <section className="card">
        <h1 className="h1">HealthFlow</h1>
        <p className="sub">
          Tell us what’s going on today. We’ll turn it into one calm, clear plan.
        </p>

        <label>What’s happening today?</label>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Work, errands, meals, health goals, anything on your mind..."
        />

        <label>Diet preference</label>
        <select value={diet} onChange={(e) => setDiet(e.target.value as Diet)}>
          <option>Balanced</option>
          <option>High protein</option>
          <option>Low carb</option>
          <option>Fibre focused</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={lowUPF}
            onChange={(e) => setLowUPF(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Low-UPF focus
        </label>

        <label>Time available</label>
        <select value={time} onChange={(e) => setTime(e.target.value as TimeAvail)}>
          <option>Quick</option>
          <option>Normal</option>
        </select>

        <div className="btnRow">
          <button onClick={createPlan} disabled={loading || text.trim().length < 3}>
            {loading ? "Creating..." : "Create my plan"}
          </button>
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </section>

      {plan && (
        <>
          <section className="card">
            <strong>👉 Do This First</strong>
            <ul><li>{plan.do_this_first}</li></ul>
          </section>

          <section className="card">
            <strong>🍽 Meals</strong>
            {plan.meals.map((m, i) => {
              const key = `${m.type}: ${m.name}`;
              const saved = favs.includes(key);
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <strong>{m.type.toUpperCase()} — {m.name}</strong>
                  <button onClick={() => toggleFav(key)} style={{ marginLeft: 8 }}>
                    {saved ? "♥ Saved" : "♡ Save"}
                  </button>
                  <ul>{m.ingredients.map((x, j) => <li key={j}>{x}</li>)}</ul>
                </div>
              );
            })}
          </section>

          <section className="card">
            <strong>🛒 Shopping List</strong>
            <pre>{shoppingListToText(plan.shopping_list)}</pre>
            <div className="btnRow">
              <button onClick={copyShopping}>Copy</button>
              <button onClick={printPlan}>Print</button>
            </div>
          </section>

          <section className="card">
            <strong>🌿 Health Notes</strong>
            <ul>{plan.health_notes.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </section>
        </>
      )}
    </>
  );
}
