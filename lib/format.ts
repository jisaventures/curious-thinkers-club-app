export function formatPoints(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatMonth(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatPounds(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export function possessive(name: string) {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

export function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function shortName(nickname: string) {
  const parts = nickname.trim().split(/\s+/);
  return parts[parts.length - 1] || nickname;
}

export function ordinal(n: number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

export function poundsToPence(value: string) {
  const match = value.trim().match(/^(\d{1,4})(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const pounds = Number(match[1]);
  const fraction = (match[2] || "").padEnd(2, "0");
  return pounds * 100 + Number(fraction);
}
