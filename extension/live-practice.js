const $=id=>document.getElementById(id);let boundTab=null,reports=[],config=null;
for(const target of PracticeCatalog.targets){const o=document.createElement('option');o.value=target.id;o.textContent=target.name;$('target').append(o);}
const target=()=>PracticeCatalog.targets.find(t=>t.id===$('target').value);
function reset(){boundTab=null;reports=[];config=null;$('start').disabled=true;$('start').textContent='예매 시작 · 연동 확인 필요';$('title').textContent='현재 공연 정보 미확인';$('observed').textContent='';$('seats').textContent='미확인';$('grades').textContent='';$('report').textContent='';for(const id of ['date','time']){$(id).replaceChildren(new Option('정보 읽기 필요',''));}}
$('target').onchange=()=>{reset();$('status').textContent='공연을 변경했습니다. 선택한 공연의 실제 화면을 열고 다시 읽으세요.';};
$('open').onclick=async()=>{const tab=await chrome.tabs.create({url:target().url,active:true});boundTab=tab.id;};
async function adapter(){
 config=null;$('start').disabled=true;const profiles=(await chrome.storage.local.get('profiles')).profiles||{};const p=profiles[target().url];
 if(!p?.practiceVerified||!p.useYes24Sequence||!p.seat){$('readiness').textContent='이 공연의 실제 버튼·좌석 연동은 아직 미검증입니다. 정보 읽기만 가능합니다.';return;}
 try{TicketYes24Flow.build({show:'2027-01-02T17:00'},p.yes24Mapping);config=p;$('readiness').textContent='저장된 공연별 연동 설정을 찾았습니다. 예매처에서 날짜·회차·좌석 조건을 확인하세요.';$('start').textContent='예매 시작';$('start').disabled=!($('date').value&&$('time').value&&boundTab);}catch(e){$('readiness').textContent=e.message;}
}
for(const id of ['date','time'])$(id).onchange=adapter;
$('read').onclick=async()=>{
 try{
  if(!await chrome.permissions.request({origins:['https://ticket.yes24.com/*']}))throw Error('예스24 화면을 읽을 권한이 필요합니다.');
  const tabs=await chrome.tabs.query({url:'https://ticket.yes24.com/*'});const matching=tabs.filter(t=>PracticeCatalog.matches(t.url,target().id));
  const tab=matching.find(t=>t.active&&t.url.includes('PerfSaleProcess'))||matching.find(t=>t.url.includes('PerfSaleProcess'))||matching.find(t=>t.id===boundTab)||matching[0];
  if(!tab)throw Error('선택한 공연의 페이지를 먼저 열어주세요. 다른 공연은 읽지 않습니다.');boundTab=tab.id;
  await chrome.scripting.executeScript({target:{tabId:boundTab,allFrames:true},files:['site-reader.js']});
  const result=await chrome.scripting.executeScript({target:{tabId:boundTab,allFrames:true},func:()=>globalThis.readTicketPage()});reports=result.map(r=>({...r.result,frameId:r.frameId}));
  const main=reports.find(r=>r.frameId===0)||reports[0];$('title').textContent=main.title||target().name;$('observed').textContent='읽은 시각: '+new Date(main.capturedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
  for(const [id,key] of [['date','dates'],['time','times']]){const values=[...new Set(reports.flatMap(r=>r[key]||[]))].sort();$(id).replaceChildren(new Option(values.length?'회차를 확인하고 선택하세요':'현재 화면에서 확인되지 않음',''));for(const value of values)$(id).append(new Option(value,value));}
  const first=PracticeCatalog.earliest(reports.flatMap(r=>r.dates||[]),reports.flatMap(r=>r.times||[]));if(first){$('date').value=first.date;$('time').value=first.time;}
  const seats=reports.flatMap(r=>r.sections||[]);$('seats').replaceChildren();if(seats.length){const ul=document.createElement('ul');for(const s of seats){const li=document.createElement('li');li.textContent=`${s.section}구역 · 판독 요소 ${s.elements}개 / 판매 가능 표시 ${s.knownAvailable}개${s.availabilityUnknown?' / 상태 불명 '+s.availabilityUnknown+'개':''}`;ul.append(li);}$('seats').append(ul);}else $('seats').textContent='현재 화면에서 구역·잔여 좌석을 판독하지 못했습니다. 실제 예매창이나 좌석 어댑터가 필요합니다.';
  $('grades').textContent=[...new Set(reports.flatMap(r=>r.grades||[]))].join(' · ');$('report').textContent=JSON.stringify(reports,null,2);$('status').textContent='현재 화면을 읽었습니다. 이 작업은 예매·좌석 선택을 실행하지 않습니다.';await adapter();
 }catch(e){config=null;$('start').disabled=true;$('status').textContent=e.message;}
};
$('start').onclick=async()=>{
 try{
  if(!config||!boundTab)throw Error('검증된 공연별 연동 설정이 필요합니다.');const tab=await chrome.tabs.get(boundTab);if(!PracticeCatalog.matches(tab.url,target().id)||new URL(tab.url).pathname.includes('PerfSaleProcess'))throw Error('등록한 공연 상세 페이지에서만 시작할 수 있습니다. 팝업·프레임 연결은 추가 연동이 필요합니다.');
  const show=$('date').value+'T'+$('time').value;const open=new Date(Date.now()+9*3600000).toISOString().slice(0,16);
  const plan=TicketPlan.normalizePlan({id:'practice-'+target().id,name:target().name,url:tab.url,show,open,count:2,sections:[]});
  if(!confirm(`${target().name}\n${show} / ${plan.count}매\n실제 좌석을 임시 확보할 수 있습니다. 마지막 결제하기는 직접 누릅니다. 진행할까요?`))return;
  await chrome.scripting.executeScript({target:{tabId:boundTab},files:['plan.js','planner.js','yes24-sequence.js','runner.js']});
  const result=await chrome.scripting.executeScript({target:{tabId:boundTab},func:c=>globalThis.TicketRunner('arm',c),args:[{...config,plan,anySection:true,adjacent:false,preapproved:true}]});$('status').textContent=result[0]?.result||'실행 결과를 확인하세요.';
 }catch(e){$('status').textContent=e.message;}
};
