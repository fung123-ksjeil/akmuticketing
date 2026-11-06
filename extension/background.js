importScripts('plan.js','preset.js');
const prefix='concert:';
async function storedPlan(id){if(id!=='akmu-kintex')throw Error('악뮤 전용 예매 도우미입니다.');const data=await chrome.storage.local.get(['akmuCount','akmuPreferences','profiles']);const plan=AkmuPreset.plan(data.akmuPreferences||data.akmuCount||2);return {plan,profile:data.profiles?.[plan.url]||{}};}
async function remember(tabId,data){const saved=(await chrome.storage.session.get('preparedTabs')).preparedTabs||{};saved[String(tabId)]=data;await chrome.storage.session.set({preparedTabs:saved});}
async function forget(tabId){const saved=(await chrome.storage.session.get('preparedTabs')).preparedTabs||{};delete saved[String(tabId)];await chrome.storage.session.set({preparedTabs:saved});}
async function openPreparation(id,confirmedLogin=false){const {plan}=await storedPlan(id);const tab=await chrome.tabs.create({url:plan.url,active:true});await remember(tab.id,{id,confirmedLogin,expires:Date.parse(plan.open+'+09:00')+120000});await tryPrepare(tab.id);}
const preparing=new Set();
async function tryPrepare(tabId){
 if(preparing.has(tabId))return;preparing.add(tabId);
 try{await prepareTab(tabId);}finally{preparing.delete(tabId);}
}
async function prepareTab(tabId){
 const task=((await chrome.storage.session.get('preparedTabs')).preparedTabs||{})[String(tabId)];if(!task)return;
 try{
  if(Date.now()>task.expires){await forget(tabId);return;}
  const {plan,profile}=await storedPlan(task.id),tab=await chrome.tabs.get(tabId);
  if(tab.status!=='complete'||!tab.url||new URL(tab.url).origin!==new URL(plan.url).origin)return;
  if(!task.confirmedLogin){
   if(!profile.loggedIn)return;
   const result=await chrome.scripting.executeScript({target:{tabId},func:selector=>[...document.querySelectorAll(selector)].some(e=>e.getClientRects().length),args:[profile.loggedIn]});
   if(!result[0]?.result){
    await chrome.scripting.executeScript({target:{tabId},func:(selector,id)=>{
     globalThis.ticketLoginWatcher?.disconnect();clearTimeout(globalThis.ticketLoginTimeout);
     const observer=new MutationObserver(()=>{
      if([...document.querySelectorAll(selector)].some(e=>e.getClientRects().length)){observer.disconnect();clearTimeout(globalThis.ticketLoginTimeout);chrome.runtime.sendMessage({type:'login-observed',id});}
     });observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true});globalThis.ticketLoginWatcher=observer;globalThis.ticketLoginTimeout=setTimeout(()=>observer.disconnect(),12*60000);
    },args:[profile.loggedIn,task.id]});return;
   }
   task.confirmedLogin=true;await remember(tabId,task);
  }
  if(tab.url.split('#')[0]!==plan.url.split('#')[0]){await chrome.tabs.update(tabId,{url:plan.url});return;}
  await forget(tabId);
  await chrome.scripting.executeScript({target:{tabId},files:['plan.js','planner.js','yes24-sequence.js','runner.js']});
  const result=await chrome.scripting.executeScript({target:{tabId},func:config=>globalThis.TicketRunner('arm',config),args:[{...profile,plan,preapproved:true}]});
  await chrome.storage.local.set({lastPreparation:{id:plan.id,message:result[0]?.result||'시작 처리'}});
 }catch(e){await chrome.storage.local.set({lastPreparation:{id:task.id,message:e.message}});}
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 if(!['reminders','prepare','login-done','cancel-prepare','login-observed'].includes(message.type))return;
 (async()=>{
  const {plan,profile}=await storedPlan(message.id);
  if(message.type==='login-observed'){
   if(!sender.tab||new URL(sender.url).origin!==new URL(plan.url).origin)throw Error('로그인 감지 출처가 다릅니다.');
   const task=((await chrome.storage.session.get('preparedTabs')).preparedTabs||{})[String(sender.tab.id)];if(!task||task.id!==plan.id)throw Error('대기 중인 공연이 아닙니다.');
   await tryPrepare(sender.tab.id);respond({message:'로그인 표시를 확인했습니다.'});return;
  }
  if(message.type==='cancel-prepare'){await chrome.alarms.clear('prepare:'+plan.id);const all=(await chrome.storage.session.get('preparedTabs')).preparedTabs||{};for(const [tabId,t] of Object.entries(all))if(t.id===plan.id)await forget(tabId);respond({message:'10분 전 자동 열기와 로그인 감지 대기를 취소했습니다. 이미 시작한 페이지 자동 진행은 페이지의 중지 버튼으로 취소하세요.'});return;}
  if(message.type==='prepare'){
   if(!profile.booking)throw Error('예매 버튼을 먼저 지정하고 저장하세요.');
   const when=Date.parse(plan.open+'+09:00')-600000;
   if(Date.now()>Date.parse(plan.open+'+09:00')+120000)throw Error('예매 시작 시각이 2분 이상 지났습니다.');
   if(when<=Date.now()){await openPreparation(plan.id);respond({message:'공연 페이지를 열었습니다. 로그인 완료 표시를 감지하거나 완료 버튼을 누르면 복귀 후 시작을 기다립니다.'});}
   else{await chrome.alarms.create('prepare:'+plan.id,{when});respond({message:'오픈 10분 전 공연 페이지 자동 열기를 예약했습니다. Chrome과 컴퓨터를 켜두세요.'});}return;
  }
  if(message.type==='login-done'){
   if(!profile.booking)throw Error('예매 버튼을 먼저 지정하세요.');
   if(Date.now()>Date.parse(plan.open+'+09:00')+120000)throw Error('시작 시각이 2분 이상 지났습니다. 지금 클릭 기능을 사용하세요.');
   const candidates=(await chrome.storage.session.get('preparedTabs')).preparedTabs||{},entry=Object.entries(candidates).find(([,t])=>t.id===plan.id);
   if(entry){const [id,t]=entry;await remember(Number(id),{...t,confirmedLogin:true});await chrome.tabs.update(Number(id),{url:plan.url,active:true});await tryPrepare(Number(id));}
   else{const tabs=await chrome.tabs.query({active:true,currentWindow:true}),tab=tabs[0];if(tab?.url&&new URL(tab.url).origin===new URL(plan.url).origin){await remember(tab.id,{id:plan.id,confirmedLogin:true,expires:Date.parse(plan.open+'+09:00')+120000});if(tab.url.split('#')[0]===plan.url.split('#')[0])await tryPrepare(tab.id);else await chrome.tabs.update(tab.id,{url:plan.url,active:true});}else await openPreparation(plan.id,true);}
   respond({message:'등록한 공연 페이지로 복귀 후 시작 대기를 실행합니다. 페이지 하단 상태를 확인하세요.'});return;
  }
  for(const alarm of await chrome.alarms.getAll())if(alarm.name.startsWith(`${prefix}${plan.id}:`))await chrome.alarms.clear(alarm.name);
  let count=0;for(const minutes of [1440,120,60,0]){const when=Date.parse(plan.open+'+09:00')-minutes*60000;if(when>Date.now()){await chrome.alarms.create(`${prefix}${plan.id}:${minutes}`,{when});count++;}}respond({count});
 })().catch(e=>respond({error:e.message}));return true;
});
chrome.tabs.onUpdated.addListener((tabId,change)=>{if(change.status==='complete')tryPrepare(tabId);});
chrome.tabs.onRemoved.addListener(tabId=>forget(tabId));
chrome.alarms.onAlarm.addListener(async alarm=>{
 if(alarm.name.startsWith('prepare:')){try{await openPreparation(alarm.name.slice(8));}catch(e){await chrome.storage.local.set({lastPreparation:{message:e.message}});}return;}
 if(!alarm.name.startsWith(prefix))return;
 const suffix=alarm.name.slice(prefix.length),last=suffix.lastIndexOf(':'),id=suffix.slice(0,last),minutes=Number(suffix.slice(last+1));
 try{const {plan}=await storedPlan(id);await chrome.notifications.create(alarm.name,{type:'basic',iconUrl:'icon.png',title:plan.name,message:minutes?`예매 시작 ${minutes/60}시간 전입니다. 로그인과 버튼 설정을 확인하세요.`:'예매 시작 시각입니다. 준비한 공연 탭을 확인하세요.'});}catch{}
});
chrome.notifications.onClicked.addListener(async id=>{if(!id.startsWith(prefix))return;const suffix=id.slice(prefix.length);try{const {plan}=await storedPlan(suffix.slice(0,suffix.lastIndexOf(':')));await chrome.tabs.create({url:plan.url});}catch{}await chrome.notifications.clear(id);});
