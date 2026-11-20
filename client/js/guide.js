/* ============ 「次はここを押してね」案内 ============
   guide(要素, 文)   … その要素のすぐ上に「👇 文」を出す（同じ画面の前の案内は消える）
   toast(文, 行き先) … 画面下に通知を出す。タップすると行き先までスクロール */
function guide(target, text, opt={}){
  if(!target) return;
  const root=target.closest("section")||document;
  root.querySelectorAll(".guide[data-guided]").forEach(g=>g.remove());
  if(text){
    const g=document.createElement("div"); g.className="guide"; g.dataset.guided="1";
    g.innerHTML=`<span class="hand">👇</span><span>${text}</span>`;
    (opt.labelBefore||target).before(g);
  }
}
let toastTimer=null, toastDest=null;
function toast(text, dest){
  let t=$("toast");
  if(!t){ t=document.createElement("button"); t.id="toast"; t.type="button"; t.className="toast"; document.body.appendChild(t); }
  t.innerHTML=`<span class="hand">👇</span> ${text}`; t.hidden=false; toastDest=dest||null;
  t.onclick=()=>{ hideToast(); if(dest) dest.scrollIntoView({behavior:"smooth",block:"start"}); };
  clearTimeout(toastTimer); toastTimer=setTimeout(hideToast, 6000);
}
function hideToast(){ const t=$("toast"); if(t) t.hidden=true; toastDest=null; }
// 行き先が画面に入ったら、通知はもう要らないので消す
addEventListener("scroll",()=>{ if(toastDest && toastDest.getBoundingClientRect().top < innerHeight*0.75) hideToast(); },{passive:true});
