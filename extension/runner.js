globalThis.TicketRunner=(action,config)=>{
 const plan={...TicketPlan.normalizePlan(config.plan),position:config.plan.position};
 const visible=e=>!!e.getClientRects().length&&!e.disabled&&e.getAttribute('aria-disabled')!=='true';
 const all=selector=>selector?[...document.querySelectorAll(selector)].filter(visible):[];
 const samePage=()=>location.href.split('#')[0]===new URL(plan.url).href.split('#')[0];
 const finalPayment=e=>/결제\s*(하기|완료|확정|승인)|구매\s*(하기|확정)|pay\s*now|place\s*order|confirm\s*(purchase|payment)/i.test((e.textContent||'')+' '+(e.value||''));
 const clear=()=>{for(const el of globalThis.ticketCandidate?.elements||[])el.style.outline=el.dataset.ticketOldOutline||'';globalThis.ticketCandidate=null;};
 const oneClick=selector=>{const buttons=all(selector);if(buttons.length!==1)return false;if(finalPayment(buttons[0]))throw Error('최종 결제·구매 버튼은 직접 진행하세요.');buttons[0].click();return true;};
 function readSeats(){
  const attrs={section:config.sectionAttr||'data-section',row:config.rowAttr||'data-row',number:config.numberAttr||'data-number',block:config.blockAttr||'data-block',available:config.availableAttr||'data-available',x:config.xAttr||'data-seat-x',y:config.yAttr||'data-seat-y'};
  const elements=config.seat?[...document.querySelectorAll(config.seat)].filter(e=>!!e.getClientRects().length):[];if(!elements.length)return [];
  const seen=new Set();
  return elements.map(e=>{
   const get=k=>e.getAttribute(attrs[k]);const raw=get('number');
   if(!get('section')||!get('row')||!get('block')||!/^\d+$/.test(raw||'')||get('available')===null)throw Error('좌석 메타데이터가 부족합니다. 구역·열·번호·판매 가능 여부·통로 구분 어댑터가 필요합니다.');
   if(plan.position&&(!/^\d+$/.test(e.getAttribute(config.rowIndexAttr||'data-row-index')||'')||!/^\d+$/.test(e.getAttribute(config.rowTotalAttr||'data-row-total')||'')))throw Error('앞·중간·뒤 선택을 위한 실제 열 순서·전체 열 수 어댑터가 필요합니다.');
   const id=[get('section'),get('row'),get('number')].join('|');if(seen.has(id))throw Error('중복 좌석 정보입니다. 어댑터를 확인하세요.');seen.add(id);
   return {section:get('section'),row:get('row'),number:Number(raw),block:get('block'),rowIndex:Number(e.getAttribute(config.rowIndexAttr||'data-row-index')),rowTotal:Number(e.getAttribute(config.rowTotalAttr||'data-row-total')),available:visible(e)&&get('available')===(config.availableValue??'true'),x:get('x')===null?null:Number(get('x')),y:get('y')===null?null:Number(get('y')),element:e};
  });
 }
 function choose(){return TicketPlanner.chooseWithFallback(readSeats(),plan.count,plan.sections,config.adjacent===true,plan.position);}
 function candidate(){
  clear();if(!config.seat)return '좌석 선택자를 지정하세요.';
  const group=choose();if(!group.length)return '조건에 맞는 연속 좌석이 없습니다. 인접 구역은 검증된 배치 좌표가 있어야 탐색합니다.';
  const chosen=group.map(s=>s.element);chosen.forEach(e=>{e.dataset.ticketOldOutline=e.style.outline;e.style.outline='3px solid #ff8a00';});
  const label=`${group[0].section}구역 ${group[0].row}열 ${group.map(s=>s.number).join(', ')}번`;
  globalThis.ticketCandidate={elements:chosen,label,plan:JSON.stringify(plan),time:Date.now(),signature:chosen.map(e=>e.outerHTML)};return label+' 후보 표시. 회차와 위치를 확인하세요.';
 }
 if(action==='stop'){clear();return '후보를 지웠습니다.';}
 if(action==='disarm'){globalThis.ticketAutomation?.stop();return '시작 대기·자동 진행을 취소했습니다.';}
 if(action==='inspect'){
  const buttons=all('button,a,[role="button"],input[type="button"],input[type="submit"]');
  let seatInfo='미설정';if(config.seat){try{const seats=readSeats();seatInfo=`${seats.length}개 읽음, 연속 후보 ${choose().length}석`;}catch(e){seatInfo=e.message;}}
  return `현재 사이트: ${location.hostname}\n페이지 제목: ${document.title}\n예매 버튼: ${all(config.booking).length}개\n다음 단계 버튼: ${all(config.next).length}개\n좌석: ${seatInfo}\niframe ${document.querySelectorAll('iframe').length}개 / canvas ${document.querySelectorAll('canvas').length}개\n표시된 버튼 후보 ${buttons.length}개\n현재 DOM만 점검했습니다. 회차·가격·향후 화면은 직접 확인하세요.`;
 }
 if(action==='book'){
  if(Date.now()<Date.parse(plan.open+'+09:00'))return '설정한 오픈 시각 전입니다.';
  if(!samePage())return '설정한 공연 페이지에서만 예매 버튼을 누릅니다.';
  if(!config.booking)return '예매 버튼을 먼저 지정하세요.';
  if(all(config.booking).length!==1)return '정확히 하나의 활성화된 예매 버튼이 필요합니다.';
  if(!confirm('설정한 공연의 예매 버튼을 한 번 클릭할까요?'))return '취소했습니다.';
  return oneClick(config.booking)?'예매 버튼을 한 번 눌렀습니다. 대기열과 회차를 확인하세요.':'활성화된 예매 버튼이 없습니다.';
 }
 if(action==='next-step'){
  if(!config.next)return '다음 단계 버튼을 지정하세요.';
  if(!confirm('회차·수량·금액을 확인했나요? 지정한 다음 단계 버튼을 한 번 클릭합니다. 최종 결제는 직접 진행하세요.'))return '취소했습니다.';
  return oneClick(config.next)?'다음 단계 버튼을 눌렀습니다.':'정확히 하나의 활성화된 다음 단계 버튼이 필요합니다.';
 }
 if(action==='preview')return candidate();
 if(action==='select'){
  const c=globalThis.ticketCandidate;if(!c||c.plan!==JSON.stringify(plan)||Date.now()-c.time>30000)return '후보를 다시 확인하세요. 후보 유효시간은 30초입니다.';
  const current=readSeats().filter(s=>s.available).map(s=>s.element);
  if(c.elements.some((e,i)=>!e.isConnected||!visible(e)||!current.includes(e)||e.outerHTML!==c.signature[i])){clear();return '좌석 상태가 바뀌었습니다. 후보를 다시 확인하세요.';}
  if(!confirm(`${plan.show} 공연의 ${c.label}, ${plan.count}매인지 확인하세요. 클릭할까요?`))return '취소했습니다.';
  const els=[...c.elements];clear();
  for(const el of els){if(!el.isConnected||!visible(el))return '화면 변경으로 중단했습니다. 선택된 좌석을 확인하세요.';el.click();}
  return '후보 좌석을 클릭했습니다. 실제 선택 성공·수량·회차를 확인하세요. 결제는 직접 진행하세요.';
 }
 if(action==='arm'){
  if(!samePage())return '등록한 공연 페이지에서 시작 대기를 켜세요.';
  if(!(config.useYes24Sequence?config.yes24Mapping?.booking:config.booking))return '예매 버튼을 먼저 지정하세요.';
  const opening=Date.parse(plan.open+'+09:00');if(Date.now()>opening+120000)return '시작 시각이 2분 이상 지났습니다. 지금 클릭 기능을 사용하세요.';
  const steps=config.useYes24Sequence?TicketYes24Flow.build(plan,config.yes24Mapping):[{type:'click',selector:config.booking,label:'예매'}];
  if(!config.useYes24Sequence&&config.flow){for(const line of config.flow.split('\n').map(s=>s.trim()).filter(Boolean)){
   if(line==='SEATS')steps.push({type:'seats',label:'연속 좌석'});
   else if(line.startsWith('WAIT '))steps.push({type:'wait',selector:line.slice(5).trim(),label:'사용자 진행 대기'});
   else steps.push({type:'click',selector:line,label:'다음 단계'});
  }}
  if(steps.length>20)return '자동 단계는 최대 20개입니다.';
  for(const step of steps)for(const key of ['selector','stage','arrive','leave','month','nextMonth','selected'])if(step[key])document.querySelector(step[key]);
  if(!config.preapproved&&!confirm(`${plan.name}\n${plan.show} / ${plan.count}매\n우선 구역 ${plan.sections.join(', ')}${config.adjacent?' → 배치상 인접 구역':''}\n시작 후 확인한 ${steps.length}개 단계만 자동 진행합니다.${config.useYes24Sequence?' 무통장입금·국민은행 우선 선택(없으면 선택 가능한 첫 은행)·전체 동의까지만 준비합니다. 마지막 결제하기와 실제 입금은 직접 합니다.':''} 사람 확인·결제는 직접 하세요. 페이지 이동 시 자동 진행은 해제됩니다. 준비한 회차와 버튼이 맞나요?`))return '취소했습니다.';
  globalThis.ticketAutomation?.stop();
  let timer,index=0,stopped=false,lastClick=0,expires=opening+120000,pendingSeats=null,pendingTransition=null,chosenBank=null;
  const banner=document.createElement('div'),text=document.createElement('span'),stop=document.createElement('button');stop.textContent='자동 진행 중지';banner.append(text,stop);
  Object.assign(banner.style,{position:'fixed',bottom:'16px',left:'16px',right:'16px',padding:'16px',background:'#213e32',color:'white',zIndex:'2147483647',font:'14px sans-serif'});stop.style.marginLeft='14px';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');document.documentElement.append(banner);
  function status(message){text.textContent='공연 예매 도우미 · '+message;}
  function end(message){stopped=true;clearTimeout(timer);status(message);stop.textContent='안내 닫기';stop.onclick=()=>banner.remove();}
  const controller={stop(){stopped=true;clearTimeout(timer);banner.remove();}};globalThis.ticketAutomation=controller;stop.onclick=()=>end('사용자가 중지했습니다.');
  function tick(){
   if(stopped)return;
   try{
    const now=Date.now();if(now<opening){status('시작 대기 · '+TicketPlan.remaining(plan.open));timer=setTimeout(tick,Math.min(1000,opening-now));return;}
    if(index===0&&now>expires){end('예매 버튼 활성화 대기 2분을 초과했습니다. 직접 확인하세요.');return;}
    if(index>0&&now>expires){end('자동 단계 대기 30분을 초과했습니다.');return;}
    const step=steps[index];if(!step){end('지정한 단계가 끝났습니다. 최종 결제·예매 내역을 직접 확인하세요.');return;}
    const gates=all(config.manualGate||'iframe[src*="recaptcha"],iframe[src*="hcaptcha"],input[autocomplete="cc-number"],input[autocomplete="cc-csc"],input[autocomplete="one-time-code"]');
    if(gates.length){status('사람 확인 또는 결제 화면입니다. 직접 진행하세요. 완료 후 다음 지정 요소가 나타나면 재개합니다.');timer=setTimeout(tick,500);return;}
    if(pendingTransition){
     if((!pendingTransition.leave||!all(pendingTransition.leave).length)&&(!pendingTransition.arrive||all(pendingTransition.arrive).length===1)){pendingTransition=null;index++;}
     else if(now-pendingTransition.time>15000)throw Error('다음 화면 전환을 확인하지 못했습니다. 같은 버튼을 반복 클릭하지 않습니다.');
     timer=setTimeout(tick,200);return;
    }
    if(pendingSeats){
     if(pendingSeats.elements.every(e=>e.isConnected&&e.getAttribute(config.selectedAttr||'data-selected')===(config.selectedValue||'true'))){pendingSeats=null;index++;}
     else if(now-pendingSeats.time>3000)throw Error('좌석 선택 완료를 확인할 수 없습니다. 실제 선택 결과와 선택 상태 속성을 확인하세요.');
     timer=setTimeout(tick,200);return;
    }
    if(now-lastClick<700){timer=setTimeout(tick,200);return;}
    if(step.stage&&all(step.stage).length!==1){status(step.label+' · 해당 화면을 기다립니다.');timer=setTimeout(tick,200);return;}
    if(step.type==='calendar'){
     const months=all(step.month);if(months.length!==1)throw Error('달력의 연월을 하나로 확인할 수 없습니다.');
     const shown=TicketYes24Flow.monthIndex(months[0].textContent),target=TicketYes24Flow.monthIndex(step.date);
     if(shown===null||target===null||shown>target||target-shown>12)throw Error('달력 연월을 확인하세요. 잘못된 달의 2일을 클릭하지 않습니다.');
     if(shown<target){
      if(step.monthClicked){if(step.lastMonth===shown){if(now-step.monthClicked>5000)throw Error('달력 월 전환을 확인하지 못했습니다.');timer=setTimeout(tick,200);return;}step.monthClicked=null;}
      const next=all(step.nextMonth);if(next.length!==1)throw Error('다음 달 버튼을 확인할 수 없습니다.');step.lastMonth=shown;step.monthClicked=now;next[0].click();lastClick=now;
     }else{
      const dates=all(step.selector);if(dates.length!==1)throw Error('목표 날짜 버튼이 하나가 아닙니다.');
      if(!step.dateClicked){step.dateClicked=now;dates[0].click();lastClick=now;}
      const selected=all(step.selected);if(selected.length===1&&TicketYes24Flow.sameDate(selected[0].value||selected[0].textContent,step.date))index++;
      else if(now-step.dateClicked>5000)throw Error('선택 날짜가 2027년 1월 2일인지 확인되지 않았습니다.');
     }
     timer=setTimeout(tick,200);return;
    }
    if(step.type==='session'){
     const sessions=all(step.selector);if(sessions.length!==1)throw Error('회차 선택 요소가 하나가 아닙니다.');const el=sessions[0];
     if(el.tagName==='SELECT'){
      const options=[...el.options].filter(o=>!o.disabled&&TicketYes24Flow.sameTime(o.textContent,step.time));if(options.length!==1)throw Error('17시 회차를 하나로 확인할 수 없습니다.');
      if(el.value!==options[0].value){el.value=options[0].value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
      if(el.value!==options[0].value)throw Error('17시 회차 선택을 확인하지 못했습니다.');
     }else{
      if(!TicketYes24Flow.sameTime(el.textContent||el.value,step.time))throw Error('17시 회차 버튼인지 확인되지 않았습니다.');
      if(!step.clicked){step.clicked=now;el.click();}
      const selected=step.selected?all(step.selected):[];
      const verified=(selected.length===1&&TicketYes24Flow.sameTime(selected[0].textContent||selected[0].value,step.time))||el.getAttribute('aria-selected')==='true'||el.getAttribute('aria-pressed')==='true'||el.checked===true;
      if(!verified){if(now-step.clicked>5000)throw Error('17시 회차 선택 상태를 확인하지 못했습니다. selectedSession 어댑터가 필요합니다.');timer=setTimeout(tick,200);return;}
     }
     index++;lastClick=now;timer=setTimeout(tick,200);return;
    }
    if(step.type==='check'){
     const els=all(step.selector);if(els.length!==1||els[0].tagName!=='INPUT'||els[0].type!==step.kind)throw Error(step.label+' 요소를 확인할 수 없습니다.');
     const el=els[0];if(!el.checked){if(step.clicked)throw Error(step.label+' 상태가 적용되지 않았습니다.');step.clicked=true;el.click();}
     if(el.checked){index++;lastClick=now;}timer=setTimeout(tick,200);return;
    }
    if(step.type==='bank'){
     const banks=all(step.selector);if(banks.length!==1||banks[0].tagName!=='SELECT')throw Error('입금은행 선택 어댑터가 필요합니다.');
     const el=banks[0],option=TicketYes24Flow.chooseBank(el.options);if(!option)throw Error('선택 가능한 입금은행이 없습니다. 예매 신청을 중단합니다.');
     if(!step.chosen||step.chosen!==option.value){step.chosen=option.value;step.changed=now;el.value=option.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));timer=setTimeout(tick,200);return;}
     if(el.value!==step.chosen){if(now-step.changed>3000)throw Error('입금은행 선택 결과가 적용되지 않았습니다.');timer=setTimeout(tick,200);return;}
     chosenBank={value:option.value,label:option.textContent};status('입금은행 '+chosenBank.label+' 선택 확인');index++;lastClick=now;timer=setTimeout(tick,200);return;
    }
    if(step.type==='review-bank-booking'){
     const allowed=location.hostname==='ticket.yes24.com'||(['localhost','127.0.0.1'].includes(location.hostname)&&location.pathname.endsWith('/demo.html'));
     if(!allowed)throw Error('예스24 무통장 예매 준비만 허용합니다.');
     const method=all(step.bankTransfer),banks=all(step.bankSelect),agree=all(step.agreeAll),buttons=all(step.selector);
     if(method.length!==1||!method[0].checked||banks.length!==1||!chosenBank||banks[0].value!==chosenBank.value||agree.length!==1||!agree[0].checked||buttons.length!==1)throw Error('무통장입금·입금은행·전체 동의·결제하기 버튼을 확인하세요.');
     if(!/무통장|계좌입금|bank\s*transfer/i.test(method[0].getAttribute('aria-label')||method[0].labels?.[0]?.textContent||''))throw Error('무통장입금 수단인지 확인되지 않았습니다.');
     const valid=TicketYes24Flow.chooseBank(banks[0].options);if(!valid||valid.value!==chosenBank.value)throw Error('입금은행 목록이 바뀌었습니다. 예매 신청 전에 다시 확인하세요.');
     end('무통장입금 · '+chosenBank.label+' · 전체 동의 준비 완료. 금액·내용을 확인하고 마지막 결제하기는 직접 누르세요.');return;
    }
    if(step.type==='wait'){
     if(all(step.selector).length){status('사용자 진행 대기 · 해당 확인/결제 화면을 직접 완료하세요.');timer=setTimeout(tick,500);return;}
     index++;status('사용자 단계 종료 감지 · 다음 지정 버튼을 기다립니다.');timer=setTimeout(tick,300);return;
    }
    if(step.type==='seats'){
     const group=choose();if(group.length===plan.count){
      const actual=new Set(readSeats().filter(s=>s.available).map(s=>s.element));
      if(group.some(s=>!actual.has(s.element)))throw Error('좌석 상태가 바뀌었습니다. 직접 확인하세요.');
      for(const seat of group){if(!seat.element.isConnected||!visible(seat.element))throw Error('좌석 화면이 바뀌었습니다. 직접 확인하세요.');seat.element.click();}
      pendingSeats={elements:group.map(s=>s.element),time:now};lastClick=now;status('연속 좌석 클릭 요청 완료 · 선택 상태 확인 중');
     }else status('원하는 연속 좌석을 기다립니다. 화면 새로고침·네트워크 재요청은 하지 않습니다.');
    }else{
     const buttons=all(step.selector);if(buttons.length>1)throw Error('지정한 버튼이 여러 개입니다. 직접 확인하세요.');
     if(buttons.length===1){if(finalPayment(buttons[0])){step.manualSeen=true;status('최종 결제·구매 버튼입니다. 직접 진행하세요. 완료하여 이 버튼이 사라지면 다음 단계로 이어갑니다.');timer=setTimeout(tick,500);return;}
      buttons[0].click();if(step.leave||step.arrive)pendingTransition={leave:step.leave,arrive:step.arrive,time:now};else index++;lastClick=now;if(index===1)expires=now+30*60000;status(`${step.label||index+'/'+steps.length} 클릭 완료`);
     }else if(step.manualSeen){index++;status('사용자가 결제 단계를 완료했습니다. 다음 지정 단계를 기다립니다.');}else status(`${index+1}/${steps.length} 단계의 지정 버튼을 기다립니다. 새 창·페이지 이동에서는 확장을 다시 실행하세요.`);
    }
    timer=setTimeout(tick,200);
   }catch(e){end('중단 · '+e.message);}
  }
  tick();return '시작 대기를 켰습니다. 현재 페이지의 하단 안내에서 상태를 확인하세요.';
 }
 return '지원하지 않는 동작입니다.';
};
