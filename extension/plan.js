(function(root){
 function normalizePlan(input){
  const url=new URL(input.url);
  if(url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw Error('HTTPS 공연 주소를 입력하세요. 연습용 localhost HTTP도 허용합니다.');
  const count=Number(input.count);if(!Number.isInteger(count)||count<1||count>10)throw Error('수량은 1~10매로 입력하세요. 실제 공연별 제한을 확인하세요.');
  for(const key of ['show','open'])if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input[key]||'')||(!Number.isFinite(Date.parse(input[key]+'+09:00'))||new Date(Date.parse(input[key]+'+09:00')+9*3600000).toISOString().slice(0,16)!==input[key]))throw Error('공연·예매 시작 일시를 입력하세요.');
  if(Date.parse(input.show+'+09:00')<Date.parse(input.open+'+09:00'))throw Error('공연 일시는 예매 시작 이후여야 합니다.');
  const sections=(Array.isArray(input.sections)?input.sections:String(input.sections||'').split(/[,，→]/)).map(s=>String(s).trim()).filter(Boolean);
  if(sections.length>30||sections.some(s=>s.length>40))throw Error('좌석 구역을 확인하세요.');
  return {version:2,id:String(input.id||'').slice(0,80),name:String(input.name||'나의 공연').slice(0,100),url:url.href,show:input.show,open:input.open,count,sections:[...new Set(sections)]};
 }
 function remaining(open,now=Date.now()){
  const ms=Date.parse(open+'+09:00')-now;if(!Number.isFinite(ms))return '시작 일시를 등록하세요';if(ms<=0)return '예매 시작 시각이 지났습니다';const s=Math.ceil(ms/1000);
  return `${Math.floor(s/86400)}일 ${String(Math.floor(s/3600)%24).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
 }
 root.TicketPlan={normalizePlan,remaining};
})(globalThis);
