"use client";

import { useState } from "react";

export default function Planner() {
  const [text, setText] = useState("");
  const [diet, setDiet] = useState("balanced");
  const [time, setTime] = useState("30 minutes");
  const [lowUPF, setLowUPF] = useState(true);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function createPlan() {
    setLoading(true);
    setErr(null);
    setOut(null);

    try {
      const res = await fetch("/api/healthflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          diet,
          time,
          lowUPF,
          favourites: []
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setOut(json);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Create your plan</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Tell HealthFlow what you need today (low-UPF, high protein, low carb, etc).
      </p>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder='Example: "High protein, low-UPF, quick meals. Budget-friendly. Gym later."'
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)"
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <select value={diet} onChange={(e) => setDiet(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            <option value="balanced">Balanced</option>
            <option value="high_protein">High protein</option>
            <option value="low_carb">Low carb</option>
            <option value="high_fibre">High fibre</option>
            <option value="low_fibre">Low fibre</option>
          </select>

          <select value={time} onChange={(e) => setTime(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
            <option>15 minutes</option>
            <option>30 minutes</option>
            <option>45 minutes</option>
            <option>60 minutes</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={lowUPF} onChange={(e) => setLowUPF(e.target.checked)} />
            Low-UPF focus
          </label>

          <button className="btn" onClick={createPlan} disabled={loading || text.trim().length < 3}>
            {loading ? "Creating…" : "Create my plan"}
          </button>
        </div>

        {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}
      </div>

      {out && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Result</h2>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(out, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
