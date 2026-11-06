import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const planSource=readFileSync(new URL('../extension/plan.js',import.meta.url),'utf8');
const backgroundSource=readFileSync(new URL('../extension/background.js',import.meta.url),'utf8');
function setup(){
 const opening=new Date(Date.now()+2*86400000);const kst=d=>new Date(d.getTime()+9*3600000).toISOString().slice(0,16);
 const plan={id:'concert-test',name:'테스트',url:'https://example.org/show',open:kst(opening),show:kst(new Date(opening.getTime()+86400000)),count:2,sections:['104']};
 const local={plans:[plan],profiles:{[plan.url]:{booking:'#booking'}}},session={},alarms=new Map(),tabs=new Map(),handlers={},calls=[];let tabId=0;
 const event=name=>({addListener(fn){handlers[name]=fn;}}),storage=data=>({async get(key){return Object.fromEntries((Array.isArray(key)?key:[key]).map(k=>[k,structuredClone(data[k])]));},async set(patch){Object.assign(data,structuredClone(patch));}});
 const chrome={storage:{local:storage(local),session:storage(session)},runtime:{onMessage:event('message')},alarms:{onAlarm:event('alarm'),async getAll(){return [...alarms.values()];},async create(name,info){alarms.set(name,{name,...info});},async clear(name){return alarms.delete(name);}},tabs:{onUpdated:event('updated'),onRemoved:event('removed'),async create({url}){const tab={id:++tabId,url,status:'complete'};tabs.set(tab.id,tab);calls.push(['open',url]);return tab;},async get(id){if(!tabs.has(id))throw Error('Tab missing');return tabs.get(id);},async update(id,patch){Object.assign(tabs.get(id),patch);calls.push(['update',id,patch]);return tabs.get(id);},async query(){return [...tabs.values()].slice(-1);}},scripting:{async executeScript(opts){calls.push(['script',opts]);return [{result:typeof opts.args?.[0]==='string'?true:'시작 대기를 켰습니다.'}];}},notifications:{onClicked:event('notification'),async create(id,data){calls.push(['notification',id,data]);},async clear(){}}};
 const context=vm.createContext({chrome,URL,Date,Set,console,setTimeout,clearTimeout});context.importScripts=()=>vm.runInContext(planSource,context);vm.runInContext(backgroundSource,context);
 const send=message=>new Promise(resolve=>handlers.message(message,{},resolve));
 return {plan,local,session,alarms,tabs,handlers,calls,send};
}
test('준비 알림은 미래 네 시점으로 저장하고 재등록 시 중복 없음',async()=>{const s=setup();assert.equal((await s.send({type:'reminders',id:s.plan.id})).count,4);assert.equal((await s.send({type:'reminders',id:s.plan.id})).count,4);assert.equal(s.alarms.size,4);});
test('10분 전 자동 열기 예약 및 취소',async()=>{const s=setup();assert.match((await s.send({type:'prepare',id:s.plan.id})).message,/10분 전/);assert.equal(s.alarms.get('prepare:'+s.plan.id).when,Date.parse(s.plan.open+'+09:00')-600000);await s.send({type:'cancel-prepare',id:s.plan.id});assert.equal(s.alarms.size,0);});
test('예약 시각에는 공연 탭을 열고 사용자 로그인 확인 전 자동 클릭하지 않음',async()=>{const s=setup();await s.handlers.alarm({name:'prepare:'+s.plan.id});assert.equal(s.tabs.size,1);assert.equal(s.calls.filter(c=>c[0]==='script').length,0);assert.equal(Object.values(s.session.preparedTabs)[0].confirmedLogin,false);});
test('사용자가 로그인 완료를 알리면 기존 공연 탭으로 복귀하고 자동 대기 실행',async()=>{const s=setup();await s.handlers.alarm({name:'prepare:'+s.plan.id});const result=await s.send({type:'login-done',id:s.plan.id});assert.match(result.message,/복귀/);assert.equal(s.tabs.size,1);assert.ok(s.calls.some(c=>c[0]==='script'&&c[1].args?.[0]?.preapproved===true));assert.equal(Object.keys(s.session.preparedTabs).length,0);});
test('예매 버튼 미설정 시 자동 열기 예약 거절',async()=>{const s=setup();s.local.profiles[s.plan.url]={};assert.match((await s.send({type:'prepare',id:s.plan.id})).error,/예매 버튼/);assert.equal(s.alarms.size,0);});
