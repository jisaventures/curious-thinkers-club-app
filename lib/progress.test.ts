import assert from "node:assert/strict";
import test from "node:test";
import { catchUpNudge, nextStepPosition } from "./progress.ts";

test("next step is the first incomplete position", () => {
  assert.equal(nextStepPosition([1, 2, 3, 4], [1, 2]), 3);
  assert.equal(nextStepPosition([1, 2, 3], []), 1);
  assert.equal(nextStepPosition([1, 2], [1, 2]), null);
});

test("catch-up nudge names a child who is three steps behind", () => {
  const nudge = catchUpNudge(5, [
    { nickname: "Captain Lou", currentPosition: 2, started: true },
    { nickname: "Magpie Mo", currentPosition: null, started: false },
  ]);
  assert.deepEqual(nudge, { nickname: "Captain Lou", gap: 3 });
});

test("a gap of two does not nudge", () => {
  const nudge = catchUpNudge(5, [
    { nickname: "Captain Lou", currentPosition: 3, started: true },
  ]);
  assert.equal(nudge, null);
});
