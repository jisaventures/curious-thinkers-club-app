const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function birthdayBounds(today = new Date()) {
  const earliest = new Date(today.getFullYear() - 15, 0, 1);
  const latest = addYears(today, -2);
  return { earliest, latest };
}

export function addYears(date: Date, years: number) {
  const next = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  if (next.getMonth() !== date.getMonth()) return new Date(date.getFullYear() + years, date.getMonth() + 1, 0);
  return next;
}

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function ageFromBirthday(value: string, today = new Date()) {
  const born = parseIsoDate(value);
  if (!born) return null;
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday = today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function isBirthdayAllowed(value: string, today = new Date()) {
  const born = parseIsoDate(value);
  if (!born) return false;
  const { earliest, latest } = birthdayBounds(today);
  return born >= startOfDay(earliest) && born <= startOfDay(latest);
}

export function formatBirthday(value: string) {
  const date = parseIsoDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function monthLabel(date: Date) {
  return MONTHS[date.getMonth()];
}

export function birthdayYears(today = new Date()) {
  const { earliest, latest } = birthdayBounds(today);
  const years: number[] = [];
  for (let year = latest.getFullYear(); year >= earliest.getFullYear(); year -= 1) years.push(year);
  return years;
}

export function monthGrid(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export function shiftMonth(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
