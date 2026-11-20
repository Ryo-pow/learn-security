/* ================================================================
   ゲーム② のぞき見チャレンジ（ローカル通信）
   ================================================================ */
const SUITS=["♠","♥","♦","♣"], RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const SMAP={"♠":"S","♥":"H","♦":"D","♣":"C"}, SMAPr={S:"♠",H:"♥",D:"♦",C:"♣"};
const encCard=(s,r)=>btoa(SMAP[s]+":"+r);
const decCard=b=>{ try{ const [sc,r]=atob(b).split(":"); return SMAPr[sc]?{s:SMAPr[sc],r}:null; }catch(e){ return null; } };
const isRed=s=>s==="♥"||s==="♦";
const uid=()=>Math.random().toString(36).slice(2,9);
let CR=null, cst={ name:"", round:null, guess:null, peeked:null }, pickS=null, pickR=null, drawS=null, drawR=null, lastOdId=null;

function makeLocalRoom(code){
  const peerId="p_"+uid(); let myPresence={}, cache=[], listeners=[], up=false;
  const es=new EventSource("/events?room="+encodeURIComponent(code)+"&peer="+peerId);
  es.onopen=()=>{ up=true; cardRender(); };
  es.onerror=()=>{ up=false; cardRender(); };
  es.onmessage=ev=>{ try{ const m=JSON.parse(ev.data); if(m.type==="peers"){ cache=m.peers.map(e=>({peer:e.peer,isMe:e.peer===peerId,presence:e.presence||{}})); listeners.forEach(cb=>cb()); } }catch(e){} };
  function post(){ fetch("/presence",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({room:code,peer:peerId,presence:myPresence})}).catch(()=>{}); }
  return {
    presence:(patch)=>{ myPresence={...myPresence}; for(const k in patch){ if(patch[k]===null) delete myPresence[k]; else myPresence[k]=patch[k]; } post(); },
    peers:()=>cache, connected:()=>up, onPeers:(cb)=>listeners.push(cb), leave:()=>{ try{es.close();}catch(e){} }
  };
}
function cardBroadcast(){ if(!CR) return; let round=null;
  if(cst.round){ round={id:cst.round.id,status:cst.round.status,enc:cst.round.enc}; if(cst.round.status==="revealed"){ round.s=cst.round.s; round.r=cst.round.r; round.correct=cst.round.correct; } }
  CR.presence({ name:cst.name, round, guess:cst.guess||null, peeked:cst.peeked||null, activity:cst.activity||null });
}
// 相手が今なにをしているか
function partnerStatus(p){
  if(!p||!p.presence) return "";
  const pr=p.presence;
  if(pr.round&&pr.round.status==="waiting") return "🃏 相手がカードを出しました（あなたが当てる番）";
  if(cst.round&&cst.round.status==="waiting"&&pr.guess&&pr.guess.roundId===cst.round.id) return "✍️ 相手があなたの出題に回答しました";
  if(pr.round&&pr.round.status==="revealed") return "✅ 相手の出題は決着しました";
  if(pr.activity==="drawpick") return "🤔 相手が出すカードを選んでいます…";
  if(pr.activity==="guesspick") return "🤔 相手が回答を選んでいます…";
  return "🕗 相手は待機中です";
}
function cardOthers(){ return CR? CR.peers().filter(p=>!p.isMe):[]; }
function otherDrawer(){ return cardOthers().find(p=>p.presence&&p.presence.round&&p.presence.round.status==="waiting")||null; }
// 自分が回答した出題が、相手側で公開された（＝結果が出た）
function otherRevealedForMe(){ return cardOthers().find(p=>p.presence&&p.presence.round&&p.presence.round.status==="revealed"&&cst.guess&&p.presence.round.id===cst.guess.roundId)||null; }

