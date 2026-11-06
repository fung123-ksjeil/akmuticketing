import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../extension/planner.js';
const choose=globalThis.TicketPlanner.chooseSeats;
const row=(section,n=8)=>Array.from({length:n},(_,i)=>({section,row:'A',number:i+1,available:true,block:'left'}));
test('구역 우선순위와 중앙 연속 좌석',()=>{const result=choose([...row('105'),...row('104')],2);assert.deepEqual(result.map(s=>[s.section,s.number]),[['104',4],['104',5]]);});
test('앞 구역에 연속 좌석이 없으면 다음 구역',()=>{const a=row('104').map(s=>({...s,available:s.number%2===1}));assert.equal(choose([...a,...row('105')],2)[0].section,'105');});
test('열과 통로를 가로질러 선택하지 않음',()=>{const a=row('104',2);a[1].block='right';assert.deepEqual(choose(a,2),[]);a[1].block='left';a[1].row='B';assert.deepEqual(choose(a,2),[]);});
test('부족하거나 잘못된 수량은 선택하지 않음',()=>{for(const n of [0,-1,1.5,11,9])assert.deepEqual(choose(row('104'),n),[]);});
test('매진 시 배치 좌표로 가장 가까운 구역 탐색',()=>{
 const seats=[...row('104').map(s=>({...s,available:false,x:s.number,y:0})),...row('far').map(s=>({...s,x:s.number+100,y:0})),...row('near').map(s=>({...s,x:s.number+10,y:0}))];
 assert.equal(TicketPlanner.chooseWithFallback(seats,2,['104'],true)[0].section,'near');
 assert.deepEqual(TicketPlanner.chooseWithFallback(seats,2,['104'],false),[]);
 assert.deepEqual(TicketPlanner.chooseWithFallback(seats.map(s=>({...s,x:null})),2,['104'],true),[]);
});
test('인접 구역도 붙은 좌석이 없으면 다음 가까운 구역',()=>{
 const seats=[...row('104').map(s=>({...s,available:false,x:s.number,y:0})),...row('near').map(s=>({...s,available:s.number%2===1,x:s.number+10,y:0})),...row('far').map(s=>({...s,x:s.number+100,y:0}))];
 assert.equal(TicketPlanner.chooseWithFallback(seats,2,['104'],true)[0].section,'far');
});
