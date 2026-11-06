const form=document.getElementById('settings');const status=document.getElementById('saved');
for(const section of AkmuPreset.sections){const option=document.createElement('option');option.value=section;option.textContent=section+'구역';form.elements.section.append(option);}
let current=AkmuPreset.plan();
try{const saved=JSON.parse(localStorage.getItem('akmuPreferences')||'null');if(saved)current=AkmuPreset.plan(saved);}catch{}
function read(){return AkmuPreset.plan({count:Number(form.elements.count.value),section:form.elements.section.value,position:form.elements.position.value});}
function show(){form.elements.section.value=current.section;form.elements.count.value=current.count;form.elements.position.value=current.position;AkmuMap.render(document.getElementById('seat-map'),current.section,section=>{form.elements.section.value=section;current=read();show();});document.getElementById('selection-summary').textContent=`${current.section}구역 · ${{front:'앞쪽',middle:'중간',back:'뒤쪽'}[current.position]} · ${current.count}매`;}
function save(){current=read();localStorage.setItem('akmuPreferences',JSON.stringify({section:current.section,position:current.position,count:current.count}));return current;}
form.addEventListener('change',()=>{current=read();show();status.textContent='';});
form.addEventListener('submit',event=>{event.preventDefault();try{save();status.textContent='예매 설정을 저장했습니다.';}catch(error){status.textContent=error.message;}});
document.getElementById('export').onclick=()=>{try{const p=save(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({section:p.section,position:p.position,count:p.count},null,2)],{type:'application/json'}));a.download='akmu-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);status.textContent='확장에서 이 설정 파일을 가져오세요.';}catch(error){status.textContent=error.message;}};
document.getElementById('open-page').onclick=()=>window.open(AkmuPreset.plan().url,'_blank','noopener,noreferrer');
function countdown(){document.getElementById('countdown').textContent=TicketPlan.remaining(AkmuPreset.plan().open);}
show();countdown();setInterval(countdown,1000);
