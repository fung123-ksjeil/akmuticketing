(function(root){
 const required=['booking','calendarStage','calendarMonth','calendarNext','calendarDay','selectedDate','session','seatEntry','seatStage','seatDone','seatConfirmationStage','seatConfirmationNext','discountStage','discountNext','deliveryStage','deliveryNext','paymentStage','bankTransfer','bankSelect','agreeAll','submitBooking'];
 function build(plan,map){
  for(const key of required)if(typeof map?.[key]!=='string'||!map[key].trim())throw Error('예스24 단계 설정 필요: '+key);
  const targetDate=plan.show.slice(0,10),targetTime=plan.show.slice(11,16);
  return [
   {type:'click',selector:map.booking,label:'예매하기'},
   {type:'calendar',stage:map.calendarStage,month:map.calendarMonth,nextMonth:map.calendarNext,selector:map.calendarDay,selected:map.selectedDate,date:targetDate,label:targetDate+' 선택'},
   {type:'session',stage:map.calendarStage,selector:map.session,selected:map.selectedSession||null,time:targetTime,label:targetTime+' 회차 선택'},
   {type:'click',stage:map.calendarStage,selector:map.seatEntry,arrive:map.seatStage,label:'좌석 화면 열기'},
   {type:'seats',stage:map.seatStage,label:'희망 연속 좌석 선택'},
   {type:'click',stage:map.seatStage,selector:map.seatDone,leave:map.seatStage,arrive:map.seatConfirmationStage,label:'좌석선택 완료'},
   {type:'click',stage:map.seatConfirmationStage,selector:map.seatConfirmationNext,leave:map.seatConfirmationStage,arrive:map.discountStage,label:'다음단계 1 · 좌석 확인'},
   {type:'click',stage:map.discountStage,selector:map.discountNext,leave:map.discountStage,arrive:map.deliveryStage,label:'다음단계 2 · 할인/쿠폰'},
   {type:'click',stage:map.deliveryStage,selector:map.deliveryNext,leave:map.deliveryStage,arrive:map.paymentStage,label:'다음단계 3 · 수령방법'},
   {type:'check',stage:map.paymentStage,selector:map.bankTransfer,kind:'radio',label:'무통장입금 선택'},
   {type:'bank',stage:map.paymentStage,selector:map.bankSelect,label:'국민은행 우선 선택'},
   {type:'check',stage:map.paymentStage,selector:map.agreeAll,kind:'checkbox',label:'모두 동의합니다 체크'},
   {type:'review-bank-booking',stage:map.paymentStage,selector:map.submitBooking,bankTransfer:map.bankTransfer,bankSelect:map.bankSelect,agreeAll:map.agreeAll,label:'최종 결제 사용자 확인'}
  ];
 }
 function monthIndex(text){const match=String(text).match(/(20\d{2})\s*[.년/\-]\s*(\d{1,2})/);if(!match||Number(match[2])<1||Number(match[2])>12)return null;return Number(match[1])*12+Number(match[2])-1;}
 function sameDate(text,date){const digits=String(text).match(/(20\d{2})\s*[.년/\-]\s*(\d{1,2})\s*[.월/\-]\s*(\d{1,2})/);return !!digits&&`${digits[1]}-${digits[2].padStart(2,'0')}-${digits[3].padStart(2,'0')}`===date;}
 function sameTime(text,time){const match=String(text).match(/(?:^|[^\d])(\d{1,2})\s*[:시]\s*(\d{1,2})/);return !!match&&`${match[1].padStart(2,'0')}:${match[2].padStart(2,'0')}`===time;}
 function chooseBank(options){
  const available=[...options].filter(o=>!o.disabled&&!o.hidden&&!o.parentElement?.disabled&&o.getAttribute?.('aria-disabled')!=='true'&&String(o.value||'').trim()&&String(o.textContent||'').trim()&&!/선택|select|choose|점검|불가|중단|미지원/i.test(o.textContent));
  return available.find(o=>/국민|kookmin|kb\s*(국민|은행|bank)/i.test(o.textContent))||available[0]||null;
 }
 root.TicketYes24Flow={build,required,monthIndex,sameDate,sameTime,chooseBank};
})(globalThis);
