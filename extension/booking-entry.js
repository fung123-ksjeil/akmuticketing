(function(root){
 function candidates(){
  return [...document.querySelectorAll('a,button,[role="button"],input[type="button"],input[type="submit"]')].filter(el=>{
   if(!el.getClientRects().length||el.disabled||el.matches?.(':disabled')||el.getAttribute('aria-disabled')==='true'||el.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})===false)return false;
   if(typeof getComputedStyle==='function'&&getComputedStyle(el).pointerEvents==='none')return false;
   const labels=[el.textContent,el.value,el.getAttribute('aria-label'),...Array.from(el.querySelectorAll?.('img[alt],img[title]')||[],img=>img.getAttribute('alt')||img.getAttribute('title'))];
   return labels.some(label=>/^(예매하기|일반예매|예매시작)$/.test(String(label||'').replace(/\s+/g,'')));
  });
 }
 function click(id){
  if(!PracticeCatalog.matches(location.href,id)||location.pathname.includes('PerfSaleProcess'))throw Error('선택한 공연 상세 페이지에서만 시작할 수 있습니다.');
  const buttons=candidates();if(buttons.length!==1)throw Error('클릭 가능한 예매하기 버튼을 하나로 확인하지 못했습니다. 버튼을 직접 지정하거나 예스24에서 확인하세요.');
  buttons[0].click();return '예매하기를 한 번 클릭했습니다. 팝업이 차단되면 예스24 팝업을 허용하세요. 이후 날짜·좌석 자동 진행은 아직 미연동입니다.';
 }
 root.TicketBookingEntry={candidates,click};
})(globalThis);
