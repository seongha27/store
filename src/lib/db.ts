import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { RankCheck, Tracker, TrackerWithLatest } from "@/types/rank";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "rank.db");

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS trackers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      place_input TEXT    NOT NULL,          -- 사용자가 입력한 원본 (URL / ID / 주소)
      place_id    TEXT,                      -- 네이버 플레이스 ID (URL·ID 입력 시)
      place_name  TEXT,                      -- 조회 결과에서 확인된 업체명
      keyword     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rank_checks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tracker_id    INTEGER NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
      check_date    TEXT    NOT NULL,        -- YYYY-MM-DD (한국시간), 하루 1건
      checked_at    TEXT    NOT NULL,        -- ISO 시각
      rank          INTEGER,                 -- null = 조회 범위 밖
      scanned       INTEGER NOT NULL DEFAULT 0,
      error         TEXT,
      UNIQUE (tracker_id, check_date)
    );
    CREATE INDEX IF NOT EXISTS idx_checks_tracker ON rank_checks(tracker_id, check_date);
  `);
  return db;
}

type Row = Record<string, unknown>;

function toTracker(r: Row): Tracker {
  return {
    id: Number(r.id),
    placeInput: String(r.place_input),
    placeId: r.place_id == null ? null : String(r.place_id),
    placeName: r.place_name == null ? null : String(r.place_name),
    keyword: String(r.keyword),
    createdAt: String(r.created_at),
  };
}

function toCheck(r: Row): RankCheck {
  return {
    id: Number(r.id),
    trackerId: Number(r.tracker_id),
    checkDate: String(r.check_date),
    checkedAt: String(r.checked_at),
    rank: r.rank == null ? null : Number(r.rank),
    scanned: Number(r.scanned),
    error: r.error == null ? null : String(r.error),
  };
}

export function createTracker(input: {
  placeInput: string;
  placeId: string | null;
  keyword: string;
}): Tracker {
  const row = getDb()
    .prepare(
      "INSERT INTO trackers (place_input, place_id, keyword) VALUES (?, ?, ?) RETURNING *",
    )
    .get(input.placeInput, input.placeId, input.keyword) as Row;
  return toTracker(row);
}

export function getTracker(id: number): Tracker | null {
  const row = getDb().prepare("SELECT * FROM trackers WHERE id = ?").get(id) as Row | undefined;
  return row ? toTracker(row) : null;
}

export function listTrackers(): Tracker[] {
  return (getDb().prepare("SELECT * FROM trackers ORDER BY id DESC").all() as Row[]).map(toTracker);
}

export function deleteTracker(id: number): void {
  getDb().prepare("DELETE FROM trackers WHERE id = ?").run(id);
}

export function setPlaceName(id: number, name: string): void {
  getDb().prepare("UPDATE trackers SET place_name = ? WHERE id = ?").run(name, id);
}

/** 같은 날짜에 다시 조회하면 그날 기록을 덮어씁니다 (하루 1건 유지). */
export function saveCheck(c: Omit<RankCheck, "id">): void {
  getDb()
    .prepare(
      `INSERT INTO rank_checks (tracker_id, check_date, checked_at, rank, scanned, error)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (tracker_id, check_date) DO UPDATE SET
         checked_at = excluded.checked_at, rank = excluded.rank,
         scanned = excluded.scanned, error = excluded.error`,
    )
    .run(c.trackerId, c.checkDate, c.checkedAt, c.rank, c.scanned, c.error);
}

export function listChecks(trackerId: number, limit = 90): RankCheck[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM rank_checks WHERE tracker_id = ? ORDER BY check_date DESC LIMIT ?",
    )
    .all(trackerId, limit) as Row[];
  return rows.map(toCheck).reverse();
}

export function listTrackersWithLatest(): TrackerWithLatest[] {
  return listTrackers().map((t) => {
    const history = listChecks(t.id, 30);
    const latest = history.at(-1) ?? null;
    const previous = history.at(-2) ?? null;
    return { ...t, latest, previous, history };
  });
}
