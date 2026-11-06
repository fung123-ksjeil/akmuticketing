(function(root){
 const zones=[
 ['201','24,186 110,186 110,236 24,236',67,215,'limited'],
 ['101','120,186 219,186 219,213 157,230 120,230',156,210,'limited'],
 ['102','128,256 225,225 241,253 157,305',177,266,'r'],
 ['103','162,310 245,258 261,286 206,357',205,319,'vip'],
 ['104','221,359 274,294 290,302 290,419 221,419',255,380,'vip'],
 ['105','302,311 365,311 365,419 302,419',334,380,'vip'],
 ['106','378,302 394,294 447,359 447,419 378,419',409,380,'vip'],
 ['107','408,286 424,258 507,310 476,358',467,319,'vip'],
 ['108','428,253 444,225 540,256 511,305',494,266,'r'],
 ['109','449,186 548,186 548,230 511,230 449,213',514,210,'limited'],
 ['213','558,186 644,186 644,236 558,236',601,215,'limited'],
 ['202','42,302 115,258 137,295 63,338',89,306,'r'],
 ['203','65,341 139,299 159,332 86,375',109,344,'r'],
 ['204','88,379 161,336 180,366 107,410',130,380,'r'],
 ['205','221,427 261,427 261,513 221,513',241,477,'vip'],
 ['206','268,427 307,427 307,513 268,513',287,477,'vip'],
 ['207','314,427 354,427 354,513 314,513',334,477,'vip'],
 ['208','361,427 400,427 400,513 361,513',380,477,'vip'],
 ['209','407,427 447,427 447,513 407,513',427,477,'vip'],
 ['210','488,366 507,336 580,379 561,410',538,380,'r'],
 ['211','509,332 529,299 603,341 582,375',559,344,'r'],
 ['212','531,295 553,258 626,302 605,338',580,306,'r']
 ];
 function render(svg,selected,onSelect){
  const ns='http://www.w3.org/2000/svg';svg.replaceChildren();svg.setAttribute('viewBox','0 90 668 440');
  function node(tag,attrs,text){const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text)el.textContent=text;return el;}
  svg.append(node('circle',{cx:334,cy:201,r:93,fill:'#dedfda'}),node('circle',{cx:334,cy:201,r:44,fill:'#78a19c'}),node('text',{x:334,y:143,'text-anchor':'middle',class:'stage-label'},'STAGE'),node('text',{x:334,y:205,'text-anchor':'middle',class:'standing-label'},'STANDING'),node('text',{x:334,y:274,'text-anchor':'middle',class:'stage-label'},'STAGE'));
  for(const [section,points,x,y,grade] of zones){
   const group=node('g',{role:'button',tabindex:'0','aria-label':section+'구역','aria-pressed':String(section===selected),'data-section':section,class:'map-zone '+grade+(section===selected?' active':'')});
   group.append(node('polygon',{points}),node('text',{x,y,'text-anchor':'middle'},section));
   group.addEventListener('click',()=>onSelect(section));group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(section);}});svg.append(group);
  }
  for(const x of [199,469])svg.append(node('circle',{cx:x,cy:382,r:6,fill:'#777'}),node('text',{x,y:405,'text-anchor':'middle',class:'pillar-label'},'기둥'));
 }
 root.AkmuMap={render};
})(globalThis);
