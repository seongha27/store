import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import type { RankCheck } from "@/types/rank";

export function RankValue({ check }: { check: RankCheck | null }) {
  if (!check) return <span className="text-muted-foreground">-</span>;
  if (check.error) return <span className="text-sm font-medium text-destructive">조회 실패</span>;
  if (check.rank == null)
    return <span className="text-sm font-medium text-muted-foreground">{check.scanned}위 밖</span>;
  return (
    <span className="font-semibold tabular-nums">
      <span className="text-3xl">{check.rank}</span>
      <span className="ml-0.5 text-base text-muted-foreground">위</span>
    </span>
  );
}

/** 전일 대비 변동. 순위 숫자가 줄면 상승. */
export function RankDelta({ latest, previous }: { latest: RankCheck | null; previous: RankCheck | null }) {
  if (latest?.rank == null || previous?.rank == null) return null;
  const diff = previous.rank - latest.rank;
  if (diff === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="size-3" /> 변동 없음
      </span>
    );
  const up = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-up" : "text-down"}`}>
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(diff)}
    </span>
  );
}
