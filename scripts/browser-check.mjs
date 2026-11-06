// npm install --no-save --package-lock=false playwright, then npm run test:browser.
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(import.meta.dirname,'..');
const profile=await mkdtemp(join(tmpdir(),'concert-browser-'));
const context=await chromium.launchPersistentContext(profile,{headless:true,ignoreDefaultArgs:['--disable-extensions'],executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox',`--disable-extensions-except=${root}/extension`,`--load-extension=${root}/extension`]});
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
try{
 const page=await context.newPage();
 await page.goto(base);assert.equal(await page.title(),'악뮤 고양 킨텍스 예매 도우미');
 await page.getByRole('button',{name:'106구역',exact:true}).click();
 await page.getByLabel('앞쪽',{exact:true}).check();await page.getByLabel('예매 수량 · 최대 4매').selectOption('4');
 await page.getByRole('button',{name:'설정 저장',exact:true}).click();await page.reload();
 assert.equal(await page.getByLabel('희망 구역').inputValue(),'106');assert.equal(await page.getByLabel('예매 수량 · 최대 4매').inputValue(),'4');assert.equal(await page.getByLabel('앞쪽',{exact:true}).isChecked(),true);
 assert.equal(await page.locator('input[type=url]').count(),0);assert.equal(await page.getByRole('button',{name:'106구역',exact:true}).getAttribute('aria-pressed'),'true');
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'확장에 전달할 설정 받기 ↓'}).click();const file=await download;const stream=await file.createReadStream();let body='';for await(const chunk of stream)body+=chunk;assert.deepEqual(JSON.parse(body),{section:'106',position:'front',count:4});
 console.log('PASS AKMU-only dashboard: interactive map, front/middle/back, 1–4 tickets, persistence, settings export');
 await page.goto(base+'/demo.html');
 await page.addScriptTag({url:base+'/extension/plan.js'});await page.addScriptTag({url:base+'/extension/planner.js'});await page.addScriptTag({url:base+'/extension/runner.js'});
 page.on('dialog',dialog=>dialog.accept());
 const config={plan:{id:'test',name:'연습 공연',url:base+'/demo.html',show:new Date(Date.now()+33*3600000).toISOString().slice(0,16),open:new Date(Date.now()+9*3600000).toISOString().slice(0,16),count:2,sections:['104','105','106','103','107']},booking:'#booking',seat:'.demo-seat',adjacent:true,flow:'WAIT #human-check\nSEATS\n#seat-next\nWAIT #payment\n#receipt',manualGate:'#human-check, #payment'};
 const result=await page.evaluate(c=>TicketRunner('arm',c),config);assert.match(result,/시작 대기/);
 await page.waitForSelector('#human-check:visible');await page.waitForTimeout(1000);assert.equal(await page.locator('.demo-seat.selected').count(),0);
 await page.getByRole('button',{name:'내가 직접 확인 완료'}).click();await page.waitForSelector('#payment:visible');
 assert.equal(await page.locator('.demo-seat.selected').count(),2);assert.deepEqual(await page.locator('.demo-seat.selected').evaluateAll(es=>es.map(e=>e.dataset.section)),['108','108']);
 await page.waitForTimeout(1000);assert.equal(await page.locator('#receipt').isVisible(),false);
 await page.getByRole('button',{name:'연습 결제 완료'}).click();await page.waitForFunction(()=>document.querySelector('#done').textContent.includes('연습 완료'));
 console.log('PASS automation: booking → human pause → adjacent contiguous seats → payment pause → resume → receipt');
 // Extension popup must load as a real extension, not just as a web page.
 if(!process.argv.includes('--web-only')){
 let [worker]=context.serviceWorkers();if(!worker)worker=await context.waitForEvent('serviceworker');
 const extensionId=new URL(worker.url()).host;const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);await popup.waitForSelector('#plans');assert.equal(await popup.title(),'악뮤 예매 도우미');
 await worker.evaluate(async()=>{const plan=AkmuPreset.plan();await chrome.storage.local.set({akmuCount:2,profiles:{[plan.url]:{booking:'#booking'}}});});
 const reminders=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'reminders',id:'akmu-kintex'}));assert.equal(reminders.count,4);
 const prepare=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'prepare',id:'akmu-kintex'}));assert.match(prepare.message,/10분 전/);
 const alarms=await worker.evaluate(()=>chrome.alarms.getAll());assert.equal(alarms.filter(a=>a.name.startsWith('concert:')).length,4);assert.ok(alarms.some(a=>a.name==='prepare:akmu-kintex'));
 console.log('PASS Chrome extension: popup, service worker, four reminders and 10-minute preparation alarm');
 }else console.log('NOT RUN Chrome extension runtime (--web-only); covered separately by background logic tests');
 assert.deepEqual(errors,[]);console.log('PASS no browser script errors');
}finally{await context.close();await rm(profile,{recursive:true,force:true});}
