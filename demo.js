const $=id=>document.getElementById(id);const selected=new Set();
let preferences=AkmuPreset.plan();try{preferences=AkmuPreset.plan(JSON.parse(localStorage.getItem('akmuPreferences')||'{}'));}catch{}
function log(text){const li=document.createElement('li');li.textContent=text;$('log').append(li);}
function show(id){for(const stage of ['booking','human-check','calendar-stage','seat-stage','seat-confirmation','discount-stage','delivery-stage','payment-stage'])$(stage).hidden=stage!==id;}
const mapping={booking:'#booking',calendarStage:'#calendar-stage',calendarMonth:'#calendar-month',calendarNext:'#calendar-next',calendarDay:'#calendar-day',selectedDate:'#selected-date',session:'#session',seatEntry:'#seat-entry',seatStage:'#seat-stage',seatDone:'#seat-done',seatConfirmationStage:'#seat-confirmation',seatConfirmationNext:'#confirm-next',discountStage:'#discount-stage',discountNext:'#discount-next',deliveryStage:'#delivery-stage',deliveryNext:'#delivery-next',paymentStage:'#payment-stage',naverPay:'#naver-pay',agreeAll:'#agree-all',openPayment:'#open-payment'};
$('start-demo').onclick=()=>{
 const kst=date=>new Date(date.getTime()+9*3600000).toISOString().slice(0,16);
 const config={plan:{...preferences,url:location.href,open:kst(new Date())},booking:'#booking',seat:'.demo-seat',adjacent:true,useYes24Sequence:true,yes24Mapping:mapping,manualGate:'#human-check'};
 try{log(TicketRunner('arm',config));}catch(e){log(e.message);}
};
for(const [i,section] of ['104','105','106','103','107','108','109'].entries()){
 const row=document.createElement('div');row.className='seatrow';const label=document.createElement('span');label.textContent=section+'구역 A열';row.append(label);
 for(let n=1;n<=8;n++){
  const b=document.createElement('button');b.className='seat demo-seat';b.textContent=n;
  Object.assign(b.dataset,{section,row:'A',number:String(n),rowIndex:'1',rowTotal:'1',available:String(i>=5||n%2===1),block:'one',seatX:String(i*100+n),seatY:'0',selected:'false'});
  b.setAttribute('aria-disabled',b.dataset.available==='true'?'false':'true');b.style.opacity=b.dataset.available==='true'?'1':'.3';
  b.onclick=()=>{if(b.dataset.available!=='true')return;b.dataset.selected=String(b.dataset.selected!=='true');b.classList.toggle('selected',b.dataset.selected==='true');if(b.dataset.selected==='true')selected.add(b);else selected.delete(b);$('selection').textContent='선택 '+selected.size+'석';$('seat-done').hidden=selected.size!==preferences.count;log(section+'구역 '+n+'번 클릭');};row.append(b);
 }$('seat-map').append(row);
}
$('booking').onclick=()=>{show('human-check');log('예매하기 → 사람 확인');};
$('human-done').onclick=()=>{show('calendar-stage');log('사용자 확인 완료 → 달력');};
$('calendar-next').onclick=()=>{$('calendar-month').textContent='2027. 01';log('2027년 1월로 이동');};
$('calendar-day').onclick=()=>{if($('calendar-month').textContent!=='2027. 01')return;$('selected-date').textContent='2027. 01. 02.';log('2027년 1월 2일 선택');};
$('session').onchange=()=>{$('seat-entry').hidden=!($('session').value==='17'&&$('selected-date').textContent==='2027. 01. 02.');log('회차 '+$('session').selectedOptions[0].textContent);};
$('seat-entry').onclick=()=>{if($('session').value==='17'&&$('selected-date').textContent==='2027. 01. 02.'){show('seat-stage');log('좌석선택 화면');}};
$('seat-done').onclick=()=>{if(selected.size!==preferences.count)return;$('selected-summary').textContent=[...selected].map(b=>b.dataset.section+'구역 '+b.dataset.number+'번').join(', ');show('seat-confirmation');log('좌석선택 완료');};
$('confirm-next').onclick=()=>{show('discount-stage');log('다음단계 1 → 할인/쿠폰');};
$('discount-next').onclick=()=>{show('delivery-stage');log('다음단계 2 → 수령방법');};
$('delivery-next').onclick=()=>{show('payment-stage');log('다음단계 3 → 결제방법');};
$('naver-pay').onclick=()=>log('네이버페이 선택');$('agree-all').onclick=()=>log('전체 동의 '+$('agree-all').checked);
$('open-payment').onclick=()=>{if(!$('naver-pay').checked||!$('agree-all').checked)return;log('결제하기 → 네이버페이 창 (연습)');$('naver-dialog').showModal();};
$('final-payment').onclick=()=>{$('naver-dialog').close();$('done').textContent='연습 완료! 실제 결제나 좌석 확보는 발생하지 않았습니다.';log('사용자가 직접 동의하고 결제하기 클릭');};
$('reset').onclick=()=>location.reload();
