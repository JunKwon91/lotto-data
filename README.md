# lotto-data

한국 로또 6/45 당첨 번호 데이터셋. 1회차(2002-12-07)부터 최신 회차까지.

## Usage

Raw URL:
```
https://raw.githubusercontent.com/JunKwon91/lotto-data/main/data/lotto-history.json
```

```javascript
const response = await fetch(
  'https://raw.githubusercontent.com/JunKwon91/lotto-data/main/data/lotto-history.json'
);
const { data, latestRound, updatedAt } = await response.json();
```

## Format

```json
{
  "updatedAt": "2026-05-10T10:25:38.132Z",
  "latestRound": 1223,
  "data": [
    {
      "drawNo": 1,
      "date": "2002-12-07",
      "numbers": [10, 23, 29, 33, 37, 40],
      "bonusNo": 16
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `drawNo` | number | 회차 번호 |
| `date` | string | 추첨일 (ISO 8601, YYYY-MM-DD) |
| `numbers` | number[] | 당첨 번호 6개 (오름차순) |
| `bonusNo` | number | 보너스 번호 |

## Update Schedule

매주 토요일 22:00 KST에 GitHub Actions로 자동 갱신 예정 (Phase 2).

## Source

초기 데이터는 [smok95/lotto](https://github.com/smok95/lotto)에서 가져옴. 추후 네이버 검색 결과 파싱으로 자동 갱신.

## License

MIT
