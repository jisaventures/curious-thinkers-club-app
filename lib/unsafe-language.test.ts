import assert from "node:assert/strict";
import test from "node:test";
import { childFirstNameProblem, isUnsafeChildName } from "./unsafe-language.ts";

const SAFE = [
  "Oliver", "Olivia", "George", "Amelia", "Harry", "Isla", "Muhammad", "Noah", "Leo", "Mia",
  "Jack", "Ava", "Arthur", "Sophia", "Archie", "Grace", "Freddie", "Lily", "Theo", "Emily",
  "Henry", "Freya", "Oscar", "Ella", "Charlie", "Rosie", "Alfie", "Florence", "Jacob", "Willow",
  "Thomas", "William", "James", "Joshua", "Alexander", "Sebastian", "Joseph", "Samuel", "Daniel",
  "Matthew", "Andrew", "Benjamin", "Nathan", "Isaac", "Lucas", "Mason", "Ethan", "Logan", "Aiden",
  "Jackson", "Michael", "David", "Christopher", "Anthony", "Mark", "Steven", "Paul", "Kenneth",
  "Kevin", "Brian", "Timothy", "Ronald", "Jason", "Jeffrey", "Ryan", "Gary", "Nicholas", "Eric",
  "Jonathan", "Stephen", "Justin", "Scott", "Brandon", "Raymond", "Gregory", "Frank", "Patrick",
  "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam", "Zachary", "Douglas", "Peter", "Kyle",
  "Jeremy", "Walter", "Christian", "Keith", "Roger", "Terry", "Austin", "Sean", "Gerald", "Carl",
  "Harold", "Dylan", "Lawrence", "Jordan", "Jesse", "Bryan", "Billy", "Bruce", "Gabriel", "Albert",
  "Alan", "Eugene", "Russell", "Vincent", "Philip", "Bobby", "Johnny", "Bradley", "Elijah", "Luca",
  "Ali", "Hassan", "Omar", "Yusuf", "Ibrahim", "Elias", "Amir", "Karim", "Samir", "Tariq", "Malik",
  "Jamal", "Andre", "Luis", "Carlos", "Diego", "Miguel", "Juan", "Pedro", "Alejandro", "Santiago",
  "Mateo", "Jasper", "Killian", "Kilian", "Cassian", "Cassidy", "Cassandra", "Cassie", "Tessa",
  "Jessica", "Ashley", "Shital", "Hellen", "Helen", "Michelle", "Shelly", "Shelley", "Mitchell",
  "Rochelle", "Analise", "Annalise", "Analia", "Analeigh", "Hancock", "Dickens", "Homero", "Homer",
  "Nigel", "Nigella", "Fagin", "Fagan", "Titania", "Titus", "Fatima", "Gunnar", "Gunner", "Raphael",
  "Rafael", "Semen", "Semyon", "Nastya", "Shagun", "Assad", "Bassam", "Janus", "Devlin", "Richard",
  "Frederick", "Dominic", "Addison", "Dixon", "Maddox", "Patricia", "Elizabeth", "Alexandra",
  "Natalie", "Samantha", "Jennifer", "Brittany", "Stephanie", "Nicole", "Melissa", "Amanda",
  "Andrea", "Christina", "Katherine", "Catherine", "Sophie", "Annabelle", "Isabelle", "Isabella",
  "Evelyn", "Scarlett", "Violet", "Penelope", "Aurora", "Savannah", "Brooklyn", "Madison",
  "Abigail", "Hannah", "Sarah", "Rachel", "Rebecca", "Lauren", "Megan", "Amber", "Crystal",
  "Destiny", "Trinity", "Victoria", "Chloe", "Leah", "Nora", "Stella", "Hazel", "Lucy", "Ruby",
  "Eva", "Maya", "Aisha", "Zainab", "Maryam", "Layla", "Leila", "Noor", "Yasmin", "Aaliyah",
  "Imani", "Amara", "Kiara", "Naomi", "Esther", "Ruth", "Deborah", "Martha", "Lydia", "Priscilla",
  "Tabitha", "Magdalene", "Jesus", "Mary", "Anna", "Ann", "Anne", "Emma", "Ellie", "Luna", "Angel",
  "Heaven", "Summer", "Sky", "River", "Ocean", "Daisy", "Cherry", "Sherry", "Gay", "Galen",
  "Gabrielle",   "Poole", "Farthing", "Cucumber", "Classic", "Passion", "Methuselah", "Therapist", "Sexton",
  "Sextus", "Peacock", "Compass",
];

const BLOCKED = [
  "shit", "Shit", "SHIT", "sh1t", "sh!t", "shiiit", "s.h.i.t", "shiit", "shithead", "bullshit",
  "shitty", "shitter", "shitting", "fuck", "f*ck", "fck", "fuq", "phuck", "fvck", "fucking",
  "fucker", "motherfucker", "bitch", "b1tch", "cunt", "twat", "wanker", "wank", "slut", "slutty",
  "whore", "bastard", "asshole", "arsehole", "ass", "arse", "jackass", "dumbass", "badass",
  "dick", "dickhead", "dicky", "dickie", "cock", "cocky", "cocksucker", "pussy", "prick", "porn",
  "porno", "sex", "sexy", "sexual", "anal", "anus", "rape", "rapist", "nigger", "nigga", "n1gger",
  "faggot", "fag", "retard", "spastic", "tranny", "kike", "chink", "spic", "dyke", "coon", "paki",
  "nazi", "hitler", "cocaine", "heroin", "kill", "killer", "killing", "murder", "damn", "hell",
  "helll", "piss", "crap", "crappy", "boobs", "boob", "tits", "titty", "tit", "naked", "horny",
  "incest", "suicide", "milf", "jizz", "cum", "cums", "cumming", "scum", "wank", "tosser", "bellend",
  "knob", "minge", "shag", "bugger", "bloody", "idiot", "moron", "stupid", "loser", "satan", "penis",
  "vagina", "dildo", "terrorist", "meth", "weed", "crack", "drug", "drugs", "xxshit", "shitx",
  "ashit", "xshitx", "fanny", "poo", "poop", "pee", "fart", "hoe", "git", "wtf", "kys", "stfu",
  "asshat", "dipshit", "goddamn", "nonce", "pedo", "paedo", "molest", "assassin", "ugly", "smelly",
  "stinky", "gross", "dumb", "hate", "hater", "suck", "sucks", "bomb", "bomber", "gun", "queer",
  "homo", "demon", "devil", "rapists", "shite", "bollocks", "skank", "hooker", "douche", "fetish",
  "orgasm", "erotic", "sperm", "isis", "kkk", "lsd", "xxx", "nasty",
];

test("ordinary given names are allowed", () => {
  const blocked = SAFE.filter((name) => isUnsafeChildName(name));
  assert.deepEqual(blocked, []);
});

test("profanity, slurs and risky words are rejected, including disguises", () => {
  const allowed = BLOCKED.filter((name) => !isUnsafeChildName(name));
  assert.deepEqual(allowed, []);
});

test("a rude first name explains what to change", () => {
  assert.equal(childFirstNameProblem("shit"), "Use a real first name, without rude or risky words.");
  assert.equal(childFirstNameProblem("Pip"), "");
  assert.equal(childFirstNameProblem(""), "");
  assert.equal(childFirstNameProblem("Ann-Marie"), "");
  assert.equal(childFirstNameProblem("O'Neil"), "");
  assert.match(childFirstNameProblem("John3"), /first name/i);
});
