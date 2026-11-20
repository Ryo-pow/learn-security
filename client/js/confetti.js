/* ============ 紙吹雪 ============ */
function confetti(){ if(matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  const cv=$("confetti"); cv.hidden=false; const ctx=cv.getContext("2d"); cv.width=innerWidth; cv.height=innerHeight;
  const cols=["#06c755","#e23b4e","#2563eb","#c77b12","#7c3aed"], P=[];
  for(let i=0;i<80;i++) P.push({x:innerWidth/2,y:innerHeight/3,vx:(Math.random()-.5)*11,vy:Math.random()*-11-4,g:.35,c:cols[i%cols.length],s:5+Math.random()*5,r:Math.random()*6});
  let f=0;(function loop(){ f++; ctx.clearRect(0,0,cv.width,cv.height);
    P.forEach(p=>{ p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.r+=.2; ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s);ctx.restore(); });
    if(f<80)requestAnimationFrame(loop); else cv.hidden=true; })(); }
