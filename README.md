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

매주 토요일 22:00 KST(13:00 UTC)에 GitHub Actions로 자동 갱신된다. 누락 회차만 증분 크롤링 후 변경 시 자동 커밋·푸시.

## Source

초기 데이터는 [smok95/lotto](https://github.com/smok95/lotto)에서 부트스트랩했고, 이후 회차는 동행복권(dhlottery.co.kr) 사이트를 Playwright로 크롤링해 갱신한다.

설계 결정의 배경은 [DECISIONS.md](DECISIONS.md) 참고.

## License

MIT
