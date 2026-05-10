// ============================================================================
// transform.js
// smok95-source/results/all.json → lotto-history.json
// ============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INPUT = path.join(ROOT, 'smok95-source/results/all.json');
const OUTPUT = path.join(ROOT, 'lotto-history.json');

// 1) 입력 읽기
const raw = fs.readFileSync(INPUT, 'utf8');
const source = JSON.parse(raw);

if (!Array.isArray(source)) {
  console.error('Error: source is not an array');
  process.exit(1);
}

// 2) 형식 변환 (snake_case → camelCase, 불필요 필드 제거)
const transformed = source.map(item => ({
  drawNo: item.draw_no,
  date: typeof item.date === 'string' ? item.date.slice(0, 10) : null,
  numbers: item.numbers,
  bonusNo: item.bonus_no,
}));

// 3) drawNo 기준 오름차순 정렬
transformed.sort((a, b) => a.drawNo - b.drawNo);

const latestRound = transformed[transformed.length - 1].drawNo;

// 4) 검증
const issues = [];

// 4-1) 빠진 회차
const missing = [];
for (let i = 0; i < transformed.length; i++) {
  const expected = i + 1;
  if (transformed[i].drawNo !== expected) {
    missing.push({ index: i, expected, got: transformed[i].drawNo });
  }
}
if (missing.length > 0) {
  issues.push(`Missing/wrong rounds: ${JSON.stringify(missing.slice(0, 10))}${missing.length > 10 ? ` (+ ${missing.length - 10} more)` : ''}`);
}

// 4-2) numbers 길이 = 6
const wrongLen = transformed.filter(d => !Array.isArray(d.numbers) || d.numbers.length !== 6);
if (wrongLen.length > 0) {
  issues.push(`Wrong numbers length: ${wrongLen.length} entries (e.g. drawNo ${wrongLen[0].drawNo} has ${wrongLen[0].numbers?.length})`);
}

// 4-3) 1~45 범위
const outOfRange = [];
for (const d of transformed) {
  if (!Array.isArray(d.numbers)) continue;
  for (const n of d.numbers) {
    if (typeof n !== 'number' || n < 1 || n > 45) {
      outOfRange.push({ drawNo: d.drawNo, n });
      break;
    }
  }
}
if (outOfRange.length > 0) {
  issues.push(`Out of range: ${outOfRange.length} entries (e.g. drawNo ${outOfRange[0].drawNo} contains ${outOfRange[0].n})`);
}

// 4-4) 오름차순 정렬 (sort 후이므로 통과 보장이지만 확인 차원에서)
let sortedOk = true;
for (let i = 1; i < transformed.length; i++) {
  if (transformed[i].drawNo <= transformed[i - 1].drawNo) {
    sortedOk = false;
    break;
  }
}
if (!sortedOk) issues.push('Not sorted ascending');

// 5) 출력
const output = {
  updatedAt: new Date().toISOString(),
  latestRound,
  data: transformed,
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
const fileSize = fs.statSync(OUTPUT).size;

// 6) 통계 + 검증 결과 보고
console.log('=== 변환 결과 ===');
console.log(`총 회차 수      : ${transformed.length}`);
console.log(`1회차 날짜      : ${transformed[0].date}`);
console.log(`최신 회차       : ${latestRound}`);
console.log(`최신 회차 날짜  : ${transformed[transformed.length - 1].date}`);
console.log(`출력 파일       : ${OUTPUT}`);
console.log(`출력 파일 크기  : ${fileSize.toLocaleString()} bytes (${(fileSize / 1024).toFixed(1)} KB)`);
console.log('');
console.log('=== 검증 결과 ===');
if (issues.length === 0) {
  console.log('✅ 모든 검증 통과');
  console.log('   - 1 ~ ' + latestRound + ' 회차 빠짐 없음');
  console.log('   - 모든 회차 numbers 길이 = 6');
  console.log('   - 모든 숫자 1~45 범위');
  console.log('   - drawNo 오름차순 정렬');
} else {
  console.log('⚠️  검증 실패:');
  for (const issue of issues) console.log(`   - ${issue}`);
  process.exitCode = 1;
}
