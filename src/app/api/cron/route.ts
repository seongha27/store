import { NextResponse } from "next/server";

import { runAllChecks } from "@/lib/checker";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * 매일 1회 전체 순위 조회. 외부 스케줄러(cron, Vercel Cron 등)에서 호출합니다.
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<도메인>/api/cron
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ results: await runAllChecks() });
}
