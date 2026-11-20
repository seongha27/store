export interface Tracker {
  id: number;
  placeInput: string;
  placeId: string | null;
  placeName: string | null;
  keyword: string;
  createdAt: string;
}

export interface RankCheck {
  id: number;
  trackerId: number;
  /** YYYY-MM-DD, 한국시간 기준 */
  checkDate: string;
  checkedAt: string;
  /** 1부터 시작. null이면 조회 범위 안에서 찾지 못함 */
  rank: number | null;
  scanned: number;
  error: string | null;
}

export interface TrackerWithLatest extends Tracker {
  latest: RankCheck | null;
  previous: RankCheck | null;
  history: RankCheck[];
}

export interface PlaceItem {
  id: string;
  name: string;
  address?: string;
  roadAddress?: string;
  category?: string;
}
