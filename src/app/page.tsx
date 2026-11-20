import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import { AddTrackerForm } from "@/components/rank/add-tracker-form";
import { RankDelta, RankValue } from "@/components/rank/rank-badge";
import { RankChart } from "@/components/rank/rank-chart";
import { TrackerActions } from "@/components/rank/tracker-actions";
import { listTrackersWithLatest } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const trackers = listTrackersWithLatest();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-strong">
          <MapPin className="size-3.5" /> 네이버 플레이스 순위 트래커
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">내 가게, 오늘 몇 위일까?</h1>
        <p className="mt-2 text-muted-foreground">
          플레이스 주소와 대표 키워드를 등록하면 네이버 검색 순위를 매일 기록해 드립니다.
        </p>
      </header>

      <AddTrackerForm />

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">추적 중인 플레이스</h2>
          <span className="text-sm text-muted-foreground">{trackers.length}개</span>
        </div>

        {trackers.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            아직 등록된 플레이스가 없습니다. 위에서 첫 번째 플레이스를 등록해 보세요.
          </div>
        ) : (
          <ul className="grid gap-3">
            {trackers.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:p-5"
              >
                <Link href={`/trackers/${t.id}`} className="group min-w-0">
                  <p className="flex items-center gap-1 truncate font-medium group-hover:underline">
                    {t.placeName ?? t.placeInput}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    키워드 <span className="font-medium text-foreground">{t.keyword}</span>
                    {t.latest && <> · {t.latest.checkDate} 기준</>}
                  </p>
                </Link>
                <div className="text-right">
                  <RankValue check={t.latest} />
                  <div>
                    <RankDelta latest={t.latest} previous={t.previous} />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <RankChart history={t.history} compact />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <TrackerActions id={t.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
