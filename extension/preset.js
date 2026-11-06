(function(root){
 const sections=['101','102','103','104','105','106','107','108','109',...Array.from({length:13},(_,i)=>String(201+i))];
 const fixed={id:'akmu-kintex',name:'악뮤 고양 킨텍스 콘서트',url:'https://ticket.yes24.com/Special/60840',show:'2027-01-02T17:00',open:'2026-11-10T20:00'};
 function plan(input=2){
  const options=typeof input==='object'&&input!==null?input:{count:input};
  const count=Number(options.count??2),section=String(options.section||'104'),position=options.position||'middle';
  if(!Number.isInteger(count)||count<1||count>4)throw Error('예매 수량은 1~4매입니다.');
  if(!sections.includes(section)||!['front','middle','back'].includes(position))throw Error('구역과 앞·중간·뒤 위치를 확인하세요.');
  return {...TicketPlan.normalizePlan({...fixed,count,sections:[section,...['104','105','106','103','107'].filter(s=>s!==section)]}),section,position};
 }
 root.AkmuPreset={plan,sections};
})(globalThis);
