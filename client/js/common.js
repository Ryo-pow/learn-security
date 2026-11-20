/* ============ 共通の小道具（要素取得・API呼び出し・HTMLエスケープ） ============ */
const $=id=>document.getElementById(id);
const api=async(path,opt)=>{ const r=await fetch(path,opt); const d=await r.json().catch(()=>({})); return {status:r.status,data:d}; };
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
