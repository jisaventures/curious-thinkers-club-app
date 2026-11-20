import assert from "node:assert/strict";
import test from "node:test";
import { isRudeNickname, suggestNickname } from "./nicknames.ts";

test("blocks a swear word and a letter-swap disguise", () => {
  assert.equal(isRudeNickname("shit"), true);
  assert.equal(isRudeNickname("sh1t"), true);
  assert.equal(isRudeNickname("hello"), false);
  assert.equal(isRudeNickname("Pip"), false);
});

test("suggests the first name, then a spare adjective", () => {
  assert.equal(suggestNickname("Pip", []), "Pip");
  assert.equal(suggestNickname("Pip", ["Pip"]), "Sunny Pip");
});
