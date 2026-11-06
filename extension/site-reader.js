globalThis.readTicketPage=()=>{
 const visible=e=>!!e.getClientRects().length&&e.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})!==false;
 const dates=new Set(),times=new Set(),grades=new Set();
 function datesFrom(text){for(const m of String(text).matchAll(/(20\d{2})\s*[.년/\-]\s*(\d{1,2})\s*[.월/\-]\s*(\d{1,2})/g)){const value=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;if(Date.parse(value+'T00:00:00Z')&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value)dates.add(value);}}
 for(const el of document.querySelectorAll('[data-date],time,[datetime],[id*="date" i],[class*="date" i],input[type="date"],option,button,a[title]')){
  if(el.tagName!=='OPTION'&&!visible(el))continue;if(el.tagName==='OPTION'&&(!el.parentElement||!visible(el.parentElement)||el.disabled))continue;
  for(const value of [el.getAttribute('data-date'),el.getAttribute('datetime'),el.getAttribute('title'),el.tagName==='INPUT'&&el.type==='date'?el.value:'',(el.textContent||'').length<160?el.textContent:''])if(value)datesFrom(value);
 }
 for(const el of document.querySelectorAll('[data-time],[id*="time" i],[id*="round" i],option,button')){
  if(el.tagName!=='OPTION'&&!visible(el))continue;if(el.tagName==='OPTION'&&(!el.parentElement||!visible(el.parentElement)||el.disabled))continue;
  const text=el.getAttribute('data-time')||((el.textContent||'').length<120?(el.textContent||''):'');
  for(const m of text.matchAll(/(?:^|[^\d])(\d{1,2})\s*[:시]\s*(\d{1,2})/g))if(+m[1]<24&&+m[2]<60)times.add(m[1].padStart(2,'0')+':'+m[2].padStart(2,'0'));
 }
 for(const el of document.querySelectorAll('label,th,td,li')){if(!visible(el))continue;const text=(el.textContent||'').trim();if(text.length<90&&/(?:VIP|R|S|A|B|스탠딩|standing|시야제한)\s*석/i.test(text))grades.add(text);}
 const sections=new Map();
 for(const el of document.querySelectorAll('[data-section]')){
  if(!visible(el))continue;const id=el.getAttribute('data-section');if(!id||id.length>40)continue;
  if(!sections.has(id))sections.set(id,{section:id,elements:0,knownAvailable:0,availabilityUnknown:0});const s=sections.get(id);s.elements++;
  if(el.getAttribute('data-available')==='true')s.knownAvailable++;else if(el.getAttribute('data-available')!=='false')s.availabilityUnknown++;
 }
 const heading=[...document.querySelectorAll('h1,h2')].find(visible);
 const source=new URL(location.href);const perf=[...source.searchParams].find(([key])=>key.toLowerCase()==='idperf');
 return {url:source.origin+source.pathname+(perf?'?IdPerf='+encodeURIComponent(perf[1]):''),title:(heading?.textContent||document.title||'').trim().slice(0,160),capturedAt:new Date().toISOString(),dates:[...dates].sort().slice(0,30),times:[...times].sort().slice(0,20),grades:[...grades].slice(0,12),sections:[...sections.values()].slice(0,40),frames:document.querySelectorAll('iframe').length,canvases:document.querySelectorAll('canvas').length};
};
