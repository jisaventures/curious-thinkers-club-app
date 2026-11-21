const UNSAFE_NAME_MESSAGE = "Use a real first name, without rude or risky words.";

const HOMOPHONE: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "!": "i",
  "|": "i",
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ї: "i",
  ј: "j",
};

// Included anywhere in the name. Chosen because they do not sit inside ordinary given names.
const STEMS = [
  "fuck", "fuk", "fuq", "fck", "fux", "bitch", "biatch", "cunt", "twat", "wank", "slut", "whore",
  "bastard", "pussy", "prick", "bollock", "penis", "vagina", "vulva", "dildo", "porn", "nazi", "hitler",
  "nigg", "faggot", "fagot", "retard", "spastic", "tranny", "incest", "horny", "boob", "milf", "jizz",
  "tosser", "bugger", "bellend", "minge", "douche", "skank", "hooker", "pedo", "paedo", "pedoph", "paedoph",
  "molest", "suicide", "cocaine", "heroin", "cannabis", "marijuana", "terror", "murder", "satan", "assassin",
  "naked", "sexual", "sexy", "anus", "fanny", "bloody", "idiot", "moron", "stupid", "loser", "ugly", "smelly",
  "stinky", "gross", "devil", "demon", "poop", "titti", "titty", "tits", "motherfuck", "bullshit", "dickhead",
  "shithead", "jackass", "dumbass", "badass", "smartass", "hardass", "cocksuck", "fucker", "fucking", "scrotum",
  "testicle", "clitor", "orgasm", "erotic", "fetish", "bondage", "bdsm", "sperm", "prostitut",
  "goddamn", "dammit", "wanker", "shitter", "asshole", "arsehole", "dipshit", "asshat", "dickwad", "cockhead",
  "shitface", "fuckface", "butthead", "numbnuts", "boner", "nonce", "spaz",
  "kike", "chink", "coon", "dyke", "paki", "homo", "queer", "scum", "knobend", "clusterfuck", "mindfuck",
  // British insults. These are rude in the UK even when the same spelling is harmless in the US.
  "nobhead", "nobend", "nobber", "nobjocky", "nobjokey", "knobhead", "knobjocky", "knobjokey", "knobead",
  "knobcheese", "twathead", "twatface", "twunt", "twunter", "wazzock", "pillock", "plonker", "numpty",
  "dipstick", "divvy", "minger", "munter", "slapper", "slag", "pikey", "knacker", "cockwomble", "gaylord",
  "scrote", "smegma", "spunk", "ballbag", "ballsack", "nutsack", "shagger", "shagging", "tosspot",
  "pissflaps", "fannyflaps", "windowlicker", "pervert", "flasher", "groper", "arsewipe", "arseface",
  "arsebandit", "cumstain", "shitstain", "bint",
];

// Matched as the whole name, or with a rude ending/start, or with junk letters packed around them.
// A longer real name that merely contains the letters is left alone.
const LOOSE = [
  "shit", "shite", "hell", "cock", "dick", "ass", "arse", "cum", "sex", "anal", "kill", "rape", "rapist",
  "damn", "piss", "crap", "hate", "drug", "crack", "weed", "meth", "nude", "gimp", "knob", "fart", "pooh",
  "suck", "shag", "twit", "prat", "dumb", "fat", "bomb", "gun", "nasty", "nob", "git", "yid", "sod",
];

const EXACT = ["jap", "spic", "fag", "tit", "poo", "pee", "hoe", "wtf", "kys", "lsd", "kkk", "isis", "stfu", "ffs", "xxx"];

const PREFIXES = new Set([
  "mother", "stupid", "bloody", "super", "smart", "freak", "holy", "cluster", "flying", "piece", "jack",
  "dumb", "butt", "arse", "mega", "half", "hard", "bull", "bad", "big", "fat", "dip", "ass", "god", "son",
  "full", "dog", "piss", "shit", "fuck", "dick", "cock", "cum",
]);

const SUFFIXES = new Set([
  "sucker", "heads", "head", "faces", "face", "holes", "hole", "ings", "ing", "sters", "ster", "ters", "ter",
  "ishes", "ish", "ful", "ly", "ties", "ty", "es", "ed", "ers", "er", "ys", "y", "ie", "ey", "ee", "s",
  "hat", "bag", "wad", "boy", "girl", "wipe", "clown", "stain", "pot", "let",
]);

const NAME_ENDINGS = new Set([
  "al", "ah", "ad", "ia", "an", "en", "on", "el", "le", "na", "ya", "la", "li", "is", "us", "os", "as", "ow",
  "ew", "aw", "in", "yn", "ai", "au", "ou", "ea", "io", "eo", "oe", "un",
]);

function lettersOf(value: string) {
  const folded = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/ph/g, "f");
  let out = "";
  for (const char of folded) out += HOMOPHONE[char] ?? char;
  return out.replace(/[^a-z]/g, "");
}

function squash(value: string, floor: number) {
  return value.replace(new RegExp(`(.)\\1{${floor - 1},}`, "g"), (run) => run[0].repeat(floor === 2 ? 1 : 2));
}

function keysOf(value: string) {
  const compact = lettersOf(value);
  if (!compact) return [];
  const voiced = compact.replace(/v/g, "u");
  return [...new Set([compact, voiced, squash(compact, 2), squash(voiced, 2), squash(compact, 3), squash(voiced, 3)])];
}

function paddingBad(before: string, after: string) {
  if (before && after) return !/[aeiouy]/.test(before) && !/[aeiouy]/.test(after);
  const side = before || after;
  if (!side) return false;
  if (PREFIXES.has(side) || SUFFIXES.has(side)) return true;
  if (!/[aeiouy]/.test(side)) return true;
  if (!before && after.length === 1) return false;
  if (side.length === 1) return true;
  if (side.length === 2) return !NAME_ENDINGS.has(side);
  return false;
}

function looseHit(key: string, word: string) {
  if (key === word || key === `${word}s` || key === `${word}es`) return true;
  let from = 0;
  while (from < key.length) {
    const index = key.indexOf(word, from);
    if (index < 0) return false;
    const before = key.slice(0, index);
    const after = key.slice(index + word.length);
    if (paddingBad(before, after)) return true;
    from = index + 1;
  }
  return false;
}

const ALLOW = new Set(["janus", "gunnar", "gunner"]);

export function isUnsafeChildName(value: string) {
  const keys = keysOf(value);
  if (keys.length === 0 || keys.some((key) => ALLOW.has(key))) return false;
  return keys.some((key) => {
    if (EXACT.some((word) => key === word || key === `${word}s` || key === `${word}es`)) return true;
    if (STEMS.some((word) => key.includes(word))) return true;
    return LOOSE.some((word) => looseHit(key, word));
  });
}

export { UNSAFE_NAME_MESSAGE };

export function childFirstNameProblem(value: string) {
  const name = value.trim();
  if (!name) return "";
  if (isUnsafeChildName(name)) return UNSAFE_NAME_MESSAGE;
  if (!/^[A-Za-z][A-Za-z'-]{0,14}$/.test(name)) return "Use a first name, without spaces or a surname.";
  return "";
}
