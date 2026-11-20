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

const PLAY_LEFT = [
  "wiggly", "bouncy", "giggly", "sparkly", "fuzzy", "zippy", "sunny", "cosy", "merry", "snuggly",
  "jumpy", "twinkly", "bubbly", "cheeky", "dazzling", "happy", "lucky", "peppy", "silly", "jolly",
  "leafy", "little", "keen", "brave", "gentle", "cuddly", "chirpy", "speedy", "wobbly", "golden",
  "bright", "calm", "fizzy", "gleeful", "glossy", "quirky", "hoppy", "kind", "nifty", "chipper",
  "plucky", "shiny", "sleepy", "smiley", "sparky", "sporty", "springy", "starry", "sweet", "swift",
  "thoughtful", "toasty", "twirly", "zesty", "zoomy", "dreamy", "fluffy", "zappy", "joyful", "lively",
  "lovely", "playful", "cheery", "clever", "curious", "eager", "funny", "helpful", "hopeful", "proud",
  "quiet", "soft", "warm", "wise", "breezy", "daring", "dapper", "snappy", "rosy", "glad",
  "mighty", "nimble", "tidy", "trusty", "woolly", "zingy", "amazed", "caring", "dandy", "fluttery",
  "rapid", "steady", "super", "jazzy", "vivid", "witty",
];
const PLAY_RIGHT = [
  "ladybird", "bee", "pelican", "panda", "fox", "owl", "frog", "bear", "duck", "mouse",
  "puppy", "kitten", "star", "cloud", "pancake", "scone", "cookie", "pebble", "sprout", "comet",
  "bunny", "chick", "crab", "deer", "dove", "fawn", "finch", "fish", "foal", "goat",
  "hare", "horse", "koala", "lamb", "lark", "lion", "otter", "parrot", "pegasus", "puffin",
  "rabbit", "robin", "sheep", "snail", "swan", "tiger", "turtle", "zebra", "badger", "kiwi",
  "beetle", "panther", "gecko", "gazelle", "gopher", "hamster", "heron", "jaguar", "lemur", "lizard",
  "llama", "magpie", "flamingo", "moose", "newt", "hedgehog", "quail", "seal", "shark", "squid",
  "toucan", "wombat", "alpaca", "bison", "canary", "dragon", "eagle", "ferret", "orca", "iguana",
  "meerkat", "penguin", "raccoon", "salmon", "starfish", "walrus", "acorn", "apple", "berry", "biscuit",
  "bubble", "candy", "raisin", "clover", "daisy", "donut", "feather", "honey", "orange", "lolly",
  "mango", "satsuma", "noodle", "apricot", "penny", "blueberry", "popcorn", "pretzel", "pudding", "pumpkin",
  "rocket", "toffee", "waffle", "button", "cupcake", "doodle", "jelly", "marble", "pillow", "puzzle",
  "teacup", "rainbow", "seashell", "sparkle", "sprinkle", "sundae", "twinkle", "hazelnut", "crumpet", "blossom",
];

export const nicknameAdjectives = PLAY_LEFT;
export const nicknameNouns = PLAY_RIGHT;

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

export function containsBlockedWord(value: string) {
  const folded = foldNickname(value);
  if (!folded) return false;
  const compact = folded.replace(/\s+/g, "");
  return BLOCKED.some((word) => compact.includes(word));
}

export function isRudeNickname(value: string) {
  return containsBlockedWord(value);
}

export function suggestNickname(_firstName: string, taken: Iterable<string>, random: () => number = Math.random) {
  const used = new Set([...taken].map((name) => name.trim().toLowerCase()).filter(Boolean));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const left = PLAY_LEFT[Math.floor(random() * PLAY_LEFT.length)] ?? PLAY_LEFT[0];
    const right = PLAY_RIGHT[Math.floor(random() * PLAY_RIGHT.length)] ?? PLAY_RIGHT[0];
    const stem = `${left}${right}`;
    const number = 10 + Math.floor(random() * 90);
    const idea = `${stem}${number}`;
    if (
      idea.length > 24 ||
      used.has(idea) ||
      containsBlockedWord(left) ||
      containsBlockedWord(right) ||
      containsBlockedWord(stem)
    ) {
      continue;
    }
    return idea;
  }
  return `sillysprout${10 + Math.floor(random() * 90)}`;
}