function checkCardName(){ $("cjoin").disabled=!($("cname").value.trim()&&$("croom").value.trim()); }
$("cname").addEventListener("input",checkCardName); $("croom").addEventListener("input",checkCardName);
$("cjoin").onclick=()=>{ const code=$("croom").value.trim().toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龠_.\-]/g,"-").slice(0,40)||"lobby";
  cst={ name:$("cname").value.trim(), round:null, guess:null, peeked:null }; pickS=pickR=null;
  CR=makeLocalRoom(code); CR.onPeers(()=>{ checkReveal(); cardRender(); }); cardBroadcast(); show("scCardPlay"); cardRender(); };
$("cardLeave").onclick=goHome;

function pcard(s,r,back){ const d=document.createElement("div"); d.className="pcard "+(back?"back":(isRed(s)?"red":"blk")); d.textContent=back?"":(r+"\n"+s); return d; }
function checkReveal(){ // 出題者側：相手が当てたら正解判定して公開
  if(!cst.round||cst.round.status!=="waiting") return;
  for(const p of cardOthers()){ const g=p.presence&&p.presence.guess;
    if(g&&g.roundId===cst.round.id){ cst.round.status="revealed"; cst.round.correct=(g.s===cst.round.s&&g.r===cst.round.r); cardBroadcast(); break; } }
}
function peekedOnMe(){ // 自分の出題が、相手にのぞかれたか
  if(!cst.round) return false;
  return cardOthers().some(p=>p.presence&&p.presence.peeked&&p.presence.peeked.roundId===cst.round.id);
}
function cardRender(){
  if(!CR) return;
  const conn=CR.connected(); $("cdot").className="dot"+(conn?"":" off");
  const others=cardOthers();
  $("cstat").textContent = !conn? "接続が切れています" : (others.length? ("相手がいます（"+((others[0].presence&&others[0].presence.name)||"あいて")+"）") : "相手を待っています…（もう1台で同じあいことばを入れてね）");
  // 相手の状況
  const wb=$("cwhatbar"); if(others.length){ $("cwhat").textContent=partnerStatus(others[0]); wb.hidden=false; } else { wb.hidden=true; }
  const stage=$("cstage"); const od=otherDrawer(); const orm=otherRevealedForMe();
  // 1) 自分が出題中
  if(cst.round && cst.round.status==="waiting"){
    const box=document.createElement("div"); box.className="cardbox";
    box.innerHTML=`<p class="lead" style="text-align:center">あなたが出したカード（あなたには見えています）。相手の画面では裏向きです。相手が当てるのを待っています。</p>`;
    box.appendChild(pcard(cst.round.s,cst.round.r,false));
    const info=document.createElement("div");
    if(peekedOnMe()){
      info.innerHTML=`<div class="peeked"><div class="big">💥 のぞかれました！</div>
        <p style="margin:6px 0 0">あなたのカード <b>${cst.round.s}${cst.round.r}</b> は、相手の画面では裏向きでも<b>相手の端末に届いていた</b>ので、のぞき見されました。</p></div>
        <div class="explain"><div class="why"><b>なぜ？</b> 勝敗判定のために、出したカードを相手の端末へ<b>こっそり送って</b>いたから。${T("base64","base64")}で見た目を変えても、ただの変換なので戻せます。画面に出していない＝安全ではありません。</div>
        <div class="termrow">言葉の意味：${["sse","base64","client"].map(k=>T(k)).join(" ")}</div>
        <div class="fix"><b>正しい作り方：</b> 答え（出したカード）は${T("server","サーバー")}側に隠し、回答し終わってから「正解はこれ」と送る。端末に送るのは見せていいデータだけ。</div></div>
        <button class="btn block" id="cagain" type="button">🎴 もう一度出題する</button>`;
    } else {
      info.innerHTML=`<button class="btn sub block" id="ccancel" type="button">やめて選び直す</button>`;
    }
    box.appendChild(info); stage.innerHTML=""; stage.appendChild(box);
    const resetDraw=()=>{ cst.round=null; drawS=drawR=null; cst.activity=null; cardBroadcast(); cardRender(); };
    const ag=$("cagain"); if(ag) ag.onclick=resetDraw; const cc=$("ccancel"); if(cc) cc.onclick=resetDraw;
    // 公開済みなら結果
  } else if(cst.round && cst.round.status==="revealed"){
    stage.innerHTML=`<div class="cardbox"><p class="lead">あなたが出した：<b>${cst.round.s}${cst.round.r}</b></p>
      <div class="${cst.round.correct?"verdict hit":"verdict miss"}"><div class="big">${cst.round.correct?"相手は当てました 🎯":"相手ははずれ"}</div></div>
      <button class="btn block" id="cagain2" type="button">🎴 もう一度出題する</button></div>`;
    $("cagain2").onclick=()=>{ cst.round=null; drawS=drawR=null; cst.activity=null; cardBroadcast(); cardRender(); };
  // 2a) 自分の回答が公開された → 結果（当てる側にも正解を表示）
  } else if(orm){
    const rd=orm.presence.round, correct=(cst.guess.s===rd.s&&cst.guess.r===rd.r);
    const wrap=document.createElement("div"); wrap.className="cardbox";
    wrap.innerHTML=`<p class="lead" style="text-align:center">相手が出していたカードは…</p>`;
    wrap.appendChild(pcard(rd.s,rd.r,false));
    stage.innerHTML=""; stage.appendChild(wrap);
    stage.insertAdjacentHTML("beforeend",`<div class="${correct?"verdict hit":"verdict miss"}"><div class="big">${correct?"🎯 正解！":"ざんねん、はずれ"}</div>
      <div class="note">あなたの回答：${cst.guess.s}${cst.guess.r} ／ 正解：${rd.s}${rd.r}</div></div>
      <button class="btn block" id="cnext" type="button">次へ</button>`);
    if(correct) confetti();
    $("cnext").onclick=()=>{ cst.guess=null; cardBroadcast(); cardRender(); };
  // 2) 相手が出題中 → 当てる（回答済みなら結果待ち）
  } else if(od){
    if(lastOdId!==od.presence.round.id){ pickS=pickR=null; lastOdId=od.presence.round.id; }
    if(cst.guess && cst.guess.roundId===od.presence.round.id){
      stage.innerHTML=`<div class="cardbox"><div class="pcard back"></div></div>
        <p class="lead" style="text-align:center">回答しました（<b>${cst.guess.s}${cst.guess.r}</b>）。相手が結果を出すのを待っています…</p>`;
    } else {
      stage.innerHTML=`<p class="lead" style="text-align:center"><b>${esc((od.presence.name)||"あいて")}</b> さんがカードを出しました。マークと数字で当ててみよう。</p>
        <div class="cardbox"><div class="pcard back"></div></div>
        <div class="suits">${SUITS.map(s=>`<button type="button" class="${isRed(s)?"red":"blk"}" data-s="${s}" aria-pressed="${s===pickS}">${s}</button>`).join("")}</div>
        <div class="ranks">${RANKS.map(r=>`<button type="button" data-r="${r}" aria-pressed="${r===pickR}">${r}</button>`).join("")}</div>
        <button class="btn block" id="cguess" type="button" ${pickS&&pickR?"":"disabled"}>これだ！回答する</button>
        <p class="note" style="text-align:center;margin-top:10px">このカードは画面では裏向き。でも、中身は<b>あなたの端末にも届いています</b>。</p>`;
      stage.querySelectorAll(".suits button").forEach(b=>b.onclick=()=>{ pickS=b.dataset.s; setCardSel(); });
      stage.querySelectorAll(".ranks button").forEach(b=>b.onclick=()=>{ pickR=b.dataset.r; setCardSel(); });
      $("cguess").onclick=()=>sendGuess(od);
    }
  // 3) 待機／出題できる（出したいカードを自分で選ぶ）
  } else {
    if(!others.length){
      stage.innerHTML=`<p class="lead" style="text-align:center">相手が入るのを待っています…（もう1台で同じあいことばを入れてね）</p>`;
    } else {
      stage.innerHTML=`<p class="lead" style="text-align:center">あなたが出題します。<b>出したいカード</b>をマークと数字で選んでね（相手がそれを当てます）。</p>
        <div class="cardbox"><div class="pcard ${drawS&&drawR?(isRed(drawS)?'red':'blk'):'back'}" id="drawPreview">${drawS&&drawR?(drawR+'\n'+drawS):''}</div></div>
        <div class="suits">${SUITS.map(s=>`<button type="button" class="${isRed(s)?"red":"blk"}" data-ds="${s}" aria-pressed="${s===drawS}">${s}</button>`).join("")}</div>
        <div class="ranks">${RANKS.map(r=>`<button type="button" data-dr="${r}" aria-pressed="${r===drawR}">${r}</button>`).join("")}</div>
        <button class="btn block" id="cdraw" type="button" ${drawS&&drawR?"":"disabled"}>🎴 このカードで出題する</button>`;
      stage.querySelectorAll(".suits button[data-ds]").forEach(b=>b.onclick=()=>{ drawS=b.dataset.ds; setDrawSel(); });
      stage.querySelectorAll(".ranks button[data-dr]").forEach(b=>b.onclick=()=>{ drawR=b.dataset.dr; setDrawSel(); });
      const d=$("cdraw"); if(d) d.onclick=()=>{ if(drawS&&drawR) startRound(drawS,drawR); };
    }
  }
}
function setCardSel(){ document.querySelectorAll("#cstage .suits button[data-s]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.s===pickS));
  document.querySelectorAll("#cstage .ranks button[data-r]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.r===pickR));
  const g=$("cguess"); if(g) g.disabled=!(pickS&&pickR);
  cst.activity="guesspick"; cardBroadcast(); }
function setDrawSel(){ document.querySelectorAll("#cstage .suits button[data-ds]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.ds===drawS));
  document.querySelectorAll("#cstage .ranks button[data-dr]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.dr===drawR));
  const pv=$("drawPreview"); if(pv){ if(drawS&&drawR){ pv.className="pcard "+(isRed(drawS)?"red":"blk"); pv.textContent=drawR+"\n"+drawS; } else { pv.className="pcard back"; pv.textContent=""; } }
  const d=$("cdraw"); if(d) d.disabled=!(drawS&&drawR);
  cst.activity="drawpick"; cardBroadcast(); }
function startRound(s,r){ cst.round={ id:"r_"+uid(), status:"waiting", enc:encCard(s,r), s, r }; cst.guess=null; cst.peeked=null; drawS=drawR=null; cst.activity=null; cardBroadcast(); cardRender(); }
function sendGuess(od){ if(!pickS||!pickR) return; cst.guess={ roundId:od.presence.round.id, s:pickS, r:pickR }; cst.activity=null; pickS=pickR=null; cardBroadcast(); cardRender(); }
// 開発者ツール専用の“のぞき見”（PCでしか実行できない。画面にボタンは出さない）
window.peek=function(){
  if(!CR){ console.log("%c先にゲーム②に入ってください。","color:#c77b12"); return undefined; }
  const od=otherDrawer();
  if(!od||!od.presence.round){ console.log("%c相手はまだカードを引いていません。","color:#c77b12"); return undefined; }
  const c=decCard(od.presence.round.enc);
  if(!c){ console.log("データを読めませんでした。"); return undefined; }
  // のぞいたことを相手に通知（相手の画面に「のぞかれました」が出る）
  cst.peeked={ roundId:od.presence.round.id }; cardBroadcast();
  console.log("%c相手のカードは → "+c.s+c.r,"font-size:22px;font-weight:bold;color:#e23b4e");
  console.log("（画面では裏向きでも、引いたカードはあなたの端末に届いています。届いた文字列 "+JSON.stringify(od.presence.round.enc)+" を base64 として atob で戻しただけ。相手の画面には『のぞかれました』と出ます）");
  return c.s+c.r;
};
