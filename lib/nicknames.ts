const BLOCKED = [
  "fuck",
  "fuk",
  "shit",
  "shite",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "twat",
  "wank",
  "bollock",
  "arsehole",
  "asshole",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "spastic",
  "damn",
  "piss",
];

const ADJECTIVES = ["Sunny", "Brave", "Cosy", "Merry", "Swift", "Bright", "Calm", "Lucky", "Kind", "Happy"];

export function foldNickname(value: string) {
  return value
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

export function isRudeNickname(value: string) {
  const folded = foldNickname(value);
  if (!folded) return false;
  const tokens = folded.split(/\s+/);
  const compact = tokens.join("");
  return BLOCKED.some((word) => tokens.includes(word) || (word.length >= 4 && compact.includes(word)));
}

export function suggestNickname(firstName: string, taken: Iterable<string>) {
  const used = new Set([...taken].map((name) => name.toLowerCase()));
  const base = firstName.trim().split(/\s+/)[0]?.replace(/[^A-Za-z'-]/g, "") || "Pal";
  const ideas = [base, ...ADJECTIVES.map((word) => `${word} ${base}`)];
  return ideas.find((idea) => !used.has(idea.toLowerCase()) && !isRudeNickname(idea)) ?? `${base} Club`;
}
