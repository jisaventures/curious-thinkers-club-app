import assert from "node:assert/strict";
import test from "node:test";
import { containsBlockedWord, isRudeNickname, nicknameAdjectives, nicknameNouns, suggestNickname } from "./nicknames.ts";

test("blocks a swear word and a letter-swap disguise", () => {
  assert.equal(isRudeNickname("shit"), true);
  assert.equal(isRudeNickname("sh1t"), true);
  assert.equal(isRudeNickname("hello"), false);
  assert.equal(isRudeNickname("Pip"), false);
});

test("makes a playful nickname with a number on the end", () => {
  const name = suggestNickname("Pip", [], () => 0);
  assert.equal(name, "wigglyladybird10");
  assert.match(name, /^[a-z]+[0-9]{2}$/);
});

test("skips a playful nickname that is already used", () => {
  const first = suggestNickname("Pip", [], () => 0);
  let calls = 0;
  const name = suggestNickname("Pip", [first], () => {
    calls += 1;
    return calls <= 3 ? 0 : 0.37;
  });
  assert.notEqual(name, first);
  assert.match(name, /^[a-z]+[0-9]{2}$/);
  assert.equal(name.length <= 24, true);
});

test("uses lots of different kind words", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const names = new Set<string>();
  for (let i = 0; i < 80; i += 1) names.add(suggestNickname("Pip", names, random));
  const stems = new Set([...names].map((name) => name.replace(/[0-9]+$/, "")));
  assert.equal(stems.size >= 60, true);
  for (const name of names) {
    assert.equal(/smelly|stinky|gross|nasty|ugly/.test(name), false);
    assert.equal(name.length <= 24, true);
  }
});

test("word lists keep their length and have no duplicates", () => {
  assert.equal(nicknameAdjectives.length, 96);
  assert.equal(nicknameNouns.length, 130);
  assert.equal(new Set(nicknameAdjectives).size, nicknameAdjectives.length);
  assert.equal(new Set(nicknameNouns).size, nicknameNouns.length);
  const removed = [
    "perky", "fruity", "tender", "floppy", "excited", "puffy", "tickly", "fancy", "dizzy", "goofy", "giddy", "tiny", "tall",
    "beaver", "muffin", "melon", "cherry", "peach", "plum", "walnut", "pickle", "camel", "goose", "monkey", "gibbon", "piglet", "hippo", "worm", "shrimp", "lemon", "pony",
  ];
  for (const word of removed) {
    assert.equal(nicknameAdjectives.includes(word) || nicknameNouns.includes(word), false, word);
  }
});

test("ten thousand generated names contain no blocked word", () => {
  let seed = 99;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const taken = new Set<string>();
  for (let i = 0; i < 10000; i += 1) {
    const name = suggestNickname("Pip", taken, random);
    taken.add(name);
    const stem = name.replace(/[0-9]+$/, "");
    assert.equal(containsBlockedWord(stem), false, name);
    assert.equal(isRudeNickname(name), false, name);
  }
});
