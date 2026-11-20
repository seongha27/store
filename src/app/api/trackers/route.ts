import { NextResponse } from "next/server";

import { runCheck } from "@/lib/checker";
import { createTracker, listTrackersWithLatest } from "@/lib/db";
import { resolvePlaceInput } from "@/lib/naver";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listTrackersWithLatest());
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { place?: string; keyword?: string } | null;
  const place = body?.place?.trim() ?? "";
  const keyword = body?.keyword?.trim() ?? "";
  if (!place || !keyword) {
    return NextResponse.json({ error: "플레이스 주소와 키워드를 모두 입력해 주세요." }, { status: 400 });
  }
  const placeId = await resolvePlaceInput(place);
  const tracker = createTracker({ placeInput: place, placeId, keyword });
  const result = await runCheck(tracker); // 등록 즉시 첫 조회
  return NextResponse.json({ tracker, result }, { status: 201 });
}
