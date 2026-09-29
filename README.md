# 미국 서부 캐년 로드트립 (2026.10.02 – 10.13)

2인 · 11박 · SFO 입국 / LAX 출국 · RV 리로케이션 2구간 + 렌터카

## 파일
- `index.html` — 일자별 상세 일정표 (기상·출발·일출·일몰 시각, 덤프·주유, 비용, 출발 전 확인 목록, 날짜별 메모)
- `firebase-sync.js` — GitHub Pages에서 구글 로그인 후 체크·메모를 Firestore로 공유
- `firestore.rules` — 허용된 두 계정만 읽고 쓰게 하는 Firestore 보안 규칙
- `data/us-west-trip-26.10.02-26.10.13.kmz` — 경로·장소 (Google Earth / My Maps에서 가져오기)

## 구간
| 구간 | 기간 | 차량 |
|---|---|---|
| 1 | 10/3 더블린 → 10/6 라스베가스 | El Monte RV (imoova) |
| 2 | 10/6 헨더슨 → 10/10 아파치정션 | Indie Campers Winnebago 59PX (imoova) |
| 3 | 10/10 → 10/13 LAX | 렌터카 (미정) |

## 공유 저장 설정 (Firebase)
1. Firestore Database → 규칙 탭에 `firestore.rules` 내용을 붙여넣고 게시
2. Authentication → 로그인 방법 → Google 사용
3. Authentication → 설정 → 승인된 도메인에 `lemzea.github.io` 추가
4. GitHub 저장소 Settings → Pages → Branch `main` / `/ (root)`

로그인하지 않으면 체크·메모는 그 기기에만 저장됩니다.
