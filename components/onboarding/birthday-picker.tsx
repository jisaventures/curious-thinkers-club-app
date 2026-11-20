"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  birthdayBounds,
  birthdayYears,
  formatBirthday,
  isBirthdayAllowed,
  monthGrid,
  monthLabel,
  parseIsoDate,
  sameDay,
  shiftMonth,
  startOfDay,
  toIsoDate,
} from "@/lib/birthday";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function BirthdayPicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  const bounds = useMemo(() => birthdayBounds(today), [today]);
  const years = useMemo(() => birthdayYears(today), [today]);
  const [cursor, setCursor] = useState(() => new Date(bounds.latest.getFullYear(), bounds.latest.getMonth(), 1));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = monthGrid(cursor);
  const previous = shiftMonth(cursor, -1);
  const next = shiftMonth(cursor, 1);
  const canGoBack = previous.getFullYear() > bounds.earliest.getFullYear() || (previous.getFullYear() === bounds.earliest.getFullYear() && previous.getMonth() >= bounds.earliest.getMonth());
  const canGoForward = next.getFullYear() < bounds.latest.getFullYear() || (next.getFullYear() === bounds.latest.getFullYear() && next.getMonth() <= bounds.latest.getMonth());

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        className="birthday-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((current) => !current);
          const selected = parseIsoDate(value);
          if (selected) setCursor(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }}
      >
        <span className={value ? "min-w-0 truncate" : "min-w-0 truncate text-[#8aa092]"}>{value ? formatBirthday(value) : "Select date"}</span>
        <Calendar className="size-5 shrink-0 text-[#306a51]" aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} role="dialog" aria-label="Choose a birthday" className="birthday-panel">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className="birthday-nav" disabled={!canGoBack} onClick={() => canGoBack && setCursor(previous)} aria-label="Previous month">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <p className="birthday-month">{monthLabel(cursor)}</p>
              <select
                className="birthday-year"
                aria-label="Year"
                value={cursor.getFullYear()}
                onChange={(event) => {
                  const year = Number(event.target.value);
                  let month = cursor.getMonth();
                  const firstOfLatest = new Date(bounds.latest.getFullYear(), bounds.latest.getMonth(), 1);
                  const firstOfEarliest = new Date(bounds.earliest.getFullYear(), bounds.earliest.getMonth(), 1);
                  const candidate = new Date(year, month, 1);
                  if (candidate > firstOfLatest) month = bounds.latest.getMonth();
                  if (candidate < firstOfEarliest) month = bounds.earliest.getMonth();
                  setCursor(new Date(year, month, 1));
                }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="birthday-nav" disabled={!canGoForward} onClick={() => canGoForward && setCursor(next)} aria-label="Next month">
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} className="birthday-weekday">
                {day}
              </span>
            ))}
            {days.map((day) => {
              const iso = toIsoDate(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const allowed = inMonth && isBirthdayAllowed(iso, today);
              const selected = value === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!allowed}
                  aria-pressed={selected}
                  aria-label={formatBirthday(iso)}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={`birthday-day ${selected ? "is-selected" : ""} ${sameDay(day, today) && allowed ? "is-today" : ""}`}
                >
                  {inMonth ? day.getDate() : ""}
                </button>
              );
            })}
          </div>
          <p className="birthday-note">Ages 2 to 15. Birthdays only go back 15 years.</p>
        </div>
      )}
    </div>
  );
}
