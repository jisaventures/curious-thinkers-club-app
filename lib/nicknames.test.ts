import assert from "node:assert/strict";
import test from "node:test";
import { isRudeNickname, suggestNickname } from "./nicknames.ts";

test("blocks a swear word and a letter-swap disguise", () => {
  assert.equal(isRudeNickname("shit"), true);
  assert.equal(isRudeNickname("sh1t"), true);
  assert.equal(isRudeNickname("hello"), false);
  assert.equal(isRudeNickname("Pip"), false);
});

test("makes a playful nickname with a number on the end", () => {
  let index = 0;
  const rolls = [0, 0, 0];
  const name = suggestNickname("Pip", [], () => rolls[index++] ?? 0);
  assert.equal(name, "wigglyworm10");
});

test("skips a playful nickname that is already used", () => {
  let index = 0;
  const rolls = [0, 0, 0, 0, 0.7, 0.5];
  const name = suggestNickname("Pip", ["wigglyworm10"], () => rolls[index++] ?? 0);
  assert.equal(name, "wigglypickle55");
  assert.notEqual(name, "wigglyworm10");
});
