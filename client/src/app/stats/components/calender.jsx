"use client";
import { useEffect, useState } from "react";
import "./calender.css";

export default function MoodCalendar({ entries }) {
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const today = new Date();
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last30.push({
        date: d,
        mood: null,
        entry: null,
      });
    }

    const updated = last30.map((day) => {
      const sameDayEntry = entries.find((e) => {
        const t = new Date(e.timestamp);
        return (
          t.getFullYear() === day.date.getFullYear() &&
          t.getMonth() === day.date.getMonth() &&
          t.getDate() === day.date.getDate()
        );
      });
      return {
        ...day,
        mood: sameDayEntry ? sameDayEntry.mood : null,
        entry: sameDayEntry ? sameDayEntry.htmlContent || sameDayEntry.text : null,
      };
    });

    setDays(updated);
  }, [entries]);

  const moodColor = (mood) => {
    if (mood === null) return "#e0e0e0";
    if (mood <= 3) return "#ff6b6b";     // red
    if (mood <= 6) return "#ffd93b";     // yellow
    if (mood <= 8) return "#9be564";     // light green
    return "#4CAF50";                    // green
  };

  return (
    <div className="calendar-container">
      <h2>🗓️ Last 30 Days</h2>

      {!selected && (
        <div className="calendar-grid">
          {days.map((day, i) => (
            <div
              key={i}
              className="calendar-day"
              style={{ backgroundColor: moodColor(day.mood) }}
              title={`${day.date.toLocaleDateString()} - Mood: ${
                day.mood ?? "No entry"
              }`}
              onClick={() => day.entry && setSelected(day)}
            >
              {day.date.getDate()}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="calendar-popup">
          <button className="calendar-x" onClick={() => setSelected(null)}>✕</button>
          <h3>
            {selected.date.toLocaleDateString()} — Mood: {selected.mood}/10
          </h3>
          <div
            className="calendar-popup-text"
            dangerouslySetInnerHTML={{ __html: selected.entry }}
          />
        </div>
      )}
    </div>
  );
}
