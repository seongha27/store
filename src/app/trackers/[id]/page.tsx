import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RankDelta, RankValue } from "@/components/rank/rank-badge";
import { RankChart } from "@/components/rank/rank-chart";
import { TrackerActions } from "@/components/rank/tracker-actions";
import { getTracker, listChecks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TrackerPage({ params }: PageProps<"/trackers/[id]">) {
  const id = Number((await params).id);
  const tracker = getTracker(id);
  if (!tracker) notFound();
  const history = listChecks(id, 90);
  const latest = history.at(-1) ?? null;
  const previous = history.at(-2) ?? null;
  const ranked = history.filter((c) => c.rank != null).map((c) => c.rank as number);
  const best = ranked.length ? Math.min(...ranked) : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 전체 목록
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{tracker.placeName ?? tracker.placeInput}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            키워드 <span className="font-medium text-foreground">{tracker.keyword}</span>
            {tracker.placeId && <> · 플레이스 ID {tracker.placeId}</>}
          </p>
        </div>
        <TrackerActions id={tracker.id} redirectOnDelete="/" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="현재 순위">
          <RankValue check={latest} />
          <div><RankDelta latest={latest} previous={previous} /></div>
        </Stat>
        <Stat label="최고 순위">
          <span className="text-3xl font-semibold tabular-nums">{best ?? "-"}</span>
          {best && <span className="ml-0.5 text-muted-foreground">위</span>}
        </Stat>
        <Stat label="기록 일수">
          <span className="text-3xl font-semibold tabular-nums">{history.length}</span>
          <span className="ml-0.5 text-muted-foreground">일</span>
        </Stat>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">날짜별 순위 변화</h2>
        <RankChart history={history} />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">날짜</th>
              <th className="px-4 py-2.5 font-medium">순위</th>
              <th className="px-4 py-2.5 font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2.5 tabular-nums">{c.checkDate}</td>
                <td className="px-4 py-2.5 font-medium tabular-nums">
                  {c.rank != null ? `${c.rank}위` : c.error ? "-" : `${c.scanned}위 밖`}
                </td>
                <td className="truncate px-4 py-2.5 text-xs text-muted-foreground">
                  {c.error ?? (c.rank != null ? "" : `상위 ${c.scanned}개 안에 없음`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
