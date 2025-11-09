"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./piechart.css";

export default function MoodPieChart({ entries }) {
  const counts = { low: 0, mid: 0, high: 0 };
  entries.forEach((e) => {
    const mood = e.mood || 0; 
    if (mood >= 1 && mood <= 3) counts.low++;
    else if (mood >= 4 && mood <= 6) counts.mid++;
    else if (mood >= 7 && mood <= 10) counts.high++;
  });

  const data = [
    { name: "Low (1–3)", value: counts.low },
    { name: "Medium (4–6)", value: counts.mid },
    { name: "High (7–10)", value: counts.high },
  ];

  const COLORS = ["#ff4d4d", "#ffcc00", "#33cc33"];

  return (
    <div className="piechart-container">
      <h2 className="piechart-title">Mood Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
