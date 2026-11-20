import type { RankCheck } from "@/types/rank";

/**
 * 날짜별 순위 선 그래프. 순위는 숫자가 작을수록 좋으므로 1위가 위쪽에 오도록 축을 뒤집습니다.
 * compact=true 이면 카드용 스파크라인.
 */
export function RankChart({ history, compact = false }: { history: RankCheck[]; compact?: boolean }) {
  const W = compact ? 120 : 720;
  const H = compact ? 36 : 260;
  const pad = compact ? { t: 4, r: 4, b: 4, l: 4 } : { t: 16, r: 16, b: 32, l: 40 };
  const points = history.filter((c) => c.rank != null) as Array<RankCheck & { rank: number }>;

  if (points.length === 0) {
    return compact ? (
      <span className="text-xs text-muted-foreground">기록 없음</span>
    ) : (
      <div className="grid h-40 place-items-center text-sm text-muted-foreground">
        아직 순위 기록이 없습니다.
      </div>
    );
  }

  const ranks = points.map((p) => p.rank);
  const best = Math.max(1, Math.min(...ranks) - 1);
  const worst = Math.max(...ranks) + 1;
  const n = history.length;
  const x = (i: number) => pad.l + (n === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (n - 1));
  const y = (r: number) => pad.t + ((r - best) / Math.max(1, worst - best)) * (H - pad.t - pad.b);

  const coords = history
    .map((c, i) => (c.rank == null ? null : ([x(i), y(c.rank), c] as const)))
    .filter((v) => v !== null);
  const d = coords.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const ticks = compact ? [] : Array.from(new Set([best, Math.round((best + worst) / 2), worst]));
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={compact ? "h-9 w-30" : "h-auto w-full"}
      role="img"
      aria-label="날짜별 순위 그래프"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray="3 4" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
            {t}위
          </text>
        </g>
      ))}
      {!compact &&
        history.map((c, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={c.checkDate} x={x(i)} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">
              {c.checkDate.slice(5).replace("-", ".")}
            </text>
          ) : null,
        )}
      <path d={d} fill="none" className="stroke-brand" strokeWidth={compact ? 1.75 : 2.25} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([px, py, c], i) => (
        <circle
          key={c.checkDate}
          cx={px}
          cy={py}
          r={compact ? (i === coords.length - 1 ? 2.5 : 0) : 4}
          className="fill-background stroke-brand"
          strokeWidth={2}
        >
          <title>{`${c.checkDate} · ${c.rank}위`}</title>
        </circle>
      ))}
    </svg>
  );
}
