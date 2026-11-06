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
 await page.goto(base+'/scripts/fixtures/booking.html');page.on('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'자동 연습 시작'}).click();
 await page.waitForSelector('#human-check:visible');await page.waitForTimeout(800);assert.equal(await page.locator('.demo-seat.selected').count(),0);
 await page.getByRole('button',{name:'내가 직접 확인 완료'}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('[role=status] span')].some(e=>e.textContent.includes('마지막 결제하기는 직접 누르세요.')),{},{timeout:25000});
 assert.equal(await page.locator('#calendar-month').textContent(),'2027. 01');assert.equal(await page.locator('#selected-date').textContent(),'2027. 01. 02.');assert.equal(await page.locator('#session').inputValue(),'17');
 assert.equal(await page.locator('.demo-seat.selected').count(),4);assert.deepEqual(await page.locator('.demo-seat.selected').evaluateAll(es=>es.map(e=>e.dataset.section)),['108','108','108','108']);
 const log=await page.locator('#log').textContent();for(const n of [1,2,3])assert.equal(log.split('다음단계 '+n+' →').length-1,1);
 assert.equal(await page.locator('#bank-transfer').isChecked(),true);assert.equal(await page.locator('#agree-all').isChecked(),true);assert.equal(await page.locator('#bank-select').inputValue(),'004');
 await page.waitForTimeout(1000);assert.equal(await page.locator('#reservation-complete').isVisible(),false);assert.equal(await page.locator('#done').textContent(),'');
 await page.getByRole('button',{name:'결제하기',exact:true}).click();await page.waitForSelector('#reservation-complete:visible');
 assert.match(await page.locator('#done').textContent(),/실제 예매 신청·결제·입금은 발생하지/);
 console.log('PASS KB-first preparation stops before final payment; completion requires user click');
 await page.reload();await page.evaluate(()=>{document.querySelector('#bank-select option[value="004"]').remove();window.submitClicks=0;document.getElementById('submit-booking').addEventListener('click',()=>window.submitClicks++);});
 await page.getByRole('button',{name:'자동 연습 시작'}).click();await page.waitForSelector('#human-check:visible');await page.getByRole('button',{name:'내가 직접 확인 완료'}).click();await page.waitForFunction(()=>[...document.querySelectorAll('[role=status] span')].some(e=>e.textContent.includes('마지막 결제하기는 직접 누르세요.')),{},{timeout:25000});
 assert.equal(await page.locator('#bank-select').inputValue(),'003');assert.equal(await page.evaluate(()=>window.submitClicks),0);assert.equal(await page.locator('#reservation-complete').isVisible(),false);
 await page.getByRole('button',{name:'결제하기',exact:true}).click();assert.equal(await page.evaluate(()=>window.submitClicks),1);assert.match(await page.locator('#bank-result').textContent(),/기업은행/);
 console.log('PASS missing KB selects fallback; final payment is never auto-clicked');
 // If a next button fails to change the stage, it must never be clicked three times.
 await page.reload();await page.evaluate(()=>{window.nextClicks=0;document.getElementById('confirm-next').onclick=()=>window.nextClicks++;});
 await page.getByRole('button',{name:'자동 연습 시작'}).click();await page.waitForSelector('#human-check:visible');await page.getByRole('button',{name:'내가 직접 확인 완료'}).click();await page.waitForFunction(()=>window.nextClicks===1);await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>window.nextClicks),1);assert.equal(await page.locator('#discount-stage').isVisible(),false);
 console.log('PASS unchanged stage does not cause repeated next clicks');
 // Simulated opening time: no early/hidden/disabled clicks, one click on activation.
 const detector=await context.newPage();await detector.goto(base+'/scripts/fixtures/booking.html');detector.on('dialog',dialog=>dialog.accept());
 await detector.clock.install({time:new Date('2026-11-10T10:59:59.500Z')});
 await detector.evaluate(()=>{window.openingClicks=0;const button=document.getElementById('booking');button.disabled=true;button.onclick=()=>window.openingClicks++;TicketRunner('arm',{plan:{url:location.href,show:'2027-01-02T17:00',open:'2026-11-10T20:00',count:2,sections:['104']},booking:'#booking'});});
 await detector.clock.runFor(400);assert.equal(await detector.evaluate(()=>window.openingClicks),0);
 await detector.clock.runFor(300);assert.equal(await detector.evaluate(()=>window.openingClicks),0);
 await detector.evaluate(()=>{const button=document.getElementById('booking');button.disabled=false;button.style.visibility='hidden';});
 await detector.clock.runFor(200);assert.equal(await detector.evaluate(()=>window.openingClicks),0);
 await detector.evaluate(()=>{const button=document.getElementById('booking');button.style.visibility='visible';button.style.pointerEvents='none';});
 await detector.clock.runFor(200);assert.equal(await detector.evaluate(()=>window.openingClicks),0);
 await detector.evaluate(()=>document.getElementById('booking').style.pointerEvents='auto');await detector.clock.runFor(120);assert.equal(await detector.evaluate(()=>window.openingClicks),1);
 await detector.clock.runFor(1000);assert.equal(await detector.evaluate(()=>window.openingClicks),1);await detector.close();
 console.log('PASS 20:00 gate: no early, hidden or disabled clicks; one activation click, no retries');
 // Extension popup must load as a real extension, not just as a web page.
 if(!process.argv.includes('--web-only')){
 let [worker]=context.serviceWorkers();if(!worker)worker=await context.waitForEvent('serviceworker');
 const extensionId=new URL(worker.url()).host;const popup=await context.newPage();await popup.goto(`chrome-extension://${extensionId}/popup.html`);await popup.waitForSelector('#count');assert.equal(await popup.title(),'악뮤 예매 도우미');
 await worker.evaluate(async()=>{const plan=AkmuPreset.plan();await chrome.storage.local.set({akmuCount:2,profiles:{[plan.url]:{booking:'#booking'}}});});
 const reminders=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'reminders',id:'akmu-kintex'}));assert.equal(reminders.count,4);
 const prepare=await popup.evaluate(()=>chrome.runtime.sendMessage({type:'prepare',id:'akmu-kintex'}));assert.match(prepare.message,/10분 전/);
 const alarms=await worker.evaluate(()=>chrome.alarms.getAll());assert.equal(alarms.filter(a=>a.name.startsWith('concert:')).length,4);assert.ok(alarms.some(a=>a.name==='prepare:akmu-kintex'));
 console.log('PASS Chrome extension: popup, service worker, four reminders and 10-minute preparation alarm');
 }else console.log('NOT RUN Chrome extension runtime (--web-only); covered separately by background logic tests');
 assert.deepEqual(errors,[]);console.log('PASS no browser script errors');
}finally{await context.close();await rm(profile,{recursive:true,force:true});}
