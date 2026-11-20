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

const PLAY_LEFT = ["wiggly", "bouncy", "giggly", "sparkly", "fuzzy", "zippy", "sunny", "cosy", "merry", "snuggly", "jumpy", "twinkly", "bubbly", "cheeky", "dizzy", "happy", "lucky", "peppy", "silly", "jolly"];
const PLAY_RIGHT = ["worm", "bee", "goose", "panda", "fox", "owl", "frog", "bear", "duck", "mouse", "puppy", "kitten", "star", "cloud", "pickle", "muffin", "cookie", "pebble", "sprout", "comet"];

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

export function suggestNickname(_firstName: string, taken: Iterable<string>, random: () => number = Math.random) {
  const used = new Set([...taken].map((name) => name.trim().toLowerCase()).filter(Boolean));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const left = PLAY_LEFT[Math.floor(random() * PLAY_LEFT.length)] ?? PLAY_LEFT[0];
    const right = PLAY_RIGHT[Math.floor(random() * PLAY_RIGHT.length)] ?? PLAY_RIGHT[0];
    const number = 10 + Math.floor(random() * 90);
    const idea = `${left}${right}${number}`;
    if (used.has(idea) || isRudeNickname(idea)) continue;
    return idea;
  }
  return `sillysprout${10 + Math.floor(random() * 90)}`;
}
