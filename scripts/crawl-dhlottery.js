// ============================================================================
// 동행복권 회차별 결과 페이지 크롤러
// ============================================================================
//
// URL: https://dhlottery.co.kr/gameResult.do?method=byWin&drwNo=N
// 셀렉터:
//   - 당첨번호 6개: div.num.win span.ball_645
//   - 보너스번호:  div.num.bonus span.ball_645
//   - 추첨일:     p.desc 텍스트, "(YYYY년 M월 D일 추첨)" 정규식 파싱
// ============================================================================

const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function crawlDhLottery(round) {
  const url = `https://dhlottery.co.kr/gameResult.do?method=byWin&drwNo=${round}`;
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10_000,
  });

  const $ = cheerio.load(html);

  // 당첨번호 6개
  const numbers = $('div.num.win span.ball_645')
    .map((_, el) => parseInt($(el).text().trim(), 10))
    .get();

  if (numbers.length !== 6) {
    throw new Error(`${round}회차 당첨번호 파싱 실패 (${numbers.length}개 발견)`);
  }

  // 보너스 번호
  const bonusNo = parseInt($('div.num.bonus span.ball_645').text().trim(), 10);

  if (isNaN(bonusNo)) {
    throw new Error(`${round}회차 보너스번호 파싱 실패`);
  }

  // 추첨일 파싱: "(2026년 5월 9일 추첨)" → "2026-05-09"
  const dateText = $('p.desc').text();
  const match = dateText.match(/\((\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);

  if (!match) {
    throw new Error(`${round}회차 추첨일 파싱 실패`);
  }

  const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;

  // 검증: 모든 숫자가 1~45 범위
  const allNumbers = [...numbers, bonusNo];
  if (allNumbers.some(n => n < 1 || n > 45)) {
    throw new Error(`${round}회차 숫자 범위 오류: ${allNumbers}`);
  }

  return {
    drawNo: round,
    date,
    numbers: numbers.sort((a, b) => a - b),
    bonusNo,
  };
}

module.exports = { crawlDhLottery };
