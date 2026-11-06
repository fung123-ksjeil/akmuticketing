import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/yes24-sequence.js';
const map=Object.fromEntries(TicketYes24Flow.required.map(key=>[key,'#'+key]));
test('제공한 날짜·회차·좌석·다음 3회·무통장입금 순서로 구성',()=>{const steps=TicketYes24Flow.build({show:'2027-01-02T17:00'},map);assert.equal(steps[1].date,'2027-01-02');assert.equal(steps[2].time,'17:00');assert.equal(steps.filter(s=>s.label.startsWith('다음단계')).length,3);assert.deepEqual(steps.slice(-4).map(s=>s.type),['check','bank','check','submit-bank-booking']);assert.ok(steps.filter(s=>s.label.startsWith('다음단계')).every(s=>s.leave&&s.arrive));});
test('실제 DOM 선택자가 부족하면 순서를 임의 실행하지 않음',()=>{assert.throws(()=>TicketYes24Flow.build({show:'2027-01-02T17:00'},{}),/단계 설정 필요/);});
test('연월·선택 날짜·17시 회차를 정확히 구분',()=>{assert.equal(TicketYes24Flow.monthIndex('2027. 01'),2027*12);assert.equal(TicketYes24Flow.monthIndex('알 수 없음'),null);assert.equal(TicketYes24Flow.sameDate('2027. 01. 02.','2027-01-02'),true);assert.equal(TicketYes24Flow.sameDate('2026. 12. 19.','2027-01-02'),false);assert.equal(TicketYes24Flow.sameTime('[1회] 17시 00분','17:00'),true);assert.equal(TicketYes24Flow.sameTime('17:00','17:00'),true);assert.equal(TicketYes24Flow.sameTime('16시 00분','17:00'),false);});

test('국민은행 우선, 없거나 점검중이면 첫 유효 은행 선택',()=>{
 const option=(value,textContent,extra={})=>({value,textContent,...extra});
 const placeholder=option('','입금은행 선택'),ibk=option('003','기업은행'),kb=option('004','KB국민은행');
 assert.equal(TicketYes24Flow.chooseBank([placeholder,ibk,kb]),kb);
 assert.equal(TicketYes24Flow.chooseBank([placeholder,ibk]),ibk);
 assert.equal(TicketYes24Flow.chooseBank([placeholder,{...kb,disabled:true},ibk]),ibk);
 assert.equal(TicketYes24Flow.chooseBank([option('004','국민은행 (점검중)'),ibk]),ibk);
 assert.equal(TicketYes24Flow.chooseBank([option('0','은행 선택'),{...kb,disabled:true}]),null);
});
