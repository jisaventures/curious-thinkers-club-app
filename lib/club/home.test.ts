import assert from "node:assert/strict";
import test from "node:test";
import { questsCompletedByGroup } from "./home.ts";

const steps = [
  { id: "a1", pack_id: "pirate" },
  { id: "a2", pack_id: "pirate" },
  { id: "b1", pack_id: "spy" },
  { id: "b2", pack_id: "spy" },
];

test("a quest counts once when one member finishes it", () => {
  const count = questsCompletedByGroup({
    packs: [{ id: "pirate" }, { id: "spy" }],
    steps,
    childIds: ["lou", "mo"],
    progress: [
      { child_id: "lou", step_id: "a1", status: "complete" },
      { child_id: "lou", step_id: "a2", status: "complete" },
      { child_id: "mo", step_id: "a1", status: "complete" },
      { child_id: "mo", step_id: "a2", status: "complete" },
      { child_id: "lou", step_id: "b1", status: "complete" },
      { child_id: "mo", step_id: "b2", status: "complete" },
    ],
  });
  assert.equal(count, 1);
});
