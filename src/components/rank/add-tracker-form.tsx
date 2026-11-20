"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AddTrackerForm() {
  const router = useRouter();
  const [place, setPlace] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ place, keyword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "등록에 실패했습니다.");
      const r = json.result as { ok: boolean; rank?: number | null; scanned?: number; error?: string };
      setMessage(
        !r.ok
          ? { tone: "err", text: `등록은 됐지만 조회에 실패했어요: ${r.error}` }
          : r.rank
            ? { tone: "ok", text: `“${keyword}” 검색 시 현재 ${r.rank}위입니다.` }
            : { tone: "ok", text: `상위 ${r.scanned}개 안에 없습니다. 매일 계속 추적합니다.` },
      );
      setPlace("");
      setKeyword("");
      router.refresh();
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">플레이스 주소</span>
          <input
            required
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="https://m.place.naver.com/restaurant/1234567"
            className="h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">대표 키워드</span>
          <input
            required
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 강남역 맛집"
            className="h-11 rounded-lg border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
          />
        </label>
        <Button
          type="submit"
          disabled={pending}
          className="h-11 bg-brand px-5 text-white hover:bg-brand/90"
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          {pending ? "조회 중…" : "순위 추적 시작"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        플레이스 URL·플레이스 ID·naver.me 공유링크를 넣으면 가장 정확합니다. 도로명 주소를 넣으면 주소가 일치하는 업체로 찾습니다.
      </p>
      {message && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            message.tone === "ok" ? "bg-brand/10 text-brand-strong" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
