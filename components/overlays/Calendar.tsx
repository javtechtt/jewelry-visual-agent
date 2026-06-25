"use client";

// A compact, real-time month calendar for the appointment flow. It reads the
// actual current date (client-side) so past days are disabled and "today" is
// marked. Controlled by an ISO yyyy-mm-dd `value`; when Aurelis sets a date in
// another month via set_appointment, the view follows it.

import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function Calendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (iso: string) => void;
}) {
  // Midnight today, for past/today comparisons.
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [view, setView] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    const d = Number.isNaN(base.getTime()) ? new Date() : base;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Follow Aurelis: if a date is set in a different month, jump the calendar.
  useEffect(() => {
    if (!value) return;
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return;
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }, [value]);

  const { year, month } = view;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const atCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const go = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <div className="calendar">
      <div className="calendar__head">
        <button
          type="button"
          className="calendar__nav"
          onClick={() => go(-1)}
          disabled={atCurrentMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar__title">
          {MONTHS[month]} {year}
        </span>
        <button type="button" className="calendar__nav" onClick={() => go(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="calendar__weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="calendar__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar__grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} className="calendar__cell calendar__cell--empty" />;
          const cellIso = toIso(year, month, day);
          const cellDate = new Date(year, month, day);
          const past = cellDate < today;
          const selected = cellIso === value;
          const isToday = cellDate.getTime() === today.getTime();
          return (
            <button
              key={i}
              type="button"
              disabled={past}
              onClick={() => onSelect(cellIso)}
              className={`calendar__cell${selected ? " calendar__cell--on" : ""}${
                isToday ? " calendar__cell--today" : ""
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
