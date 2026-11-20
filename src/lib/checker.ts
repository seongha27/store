import "server-only";

import { getTracker, listTrackers, saveCheck, setPlaceName } from "@/lib/db";
import { findRank } from "@/lib/naver";
import type { Tracker } from "@/types/rank";

/** 한국시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export async function runCheck(tracker: Tracker) {
  const base = { trackerId: tracker.id, checkDate: todayKst(), checkedAt: new Date().toISOString() };
  try {
    const r = await findRank(tracker.keyword, { placeId: tracker.placeId, text: tracker.placeInput });
    if (r.matched && r.matched.name !== tracker.placeName) setPlaceName(tracker.id, r.matched.name);
    saveCheck({ ...base, rank: r.rank, scanned: r.scanned, error: null });
    return { ok: true as const, rank: r.rank, scanned: r.scanned };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    saveCheck({ ...base, rank: null, scanned: 0, error });
    return { ok: false as const, error };
  }
}

export async function runCheckById(id: number) {
  const t = getTracker(id);
  if (!t) return null;
  return runCheck(t);
}

/** 전체 순차 조회 (매일 1회 스케줄러에서 호출) */
export async function runAllChecks() {
  const results = [];
  for (const t of listTrackers()) {
    results.push({ id: t.id, keyword: t.keyword, ...(await runCheck(t)) });
    await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}
