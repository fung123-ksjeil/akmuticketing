const $=id=>document.getElementById(id);const selected=new Set();
function log(text){const li=document.createElement('li');li.textContent=text;$('log').append(li);}
$('start-demo').onclick=()=>{
 const kst=date=>new Date(date.getTime()+9*3600000).toISOString().slice(0,16);
 const config={plan:{name:'악뮤 예매 흐름 연습',url:location.href,show:kst(new Date(Date.now()+86400000)),open:kst(new Date()),count:2,sections:['104','105','106','103','107']},booking:'#booking',seat:'.demo-seat',adjacent:true,flow:'WAIT #human-check\nSEATS\n#seat-next\nWAIT #payment\n#receipt',manualGate:'#human-check, #payment'};
 try{log(TicketRunner('arm',config));}catch(e){log(e.message);}
};
for(const [i,section] of ['104','105','106','103','107','108','109'].entries()){
 const row=document.createElement('div');row.className='seatrow';const label=document.createElement('span');label.textContent=section+'구역 A열';row.append(label);
 for(let n=1;n<=8;n++){const b=document.createElement('button');b.className='seat demo-seat';b.textContent=n;Object.assign(b.dataset,{section,row:'A',number:String(n),available:String(i>=5||n%2===1),block:'one',seatX:String(i*100+n),seatY:'0',selected:'false'});b.setAttribute('aria-disabled',b.dataset.available==='true'?'false':'true');b.style.opacity=b.dataset.available==='true'?'1':'.3';b.onclick=()=>{if(b.dataset.available!=='true')return;b.dataset.selected=String(b.dataset.selected!=='true');b.classList.toggle('selected',b.dataset.selected==='true');if(b.dataset.selected==='true')selected.add(b);else selected.delete(b);$('selection').textContent='선택 '+selected.size+'석';$('seat-next').hidden=selected.size!==2;log(section+'구역 '+n+'번 클릭');};row.append(b);}$('seat-map').append(row);
}
$('booking').onclick=()=>{$('booking').hidden=true;$('human-check').hidden=false;log('예매 버튼 클릭 → 사람 확인 대기');};
$('human-done').onclick=()=>{$('human-check').hidden=true;$('seat-stage').hidden=false;log('사람이 확인 완료 → 좌석 화면');};
$('seat-next').onclick=()=>{if(selected.size!==2)return;$('seat-stage').hidden=true;$('payment').hidden=false;log('좌석 2석 선택 완료 → 직접 결제 대기');};
$('pay-now').onclick=()=>{$('payment').hidden=true;$('receipt').hidden=false;log('사람이 연습 결제 완료');};
$('receipt').onclick=()=>{$('receipt').hidden=true;$('done').textContent='연습 완료! 실제 좌석 확보나 결제는 발생하지 않았습니다.';log('예매 결과 확인');};
$('reset').onclick=()=>location.reload();
