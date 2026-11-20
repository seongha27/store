import "server-only";

import type { PlaceItem } from "@/types/rank";

/**
 * 네이버 플레이스 순위 조회 모듈.
 *
 * ⚠️ 네이버는 공식 "플레이스 순위" API를 제공하지 않습니다. 아래 전략들은 네이버 지도/플레이스
 * 웹이 내부적으로 사용하는 엔드포인트를 호출하며, 네이버가 응답 형식을 바꾸면 수정이 필요합니다.
 * 각 전략은 독립적이라 하나가 막혀도 다음 전략으로 넘어갑니다.
 */

const MAX_RESULTS = Number(process.env.NAVER_MAX_RESULTS ?? 300);
const PAGE_SIZE = 50;
// 검색 기준 좌표 (기본: 서울시청). 지역명이 없는 키워드는 좌표에 따라 순위가 달라집니다.
const COORD_X = process.env.NAVER_COORD_X ?? "126.9783882";
const COORD_Y = process.env.NAVER_COORD_Y ?? "37.5666103";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// ─── 입력 해석 ────────────────────────────────────────────────────────────────

/** 플레이스 URL / ID 에서 숫자 ID를 뽑습니다. 주소·상호 텍스트면 null. */
export function parsePlaceId(input: string): string | null {
  const s = input.trim();
  if (/^\d{5,}$/.test(s)) return s;
  const m =
    s.match(/\/(?:place|restaurant|cafe|hairshop|hospital|accommodation|nailshop|beauty)\/(\d{5,})/) ??
    s.match(/[?&](?:id|placeId)=(\d{5,})/) ??
    s.match(/entry\/place\/(\d{5,})/);
  return m ? m[1] : null;
}

/** naver.me 단축링크를 실제 URL로 풀어서 ID를 찾습니다. */
export async function resolvePlaceInput(input: string): Promise<string | null> {
  const direct = parsePlaceId(input);
  if (direct) return direct;
  if (/^https?:\/\/naver\.me\//.test(input.trim())) {
    try {
      const res = await fetch(input.trim(), { redirect: "manual", headers: { "user-agent": UA } });
      const loc = res.headers.get("location");
      if (loc) return parsePlaceId(loc);
    } catch {
      /* 무시하고 주소 매칭으로 */
    }
  }
  return null;
}

const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, "").toLowerCase();

/** 결과 항목이 사용자가 지정한 플레이스인지 판단 */
export function matchesTarget(item: PlaceItem, target: { placeId: string | null; text: string }) {
  if (target.placeId) return item.id === target.placeId;
  const t = norm(target.text);
  if (!t) return false;
  return (
    norm(item.roadAddress).includes(t) ||
    norm(item.address).includes(t) ||
    norm(item.name) === t
  );
}

// ─── 검색 전략 ────────────────────────────────────────────────────────────────

type PageFetcher = (keyword: string, start: number) => Promise<PlaceItem[]>;

/** 전략 1: pcmap GraphQL (PC 플레이스 목록과 동일한 순서) */
const graphqlPlaces: PageFetcher = async (keyword, start) => {
  const body = [
    {
      operationName: "getPlacesList",
      variables: {
        input: {
          query: keyword,
          start,
          display: PAGE_SIZE,
          adult: false,
          spq: false,
          queryRank: "",
          x: COORD_X,
          y: COORD_Y,
          deviceType: "pcmap",
          bounds: "",
        },
        isNmap: true,
        isBounds: false,
      },
      query:
        "query getPlacesList($input: PlacesInput) { businesses: places(input: $input) { total items { id name category address roadAddress } } }",
    },
  ];
  const res = await fetch("https://pcmap-api.place.naver.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: `https://pcmap.place.naver.com/place/list?query=${encodeURIComponent(keyword)}`,
      "user-agent": UA,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`graphql HTTP ${res.status}`);
  const json = (await res.json()) as Array<{
    data?: { businesses?: { items?: PlaceItem[] } };
  }>;
  return (json[0]?.data?.businesses?.items ?? []).map((i) => ({ ...i, id: String(i.id) }));
};

/** 전략 2: 네이버 지도 통합검색 API */
const mapAllSearch: PageFetcher = async (keyword, start) => {
  const page = Math.floor(start / PAGE_SIZE) + 1;
  const url =
    `https://map.naver.com/p/api/search/allSearch?query=${encodeURIComponent(keyword)}` +
    `&type=all&searchCoord=${COORD_X};${COORD_Y}&page=${page}&displayCount=${PAGE_SIZE}&isPlaceRecommendationReplace=true&lang=ko`;
  const res = await fetch(url, {
    headers: { referer: "https://map.naver.com/", "user-agent": UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`allSearch HTTP ${res.status}`);
  const json = (await res.json()) as {
    result?: { place?: { list?: Array<PlaceItem & { id: string | number }> } };
  };
  return (json.result?.place?.list ?? []).map((i) => ({
    id: String(i.id),
    name: i.name,
    address: i.address,
    roadAddress: i.roadAddress,
    category: Array.isArray(i.category) ? i.category.join(",") : i.category,
  }));
};

/** 개발용: 네트워크 없이 화면 흐름을 확인하는 모의 데이터 (NAVER_MOCK=1) */
const mockFetcher: PageFetcher = async (keyword, start) => {
  const seed = [...keyword].reduce((a, c) => a + c.charCodeAt(0), 0) + new Date().getDate();
  return Array.from({ length: PAGE_SIZE }, (_, i) => {
    const n = start + i;
    return { id: String(1000000 + ((n * 7919 + seed) % 300)), name: `모의 업체 ${n + 1}` };
  });
};

const STRATEGIES: Array<[string, PageFetcher]> =
  process.env.NAVER_MOCK === "1"
    ? [["mock", mockFetcher]]
    : [
        ["graphql", graphqlPlaces],
        ["allSearch", mapAllSearch],
      ];

// ─── 순위 조회 ────────────────────────────────────────────────────────────────

export interface RankResult {
  rank: number | null;
  scanned: number;
  matched: PlaceItem | null;
  strategy: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function findRank(
  keyword: string,
  target: { placeId: string | null; text: string },
): Promise<RankResult> {
  const errors: string[] = [];

  for (const [name, fetchPage] of STRATEGIES) {
    try {
      const seen = new Set<string>();
      let position = 0;
      for (let start = 1; start <= MAX_RESULTS; start += PAGE_SIZE) {
        const items = await fetchPage(keyword, start);
        if (items.length === 0) break;
        for (const item of items) {
          if (seen.has(item.id)) continue; // 광고/중복 제거
          seen.add(item.id);
          position += 1;
          if (matchesTarget(item, target)) {
            return { rank: position, scanned: position, matched: item, strategy: name };
          }
        }
        if (items.length < PAGE_SIZE) break;
        await sleep(400); // 과도한 요청 방지
      }
      if (position > 0) return { rank: null, scanned: position, matched: null, strategy: name };
      errors.push(`${name}: 결과 없음`);
    } catch (e) {
      errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`순위 조회 실패 (${errors.join(" / ")})`);
}
