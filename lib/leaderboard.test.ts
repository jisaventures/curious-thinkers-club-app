import assert from "node:assert/strict";
import test from "node:test";
import { buildBoard, type BoardPerson } from "./leaderboard.ts";

const now = Date.parse("2026-11-21T12:00:00.000Z");
const day = 24 * 60 * 60 * 1000;

function person(id: string, nickname: string, events: BoardPerson["events"], region = "Europe", isMine = false): BoardPerson {
  return { id, nickname, region, isMine, events };
}

test("all-time ranks the highest score first and marks a climber", () => {
  const board = buildBoard(
    [
      person("a", "Ada", [{ at: new Date(now - 20 * day).toISOString(), amount: 100 }, { at: new Date(now - day).toISOString(), amount: 50 }]),
      person("b", "Bea", [{ at: new Date(now - 20 * day).toISOString(), amount: 120 }]),
    ],
    "all",
    "global",
    "Worldwide",
    now,
  );
  assert.equal(board[0].id, "a");
  assert.equal(board[0].rank, 1);
  assert.equal(board[0].move, "up");
  assert.equal(board[1].move, "down");
});

test("group and region filters keep only matching people", () => {
  const people = [
    person("mine", "Mine", [{ at: new Date(now - day).toISOString(), amount: 10 }], "Europe", true),
    person("asia", "Asia", [{ at: new Date(now - day).toISOString(), amount: 40 }], "Asia", false),
  ];
  assert.deepEqual(buildBoard(people, "all", "group", "Worldwide", now).map((row) => row.id), ["mine"]);
  assert.deepEqual(buildBoard(people, "all", "global", "Asia", now).map((row) => row.id), ["asia"]);
});

test("last 24 hours ignores older points", () => {
  const board = buildBoard(
    [person("old", "Old", [{ at: new Date(now - 3 * day).toISOString(), amount: 80 }]), person("new", "New", [{ at: new Date(now - 2 * 60 * 60 * 1000).toISOString(), amount: 5 }])],
    "day",
    "global",
    "Worldwide",
    now,
  );
  assert.deepEqual(board.map((row) => row.id), ["new"]);
});
