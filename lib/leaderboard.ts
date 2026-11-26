export const REGIONS = ["Worldwide", "Europe", "Asia", "Africa", "North America", "South America", "Oceania", "Middle East"] as const;

export const PERIODS = [
  { id: "all", label: "All time", days: null },
  { id: "day", label: "Last 24 hours", days: 1 },
  { id: "week", label: "Last week", days: 7 },
  { id: "month", label: "Last month", days: 30 },
  { id: "quarter", label: "Last 3 months", days: 90 },
  { id: "year", label: "Last year", days: 365 },
] as const;

export type PeriodId = (typeof PERIODS)[number]["id"];
export type Move = "up" | "down" | "stable";

export type BoardPerson = {
  id: string;
  nickname: string;
  region: string;
  isMine: boolean;
  events: { at: string; amount: number }[];
};

export type RankedPerson = {
  id: string;
  points: number;
  rank: number;
  move: Move;
};

const DAY = 24 * 60 * 60 * 1000;

export function buildBoard(people: BoardPerson[], period: PeriodId, scope: "global" | "group", region: string, now = Date.now()): RankedPerson[] {
  const days = PERIODS.find((item) => item.id === period)?.days ?? null;
  const windowMs = days == null ? null : days * DAY;
  const start = windowMs == null ? null : now - windowMs;
  const previousStart = windowMs == null ? now - 7 * DAY : start! - windowMs;
  const previousEnd = windowMs == null ? previousStart : start!;
  const pool = people.filter((person) => (scope === "global" || person.isMine) && (region === "Worldwide" || person.region === region));
  const scored = pool.map((person) => {
    let points = 0;
    let previous = 0;
    for (const event of person.events) {
      const at = new Date(event.at).getTime();
      if (Number.isNaN(at)) continue;
      if (start == null || at >= start) points += event.amount;
      if (windowMs == null) {
        if (at < previousStart) previous += event.amount;
      } else if (at >= previousStart && at < previousEnd) {
        previous += event.amount;
      }
    }
    return { id: person.id, nickname: person.nickname, points, previous };
  });
  const current = ranks(scored.filter((row) => row.points > 0).map((row) => ({ id: row.id, nickname: row.nickname, points: row.points })));
  const prior = ranks(scored.filter((row) => row.previous > 0).map((row) => ({ id: row.id, nickname: row.nickname, points: row.previous })));
  return current.map((row) => {
    const before = prior.find((item) => item.id === row.id)?.rank ?? null;
    const move: Move = before == null ? "up" : row.rank < before ? "up" : row.rank > before ? "down" : "stable";
    return { id: row.id, points: row.points, rank: row.rank, move };
  });
}

export type GlobalBoardRow = {
  id: string;
  nickname: string;
  firstName: string | null;
  points: number;
  rank: number;
  isMine: boolean;
  move: Move;
  avatarKey: string;
  avatarOptions: string | null;
  avatarBg: string | null;
  avatarFace: string | null;
  avatarHairStyle: string | null;
  avatarHairColour: string | null;
  avatarGlasses: boolean | null;
  avatarHat: string | null;
  avatarSkin: string | null;
  avatarEyes: string | null;
  avatarShirt: string | null;
  gender: "boy" | "girl" | "unspecified" | null;
};

type GlobalBoardSource = BoardPerson & Omit<GlobalBoardRow, "points" | "rank" | "move">;

export function globalBoardRows(people: GlobalBoardSource[]): GlobalBoardRow[] {
  const ranked = buildBoard(people, "all", "global", "Worldwide");
  const byId = new Map(people.map((person) => [person.id, person]));
  return ranked.flatMap((row) => {
    const person = byId.get(row.id);
    if (!person) return [];
    return [{
      id: person.id,
      nickname: person.nickname,
      firstName: person.firstName,
      points: row.points,
      rank: row.rank,
      isMine: person.isMine,
      move: row.move,
      avatarKey: person.avatarKey,
      avatarOptions: person.avatarOptions,
      avatarBg: person.avatarBg,
      avatarFace: person.avatarFace,
      avatarHairStyle: person.avatarHairStyle,
      avatarHairColour: person.avatarHairColour,
      avatarGlasses: person.avatarGlasses,
      avatarHat: person.avatarHat,
      avatarSkin: person.avatarSkin,
      avatarEyes: person.avatarEyes,
      avatarShirt: person.avatarShirt,
      gender: person.gender,
    }];
  });
}

function ranks(rows: { id: string; nickname: string; points: number }[]) {
  const ordered = [...rows].sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname));
  let lastPoints = -1;
  let lastRank = 0;
  return ordered.map((row, index) => {
    const rank = row.points === lastPoints ? lastRank : index + 1;
    lastPoints = row.points;
    lastRank = rank;
    return { id: row.id, rank, points: row.points };
  });
}
