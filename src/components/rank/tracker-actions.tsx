"use client";

import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function TrackerActions({ id, redirectOnDelete }: { id: number; redirectOnDelete?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"check" | "delete" | null>(null);

  async function recheck() {
    setBusy("check");
    await fetch(`/api/trackers/${id}`, { method: "POST" });
    setBusy(null);
    router.refresh();
  }

  async function remove() {
    if (!confirm("이 추적을 삭제할까요? 날짜별 기록도 함께 삭제됩니다.")) return;
    setBusy("delete");
    await fetch(`/api/trackers/${id}`, { method: "DELETE" });
    if (redirectOnDelete) router.push(redirectOnDelete);
    router.refresh();
  }

  return (
    <div className="flex gap-1.5">
      <Button variant="outline" size="sm" onClick={recheck} disabled={busy !== null}>
        {busy === "check" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        지금 조회
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={remove} disabled={busy !== null} aria-label="삭제">
        <Trash2 />
      </Button>
    </div>
  );
}
