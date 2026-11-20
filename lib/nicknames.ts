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
  "jumpy", "twinkly", "bubbly", "cheeky", "dizzy", "happy", "lucky", "peppy", "silly", "jolly",
  "tall", "tiny", "excited", "brave", "gentle", "cuddly", "chirpy", "speedy", "floppy", "golden",
  "bright", "calm", "fizzy", "giddy", "glossy", "goofy", "hoppy", "kind", "nifty", "perky",
  "plucky", "shiny", "sleepy", "smiley", "sparky", "sporty", "springy", "starry", "sweet", "swift",
  "tender", "toasty", "twirly", "zesty", "zoomy", "dreamy", "fluffy", "fruity", "joyful", "lively",
  "lovely", "playful", "cheery", "clever", "curious", "eager", "funny", "helpful", "hopeful", "proud",
  "quiet", "soft", "warm", "wise", "breezy", "daring", "fancy", "snappy", "rosy", "glad",
  "mighty", "nimble", "tidy", "trusty", "woolly", "zingy", "amazed", "caring", "dandy", "puffy",
  "rapid", "steady", "super", "tickly", "vivid", "witty",
];
const PLAY_RIGHT = [
  "worm", "bee", "goose", "panda", "fox", "owl", "frog", "bear", "duck", "mouse",
  "puppy", "kitten", "star", "cloud", "pickle", "muffin", "cookie", "pebble", "sprout", "comet",
  "bunny", "chick", "crab", "deer", "dove", "fawn", "finch", "fish", "foal", "goat",
  "hare", "horse", "koala", "lamb", "lark", "lion", "otter", "parrot", "pony", "puffin",
  "rabbit", "robin", "sheep", "snail", "swan", "tiger", "turtle", "zebra", "badger", "beaver",
  "beetle", "camel", "gecko", "gibbon", "gopher", "hamster", "heron", "jaguar", "lemur", "lizard",
  "llama", "magpie", "monkey", "moose", "newt", "piglet", "quail", "seal", "shark", "squid",
  "toucan", "wombat", "alpaca", "bison", "canary", "dragon", "eagle", "ferret", "hippo", "iguana",
  "meerkat", "penguin", "raccoon", "salmon", "shrimp", "walrus", "acorn", "apple", "berry", "biscuit",
  "bubble", "candy", "cherry", "clover", "daisy", "donut", "feather", "honey", "lemon", "lolly",
  "mango", "melon", "noodle", "peach", "penny", "plum", "popcorn", "pretzel", "pudding", "pumpkin",
  "rocket", "toffee", "waffle", "button", "cupcake", "doodle", "jelly", "marble", "pillow", "puzzle",
  "teacup", "rainbow", "seashell", "sparkle", "sprinkle", "sundae", "twinkle", "walnut", "crumpet", "blossom",
];

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
    if (idea.length > 24 || used.has(idea) || isRudeNickname(idea)) continue;
    return idea;
  }
  return `sillysprout${10 + Math.floor(random() * 90)}`;
}
