// ============================================================================
// 동행복권 회차별 결과 조회 (lt645 신규 SPA API, Playwright 경유)
// ============================================================================
//
// 2026년 1월 사이트 리뉴얼 이후 옛 gameResult.do?method=byWin 페이지는 404.
// 새 SPA 페이지(https://www.dhlottery.co.kr/lt645/result)가 내부에서 호출하는
// JSON 엔드포인트를 사용한다.
//
// 단 이 엔드포인트는 axios/curl 같은 비-브라우저 트래픽을 차단(연결 타임아웃)
// 하므로 Playwright(헤드리스 Chromium)로 실제 페이지를 띄운 뒤 그 페이지 안에서
// fetch로 API를 호출하여 응답을 받는다.
//
// 엔드포인트: GET /lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=<회차>
// 응답: { resultCode, resultMessage, data: { list: [ {…} ] } }
//   - ltEpsd       : 회차 번호
//   - tm1WnNo~tm6WnNo : 당첨번호 6개
//   - bnsWnNo      : 보너스번호
//   - ltRflYmd     : 추첨일 (YYYYMMDD)
// ============================================================================

const { chromium } = require('playwright');

const HOST_URL = 'https://www.dhlottery.co.kr/lt645/result';
const API_BASE = 'https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let _browserPromise = null;
let _pagePromise = null;

async function _getPage() {
  if (_pagePromise) return _pagePromise;

  _pagePromise = (async () => {
    if (!_browserPromise) _browserPromise = chromium.launch();
    const browser = await _browserPromise;
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();
    // 페이지 컨텍스트(쿠키/세션) 확보를 위해 결과 페이지에 먼저 진입.
    // API URL은 동일 origin이라 이 페이지 안의 fetch가 정상 통과한다.
    await page.goto(HOST_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    return page;
  })();

  return _pagePromise;
}

async function closeBrowser() {
  if (_browserPromise) {
    try {
      const browser = await _browserPromise;
      await browser.close();
    } catch (_) {
      // 정리 단계 에러는 무시
    }
    _browserPromise = null;
    _pagePromise = null;
  }
}

async function crawlDhLottery(round) {
  const page = await _getPage();
  const url = `${API_BASE}?srchDir=center&srchLtEpsd=${round}`;

  let payload;
  try {
    payload = await page.evaluate(async u => {
      const r = await fetch(u, { credentials: 'include' });
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}`);
      }
      return await r.json();
    }, url);
  } catch (err) {
    throw new Error(`${round}회차 API 호출 실패: ${err.message}`);
  }

  if (!payload || !payload.data || !Array.isArray(payload.data.list)) {
    throw new Error(
      `${round}회차 응답 구조 이상: ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }

  const item = payload.data.list.find(x => Number(x.ltEpsd) === round);
  if (!item) {
    const got = payload.data.list.map(x => x.ltEpsd).join(',');
    throw new Error(`${round}회차 응답 list에 해당 회차 없음 (반환: ${got})`);
  }

  // 당첨번호 6개
  const numbers = [
    item.tm1WnNo,
    item.tm2WnNo,
    item.tm3WnNo,
    item.tm4WnNo,
    item.tm5WnNo,
    item.tm6WnNo,
  ].map(Number);

  if (numbers.length !== 6 || numbers.some(n => !Number.isFinite(n))) {
    throw new Error(
      `${round}회차 당첨번호 파싱 실패: ${JSON.stringify(numbers)}`,
    );
  }

  // 보너스 번호
  const bonusNo = Number(item.bnsWnNo);
  if (!Number.isFinite(bonusNo)) {
    throw new Error(`${round}회차 보너스번호 파싱 실패: ${item.bnsWnNo}`);
  }

  // 추첨일 YYYYMMDD → YYYY-MM-DD
  const ymd = String(item.ltRflYmd);
  if (!/^\d{8}$/.test(ymd)) {
    throw new Error(`${round}회차 추첨일 형식 이상: ${ymd}`);
  }
  const date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;

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

// 프로세스 종료 시 자동 정리(update.js 등 호출처가 close를 안 부르더라도)
process.on('beforeExit', async () => {
  await closeBrowser();
});

module.exports = { crawlDhLottery, closeBrowser };
