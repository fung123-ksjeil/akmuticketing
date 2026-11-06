import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const catalog=readFileSync(new URL('../extension/practice-catalog.js',import.meta.url),'utf8');
const source=readFileSync(new URL('../extension/booking-entry.js',import.meta.url),'utf8');
function setup(buttons,url='https://ticket.yes24.com/Perf/60589'){
 const context=vm.createContext({URL,location:new URL(url),document:{querySelectorAll:()=>buttons}});vm.runInContext(catalog,context);vm.runInContext(source,context);return context.TicketBookingEntry;
}
function button(text,extra={}){return {textContent:text,disabled:false,getClientRects:()=>[{}],getAttribute:()=>null,querySelectorAll:()=>[],click(){this.clicks=(this.clicks||0)+1;},...extra};}
test('현재 공연에서 확인된 예매하기 버튼을 한 번 클릭',()=>{const book=button('예매하기'),pay=button('결제하기');setup([book,pay]).click('60589');assert.equal(book.clicks,1);assert.equal(pay.clicks,undefined);});
test('이미지형 예매 버튼의 alt를 인식',()=>{const book=button('',{querySelectorAll:()=>[{getAttribute:k=>k==='alt'?'예매하기':null}]});setup([book]).click('60589');assert.equal(book.clicks,1);});
test('다른 공연·중복 버튼·비활성 버튼은 클릭하지 않음',()=>{const a=button('예매하기'),b=button('예매하기');assert.throws(()=>setup([a],'https://ticket.yes24.com/Perf/60020').click('60589'));assert.throws(()=>setup([a,b]).click('60589'));assert.throws(()=>setup([button('예매하기',{disabled:true})]).click('60589'));assert.equal(a.clicks,undefined);assert.equal(b.clicks,undefined);});
