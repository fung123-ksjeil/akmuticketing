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
test('앞·중간·뒤는 실제 열 순서로 구분함',()=>{
 const seats=Array.from({length:9},(_,i)=>row('104',4).map(s=>({...s,row:String(i+1),rowIndex:i+1,rowTotal:9}))).flat();
 for(const [position,valid] of [['front',[1,2,3]],['middle',[4,5,6]],['back',[7,8,9]]]){const group=TicketPlanner.chooseWithFallback(seats,4,['104'],false,position);assert.equal(group.length,4);assert.ok(group.every(s=>valid.includes(s.rowIndex)));}
 assert.deepEqual(TicketPlanner.chooseWithFallback(row('104'),2,['104'],false,'middle'),[]);
});
test('구역·중앙 선호 없이 처음 발견한 연속 2석',()=>{const seats=[...row('other').filter(s=>[1,3,4].includes(s.number)),...row('104')];assert.deepEqual(TicketPlanner.chooseFirstAdjacent(seats).map(s=>[s.section,s.number]),[['other',3],['other',4]]);assert.deepEqual(TicketPlanner.chooseFirstAdjacent([{section:'A',row:'1',number:1,block:'L',available:true},{section:'A',row:'1',number:2,block:'R',available:true}]),[]);});
