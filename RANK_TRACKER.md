# 네이버 플레이스 순위 트래커

플레이스 주소(URL·ID·naver.me 링크·도로명 주소)와 대표 키워드를 등록하면, 네이버에서 그 키워드로
검색했을 때 몇 위인지 조회하고 **하루 1건씩 날짜별로 기록**합니다.

## 실행

```bash
npm install
npm run dev          # http://localhost:3000
```

네이버에 접속하지 않고 화면만 확인하려면 모의 데이터 모드를 쓰세요: `NAVER_MOCK=1 npm run dev`

## 환경 변수 (.env.local)

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `CRON_SECRET` | `/api/cron` 호출용 비밀키 | (필수, 없으면 cron 비활성) |
| `DATABASE_PATH` | SQLite 파일 위치 | `data/rank.db` |
| `NAVER_MAX_RESULTS` | 몇 위까지 확인할지 | `300` |
| `NAVER_COORD_X` / `NAVER_COORD_Y` | 검색 기준 좌표(경도/위도) | 서울시청 |
| `NAVER_MOCK` | `1`이면 모의 데이터 | - |

## 매일 자동 기록

서버에서 하루 한 번 아래를 호출하세요(예: crontab `0 9 * * *`).

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<도메인>/api/cron
```

## 구조

- `src/lib/naver.ts`: 순위 조회(GraphQL → 지도 검색 순서로 시도). **네이버 응답 형식이 바뀌면 여기만 고치면 됩니다.**
- `src/lib/checker.ts`: 조회 결과를 날짜별로 저장
- `src/lib/db.ts`: SQLite (`trackers`, `rank_checks`)
- `src/app/api/*`: 등록·재조회·삭제·cron API
- `src/app/page.tsx`, `src/app/trackers/[id]/page.tsx`: 대시보드, 상세(그래프·기록표)

## 주의

- 네이버는 공식 플레이스 순위 API를 제공하지 않습니다. 비공개 웹 엔드포인트를 쓰므로 언제든 막히거나 바뀔 수 있고,
  자동 수집은 네이버 이용약관과 충돌할 수 있습니다. 상용화 전에 검토가 필요합니다.
- 키워드에 지역명이 없으면 검색 위치에 따라 순위가 달라집니다.
- SQLite 파일은 Vercel 같은 서버리스 환경에서는 유지되지 않습니다. VPS에 배포하거나 DB를 Postgres(Supabase 등)로 바꾸세요.
