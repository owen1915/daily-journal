"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./linechart.css";

export default function MoodLineChart({ entries }) {
  const grouped = {};
  entries
    .filter((e) => e.mood !== undefined)
    .forEach((e) => {
      const date = e.timestamp.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(e);
    });

  const data = Object.entries(grouped).map(([date, arr]) => ({
    date,
    mood: arr.reduce((sum, e) => sum + e.mood, 0) / arr.length,
    ratings: arr.map((e) => e.mood),
  }));

  const getMoodColor = (mood) => {
    if (mood <= 3) return "#ff4d4d";
    if (mood <= 6) return "#ffcc00";
    return "#33cc33";
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={getMoodColor(payload.mood)}
        stroke="#000"
        strokeWidth={0.5}
      />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const info = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px",
            textAlign: "center",
          }}
        >
          <strong>{info.date}</strong>
          <div>Mood ratings: {info.ratings.join(", ")}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="linechart-container">
      <h2 className="linechart-title">Mood Over Time</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#33cc33" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#ffcc00" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff4d4d" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis dataKey="date" tick={{ fill: "#444" }} />
          <YAxis domain={[1, 10]} tick={{ fill: "#444" }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="url(#moodGradient)"
            strokeWidth={3}
            dot={<CustomDot />}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
