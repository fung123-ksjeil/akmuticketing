(function(root){
 const targets=[{id:'60589',name:'연습 1 · 예스24 공연 60589',url:'https://ticket.yes24.com/Perf/60589'},{id:'60020',name:'연습 2 · 악뮤 부산 벡스코',url:'https://ticket.yes24.com/Special/60020'}];
 function matches(url,id){try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='ticket.yes24.com'||!targets.some(t=>t.id===id))return false;const path=u.pathname.match(/^\/(?:Perf|Special)\/(\d+)\/?$/i);if(path)return path[1]===id;const perf=[...u.searchParams].find(([key])=>key.toLowerCase()==='idperf');return /^\/Pages\/Perf\/Sale\/PerfSaleProcess\.aspx$/i.test(u.pathname)&&perf?.[1]===id;}catch{return false;}}
 function earliest(dates,times,now=Date.now()){
  const today=new Date(now+9*3600000).toISOString().slice(0,10);
  const days=[...new Set(dates)].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>=today).sort();
  const sessions=[...new Set(times)].filter(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t)).sort();
  for(const date of days)for(const time of sessions)if(Date.parse(date+'T'+time+':00+09:00')>now)return {date,time};
  return null;
 }
 root.PracticeCatalog={targets,matches,earliest};
})(globalThis);
