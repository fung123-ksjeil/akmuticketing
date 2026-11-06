(function(root){
 const sections=['104','105','106','103','107'];
 function chooseSeats(seats,count,preferences=sections){
  if(!Number.isInteger(count)||count<1||count>4)return [];
  const candidates=[];
  const order=preferences.length?preferences:[...new Set(seats.map(s=>String(s.section)))];
  for(const section of order){
   const rows=new Map();
   for(const seat of seats.filter(s=>s.available&&String(s.section)===section&&Number.isInteger(s.number))){
    const row=String(seat.row);if(!rows.has(row))rows.set(row,[]);rows.get(row).push(seat);
   }
   for(const row of rows.values()){
    row.sort((a,b)=>a.number-b.number);
    const complete=seats.filter(s=>String(s.section)===section&&String(s.row)===String(row[0].row)&&Number.isInteger(s.number));
    const center=(Math.min(...complete.map(s=>s.number))+Math.max(...complete.map(s=>s.number)))/2;
    for(let i=0;i<=row.length-count;i++){
     const group=row.slice(i,i+count);
     if(group.every((s,j)=>!j||(s.number===group[j-1].number+1&&(!s.block||s.block===group[j-1].block))))
      candidates.push({group,section:order.indexOf(section),distance:Math.abs((group[0].number+group.at(-1).number)/2-center)});
    }
   }
  }
  candidates.sort((a,b)=>a.section-b.section||a.distance-b.distance);
  return candidates[0]?.group||[];
 }
 function chooseWithFallback(seats,count,preferences=sections,adjacent=false,position=null){
  const eligible=position?seats.filter(s=>{if(!Number.isInteger(s.rowIndex)||!Number.isInteger(s.rowTotal)||s.rowIndex<1||s.rowIndex>s.rowTotal)return false;const a=Math.ceil(s.rowTotal/3),b=Math.ceil(2*s.rowTotal/3);return s.rowTotal===1||(position==='front'?s.rowIndex<=a:position==='middle'?s.rowIndex>a&&s.rowIndex<=b:s.rowIndex>b);}):seats;
  const primary=chooseSeats(eligible,count,preferences);if(primary.length||!adjacent||!preferences.length)return primary;
  if(seats.some(s=>!Number.isFinite(s.x)||!Number.isFinite(s.y)))return [];
  const centers=new Map();for(const s of seats){if(!centers.has(String(s.section)))centers.set(String(s.section),[]);centers.get(String(s.section)).push(s);}
  const mean=list=>({x:list.reduce((a,s)=>a+s.x,0)/list.length,y:list.reduce((a,s)=>a+s.y,0)/list.length});
  const points=[...centers].map(([section,list])=>({section,...mean(list)})),anchors=points.filter(p=>preferences.includes(p.section));if(!anchors.length)return [];
  const fallback=points.filter(p=>!preferences.includes(p.section)).map(p=>({...p,distance:Math.min(...anchors.map(a=>Math.hypot(a.x-p.x,a.y-p.y)))})).sort((a,b)=>a.distance-b.distance).map(p=>p.section);
  return chooseSeats(eligible,count,fallback);
 }
 root.TicketPlanner={chooseSeats,chooseWithFallback,sections};
})(globalThis);
