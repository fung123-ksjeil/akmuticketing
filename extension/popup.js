const $=id=>document.getElementById(id),fields=['booking','seat','next','sectionAttr','rowAttr','numberAttr','blockAttr','availableAttr','availableValue','flow','manualGate','xAttr','yAttr','selectedAttr','selectedValue','loggedIn','rowIndexAttr','rowTotalAttr'];
const defaults={booking:'',seat:'',next:'',sectionAttr:'data-section',rowAttr:'data-row',numberAttr:'data-number',blockAttr:'data-block',availableAttr:'data-available',availableValue:'true',flow:'',manualGate:'',xAttr:'data-seat-x',yAttr:'data-seat-y',selectedAttr:'data-selected',selectedValue:'true',loggedIn:'',rowIndexAttr:'data-row-index',rowTotalAttr:'data-row-total'};
let stored=await chrome.storage.local.get(['plans','akmuCount','akmuPreferences','profiles','lastPreparation']);
let profiles=stored.profiles||{};
let currentPlan=AkmuPreset.plan(stored.akmuPreferences||Math.min(4,Number(stored.akmuCount||(stored.plans||[]).find(p=>p.id==='akmu-kintex')?.count||2)));
const activeId=currentPlan.id;
function plan(){return currentPlan;}
function key(){return currentPlan.url;}
async function persistPlan(){
 const previous=(await chrome.storage.local.get('plans')).plans||[];
 await chrome.storage.local.set({plans:[...previous.filter(p=>p.id!==activeId),currentPlan],akmuCount:currentPlan.count,akmuPreferences:{section:currentPlan.section,position:currentPlan.position,count:currentPlan.count}});
}
await persistPlan();
for(const section of AkmuPreset.sections){const option=document.createElement('option');option.value=section;option.textContent=section+'구역';$('section').append(option);}
$('preferences-file').onchange=async()=>{try{currentPlan=AkmuPreset.plan(JSON.parse(await $('preferences-file').files[0].text()));await persistPlan();show();$('status').textContent='악뮤 예매 설정을 가져왔습니다.';}catch(e){$('status').textContent=e.message;}};
function show(){
 $('count').value=currentPlan.count;$('section').value=currentPlan.section;$('position').value=currentPlan.position;
 $('plan').textContent=currentPlan.sections.join(' → ')+' · 연속 좌석 우선';
 for(const field of fields)$(field).value=profiles[key()]?.[field]??defaults[field];
 $('adjacent').checked=profiles[key()]?.adjacent??true;$('useYes24Sequence').checked=profiles[key()]?.useYes24Sequence??false;$('yes24Mapping').value=profiles[key()]?.yes24Mapping?JSON.stringify(profiles[key()].yes24Mapping,null,2):'';updateClock();
}
function updateClock(){$('countdown').textContent=TicketPlan.remaining(currentPlan.open);}
setInterval(updateClock,1000);
$('save-count').onclick=async()=>{try{currentPlan=AkmuPreset.plan({count:Number($('count').value),section:$('section').value,position:$('position').value});await persistPlan();show();$('status').textContent=currentPlan.section+'구역 '+currentPlan.count+'매로 저장했습니다.';}catch(e){$('status').textContent=e.message;}};
$('open').onclick=async()=>{if(plan())await chrome.tabs.create({url:TicketPlan.normalizePlan(plan()).url});else $('status').textContent='수량을 확인하세요.';};
$('remind').onclick=async()=>{try{if(!plan())throw Error('수량을 확인하세요.');const permission=await chrome.notifications.getPermissionLevel();if(permission!=='granted')throw Error('Chrome 알림 권한을 허용하세요.');const result=await chrome.runtime.sendMessage({type:'reminders',id:activeId});if(result.error)throw Error(result.error);$('status').textContent=result.count?`앞으로 남은 알림 ${result.count}개를 등록했습니다.`:'시작 시각이 지나 등록할 알림이 없습니다.';}catch(e){$('status').textContent=e.message;}};
async function saveProfile(){currentPlan=AkmuPreset.plan({count:Number($('count').value),section:$('section').value,position:$('position').value});await persistPlan();const useYes24Sequence=$('useYes24Sequence').checked;const yes24Mapping=$('yes24Mapping').value.trim()?JSON.parse($('yes24Mapping').value):{};if(useYes24Sequence)TicketYes24Flow.build(currentPlan,yes24Mapping);profiles[key()]={...Object.fromEntries(fields.map(f=>[f,$(f).value.trim()])),adjacent:$('adjacent').checked,useYes24Sequence,yes24Mapping};await chrome.storage.local.set({profiles});return {...profiles[key()],plan:plan()};}
$('save').onclick=async()=>{try{await saveProfile();$('status').textContent='이 공연의 버튼·좌석 설정을 저장했습니다.';}catch(e){$('status').textContent=e.message;}};
for(const action of ['inspect','pick-booking','pick-next','book','arm','disarm','preview','select','stop','next-step'])$(action).onclick=async()=>{
 try{
  const config=await saveProfile();const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  const current=new URL(tab.url),target=new URL(config.plan.url);
  if(current.origin!==target.origin)throw Error('예스24 공연 탭에서 실행하세요. 새 창·다른 도메인은 별도 지원이 필요합니다.');
  if(action.startsWith('pick-')){
   const field=action==='pick-booking'?'booking':'next';
   await chrome.storage.local.set({pickerContext:{url:key(),field}});
   await chrome.scripting.executeScript({target:{tabId:tab.id},files:['picker.js']});
   await chrome.scripting.executeScript({target:{tabId:tab.id},func:field=>globalThis.startTicketPicker(field),args:[field]});
   window.close();return;
  }
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['plan.js','planner.js','yes24-sequence.js','runner.js']});
  const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:(action,config)=>globalThis.TicketRunner(action,config),args:[action,config]});
  $('status').textContent=result[0].result;
  if(action==='inspect')$('report').textContent=result[0].result;
 }catch(e){$('status').textContent=e.message;}
};
chrome.storage.onChanged.addListener(changes=>{if(changes.profiles){profiles=changes.profiles.newValue||{};show();}});
show();

for(const action of ['prepare','login-done','cancel-prepare'])$(action).onclick=async()=>{
 try{
  if(!plan())throw Error('수량을 확인하세요.');
  // Request access from this explicit button gesture before any asynchronous work.
  if(action!=='cancel-prepare'){
   const origin=new URL(plan().url).origin+'/*';
   if(!await chrome.permissions.request({origins:[origin]}))throw Error('예스24 접근 권한이 필요합니다.');
  }
  const config=await saveProfile();
  if(action!=='cancel-prepare'&&!confirm(`${plan().name} / ${plan().show} / ${plan().count}매\n로그인 완료 후 악뮤 공연 페이지로 복귀하여, 저장한 예매 버튼과 자동 진행 순서대로 시작을 기다립니다. ${config.useYes24Sequence?"네이버페이 선택·전체 동의·결제창 열기까지 진행하고 최종 네이버페이 결제는 직접 합니다.\n":""}회차·버튼 설정을 확인했나요?`))return;
  const result=await chrome.runtime.sendMessage({type:action,id:activeId});
  if(result.error)throw Error(result.error);$('status').textContent=result.message;
 }catch(e){$('status').textContent=e.message;}
};

if(stored.lastPreparation?.id===activeId)$('status').textContent=stored.lastPreparation.message;
