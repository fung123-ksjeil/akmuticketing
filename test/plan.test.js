import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/plan.js';
const input={url:'https://tickets.example.org/concert/1',show:'2027-01-02T17:00',open:'2026-11-10T20:00',count:'2',sections:'104,105,104'};
test('여러 예매 사이트와 사용자 구역 설정 허용',()=>{const p=TicketPlan.normalizePlan(input);assert.deepEqual(p.sections,['104','105']);assert.equal(p.count,2);assert.equal(new URL(p.url).hostname,'tickets.example.org');});
test('비정상 URL·인증정보·수량·일시 거절',()=>{for(const override of [{url:'javascript:alert(1)'},{url:'http://example.org'},{url:'https://user:pass@example.org'},{count:0},{count:2.5},{open:'invalid'},{open:'2026-02-30T20:00'},{show:'2025-01-01T17:00'}])assert.throws(()=>TicketPlan.normalizePlan({...input,...override}));});
test('연습 localhost 허용과 한국시간 카운트다운',()=>{assert.equal(new URL(TicketPlan.normalizePlan({...input,url:'http://localhost:3000/demo.html'}).url).hostname,'localhost');assert.equal(TicketPlan.remaining('2026-11-10T20:00',Date.parse('2026-11-10T10:00Z')),'0일 01:00:00');});
