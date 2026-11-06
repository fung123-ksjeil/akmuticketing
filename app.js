const form=document.querySelector('form');const $=id=>document.getElementById(id);
const preset=TicketPlan.normalizePlan({id:'akmu-kintex',name:'악뮤 고양 킨텍스 콘서트',url:'https://ticket.yes24.com/Special/60840',show:'2027-01-02T17:00',open:'2026-11-10T20:00',count:2,sections:TicketPlanner.sections});
let plans=[],activeId=null;
try{plans=JSON.parse(localStorage.getItem('concertPlans')||'[]').map(TicketPlan.normalizePlan);}catch{plans=[];}
function read(){return TicketPlan.normalizePlan({...Object.fromEntries(new FormData(form)),id:activeId||crypto.randomUUID()});}
function persist(){localStorage.setItem('concertPlans',JSON.stringify(plans));}
function fill(p){activeId=p.id;for(const key of ['name','url','show','open','count','sections'])form.elements[key].value=key==='sections'?p.sections.join(', '):p[key];render();}
function render(){
 $('plans').replaceChildren();for(const p of plans){const item=document.createElement('div');item.className='plan-item';const choose=document.createElement('button');choose.type='button';choose.className='secondary';choose.textContent=`${p.id===activeId?'● ':''}${p.name} · ${p.open.replace('T',' ')}`;choose.onclick=()=>fill(p);const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='삭제';remove.setAttribute('aria-label',p.name+' 삭제');remove.onclick=()=>{if(!confirm(p.name+' 등록을 삭제할까요?'))return;plans=plans.filter(x=>x.id!==p.id);persist();if(activeId===p.id)activeId=null;render();};item.append(choose,remove);$('plans').append(item);}if(!plans.length)$('plans').textContent='아직 저장한 공연이 없습니다.';drawSeats();countdown();
}
function save(){const p=read(),i=plans.findIndex(x=>x.id===p.id);if(i<0)plans.push(p);else plans[i]=p;activeId=p.id;persist();render();return p;}
form.addEventListener('submit',e=>{e.preventDefault();try{save();$('saved').textContent='공연을 저장했습니다. 설정을 내보내 확장에 가져오세요.';}catch(e){$('saved').textContent=e.message;}});
$('export').onclick=()=>{if(!form.reportValidity())return;try{const p=save(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));a.download='concert-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('saved').textContent='설정 파일을 내보냈습니다. Chrome 확장에서 가져오세요.';}catch(e){$('saved').textContent=e.message;}};
$('new-plan').onclick=()=>{activeId=null;form.reset();form.elements.name.value='';form.elements.url.value='';form.elements.sections.value='';$('saved').textContent='새 공연 정보를 입력하세요.';render();form.elements.name.focus();};
$('akmu').onclick=()=>{fill(preset);$('saved').textContent='악뮤 기본 설정을 불러왔습니다. 수량을 확인하고 저장하세요.';};
$('open-page').onclick=()=>{try{window.open(read().url,'_blank','noopener,noreferrer');}catch(e){$('saved').textContent=e.message;}};
function countdown(){$('countdown').textContent=TicketPlan.remaining(form.elements.open.value);$('opening-label').textContent=form.elements.open.value.replace('T',' ')+' KST';$('current-name').textContent=form.elements.name.value||'나의 공연';}
form.addEventListener('input',countdown);setInterval(countdown,1000);
let seats=[];
function drawSeats(){seats=[];$('seats').replaceChildren();$('result').textContent='';const sections=form.elements.sections.value.split(/[,，→]/).map(s=>s.trim()).filter(Boolean).slice(0,10);for(const section of sections.length?sections:['A','B','C']){const row=document.createElement('div');row.className='seatrow';const label=document.createElement('span');label.textContent=section+'구역 A열';row.append(label);for(let number=1;number<=12;number++){const seat={section,row:'A',number,block:number<=6?'L':'R',available:![3,9].includes(number)},button=document.createElement('button');button.className='seat';button.textContent=number;button.disabled=!seat.available;button.setAttribute('aria-label',`${section}구역 A열 ${number}번`);if(number===7)button.style.marginLeft='14px';seat.element=button;seats.push(seat);row.append(button);}$('seats').append(row);}}
form.elements.sections.addEventListener('change',drawSeats);
$('practice').onclick=()=>{seats.forEach(s=>s.element.classList.remove('selected'));const preferences=form.elements.sections.value.split(/[,，→]/).map(s=>s.trim()).filter(Boolean),group=TicketPlanner.chooseSeats(seats,Number(form.elements.count.value),preferences);group.forEach(s=>s.element.classList.add('selected'));$('result').textContent=group.length?`${group[0].section}구역 ${group[0].row}열 ${group.map(s=>s.number).join(', ')}번 · ${group.length}석`:'조건에 맞는 연속 좌석이 없습니다.';};
if(plans.length)fill(plans[0]);else fill(preset);
