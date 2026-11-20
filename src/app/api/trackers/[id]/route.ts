import { NextResponse } from "next/server";

import { runCheckById } from "@/lib/checker";
import { deleteTracker, getTracker, listChecks } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: RouteContext<"/api/trackers/[id]">) {
  const id = Number((await ctx.params).id);
  const tracker = getTracker(id);
  if (!tracker) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ tracker, history: listChecks(id, 365) });
}

/** 지금 다시 조회 */
export async function POST(_: Request, ctx: RouteContext<"/api/trackers/[id]">) {
  const result = await runCheckById(Number((await ctx.params).id));
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(_: Request, ctx: RouteContext<"/api/trackers/[id]">) {
  deleteTracker(Number((await ctx.params).id));
  return new NextResponse(null, { status: 204 });
}
