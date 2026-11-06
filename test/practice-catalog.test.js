import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/practice-catalog.js';
test('실제 연습 대상은 지정한 두 공연만 허용',()=>{assert.equal(PracticeCatalog.targets.length,2);assert.equal(PracticeCatalog.matches('https://ticket.yes24.com/Perf/60589','60589'),true);assert.equal(PracticeCatalog.matches('https://ticket.yes24.com/Special/60020','60020'),true);});
test('다른 공연·유사 도메인·로그인 화면을 대상으로 오인하지 않음',()=>{for(const url of ['https://ticket.yes24.com/Special/60840','https://ticket.yes24.com.evil.test/Perf/60589','http://ticket.yes24.com/Perf/60589','https://ticket.yes24.com/login?IdPerf=60589'])assert.equal(PracticeCatalog.matches(url,'60589'),false);});
test('예매창의 공연 번호까지 일치해야 함',()=>{assert.equal(PracticeCatalog.matches('https://ticket.yes24.com/Pages/Perf/Sale/PerfSaleProcess.aspx?IdPerf=60589','60589'),true);assert.equal(PracticeCatalog.matches('https://ticket.yes24.com/Pages/Perf/Sale/PerfSaleProcess.aspx?IdPerf=60020','60589'),false);});
test('빠른 날짜·회차 후보 선택 및 이미 지난 회차 제외',()=>{const now=Date.parse('2026-12-19T07:30Z');assert.deepEqual(PracticeCatalog.earliest(['2026-12-20','2026-12-19'],['17:00','16:00'],now),{date:'2026-12-19',time:'17:00'});assert.equal(PracticeCatalog.earliest(['2026-12-18'],['17:00'],now),null);});
