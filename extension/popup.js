const $=id=>document.getElementById(id),fields=['booking','seat','next','sectionAttr','rowAttr','numberAttr','blockAttr','availableAttr','availableValue','flow','manualGate','xAttr','yAttr','selectedAttr','selectedValue','loggedIn'];
const defaults={booking:'',seat:'',next:'',sectionAttr:'data-section',rowAttr:'data-row',numberAttr:'data-number',blockAttr:'data-block',availableAttr:'data-available',availableValue:'true',flow:'',manualGate:'',xAttr:'data-seat-x',yAttr:'data-seat-y',selectedAttr:'data-selected',selectedValue:'true',loggedIn:''};
let stored=await chrome.storage.local.get(['plans','activeId','profiles','lastPreparation']),plans=stored.plans||[],activeId=stored.activeId,profiles=stored.profiles||{};
function plan(){return plans.find(p=>p.id===activeId);}
function key(){return plan()?.url;}
function show(){
 $('plans').replaceChildren();for(const p of plans){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;option.selected=p.id===activeId;$('plans').append(option);}
 const p=plan();$('plan').textContent=p?`${p.show.replace('T',' ')} KST / ${p.count}매 / ${p.sections.join(' → ')||'전체 구역'}`:'웹앱에서 설정을 내보내 가져오세요.';
 for(const field of fields)$(field).value=profiles[key()]?.[field]??defaults[field];$('adjacent').checked=profiles[key()]?.adjacent??true;updateClock();
}
function updateClock(){$('countdown').textContent=plan()?TicketPlan.remaining(plan().open):'';}setInterval(updateClock,1000);
$('plans').onchange=async()=>{activeId=$('plans').value;await chrome.storage.local.set({activeId});show();};
$('file').onchange=async()=>{try{const p=TicketPlan.normalizePlan(JSON.parse(await $('file').files[0].text()));if(!p.id)p.id=crypto.randomUUID();const i=plans.findIndex(x=>x.id===p.id);if(i<0)plans.push(p);else plans[i]=p;activeId=p.id;await chrome.storage.local.set({plans,activeId});show();$('status').textContent='공연을 등록했습니다. 페이지를 열고 화면을 점검하세요.';}catch(e){$('status').textContent=e.message;}};
$('open').onclick=async()=>{if(plan())await chrome.tabs.create({url:TicketPlan.normalizePlan(plan()).url});else $('status').textContent='공연을 먼저 등록하세요.';};
$('remind').onclick=async()=>{try{if(!plan())throw Error('공연을 먼저 등록하세요.');const permission=await chrome.notifications.getPermissionLevel();if(permission!=='granted')throw Error('Chrome 알림 권한을 허용하세요.');const result=await chrome.runtime.sendMessage({type:'reminders',id:activeId});if(result.error)throw Error(result.error);$('status').textContent=result.count?`앞으로 남은 알림 ${result.count}개를 등록했습니다.`:'시작 시각이 지나 등록할 알림이 없습니다.';}catch(e){$('status').textContent=e.message;}};
async function saveProfile(){if(!plan())throw Error('공연을 먼저 등록하세요.');profiles[key()]={...Object.fromEntries(fields.map(f=>[f,$(f).value.trim()])),adjacent:$('adjacent').checked};await chrome.storage.local.set({profiles});return {...profiles[key()],plan:plan()};}
$('save').onclick=async()=>{try{await saveProfile();$('status').textContent='이 공연의 버튼·좌석 설정을 저장했습니다.';}catch(e){$('status').textContent=e.message;}};
for(const action of ['inspect','pick-booking','pick-next','book','arm','disarm','preview','select','stop','next-step'])$(action).onclick=async()=>{
 try{
  const config=await saveProfile();const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const current=new URL(tab.url),target=new URL(config.plan.url);
  if(current.origin!==target.origin)throw Error('등록한 예매 주소와 같은 사이트 탭에서 실행하세요. 새 창·다른 도메인은 별도 지원이 필요합니다.');
  if(action.startsWith('pick-')){
   const field=action==='pick-booking'?'booking':'next';
   await chrome.storage.local.set({pickerContext:{url:key(),field}});
   await chrome.scripting.executeScript({target:{tabId:tab.id},files:['picker.js']});
   await chrome.scripting.executeScript({target:{tabId:tab.id},func:field=>globalThis.startTicketPicker(field),args:[field]});
   window.close();return;
  }
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['plan.js','planner.js','runner.js']});
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:(action,config)=>globalThis.TicketRunner(action,config),args:[action,config]});
  $('status').textContent=result[0].result;
  if(action==='inspect')$('report').textContent=result[0].result;
 }catch(e){$('status').textContent=e.message;}
};
chrome.storage.onChanged.addListener(changes=>{if(changes.profiles){profiles=changes.profiles.newValue||{};show();}});
if(!plan()&&plans.length){activeId=plans[0].id;await chrome.storage.local.set({activeId});}show();

for(const action of ['prepare','login-done','cancel-prepare'])$(action).onclick=async()=>{
 try{
  if(!plan())throw Error('공연을 먼저 등록하세요.');
  // Request access from this explicit button gesture before any asynchronous work.
  if(action!=='cancel-prepare'){
   const origin=new URL(plan().url).origin+'/*';
   if(!await chrome.permissions.request({origins:[origin]}))throw Error('등록한 사이트의 접근 권한이 필요합니다.');
  }
  const config=await saveProfile();
  if(action!=='cancel-prepare'&&!confirm(`${plan().name} / ${plan().show} / ${plan().count}매\n로그인 완료 후 등록한 공연 페이지로 복귀하여, 저장한 예매 버튼과 자동 진행 순서대로 시작을 기다립니다. 회차·버튼 설정을 확인했나요?`))return;
  const result=await chrome.runtime.sendMessage({type:action,id:activeId});
  if(result.error)throw Error(result.error);$('status').textContent=result.message;
 }catch(e){$('status').textContent=e.message;}
};

if(stored.lastPreparation?.id===activeId)$('status').textContent=stored.lastPreparation.message;
