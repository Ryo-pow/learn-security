/* ================================================================
   ゲーム① 情報まもりクエスト
   ================================================================ */
let META={count:0,you:1,base:1000}, G={ me:null, score:0, idx:0, actionDone:false };
(async()=>{ const {data}=await api("/api/meta"); META=data;
  const chips=$("pwChips"); ["password","123456","sakura","qwerty","iloveyou"].forEach(p=>{
    const b=document.createElement("button"); b.type="button"; b.textContent=p; b.onclick=()=>{ $("pw").value=p; checkJoin(); }; chips.appendChild(b); });
})();
function checkJoin(){ $("joinBtn").disabled=!($("nick").value.trim() && $("pw").value.trim()); $("joinHint").hidden=!$("joinBtn").disabled; }
$("nick").addEventListener("input",checkJoin); $("pw").addEventListener("input",checkJoin);
$("joinBtn").onclick=async()=>{
  $("joinBtn").disabled=true;
  const {status,data}=await api("/api/join",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:$("nick").value.trim(),password:$("pw").value})});
  if(status!==200){ $("joinErr").hidden=false; $("joinErr").textContent="登録できませんでした。もう一度お試しください。"; $("joinBtn").disabled=false; return; }
  G.me=data.record; G.score=0; G.idx=0; loadMission(0);
};
$("restart").onclick=()=>location.reload();
function addScore(n){ const el=$("scoreVal"); const from=G.score; G.score+=n; const to=G.score,t0=performance.now();
  (function tick(now){ const k=Math.min(1,(now-t0)/500); el.textContent=Math.round(from+(to-from)*k); if(k<1)requestAnimationFrame(tick); })(t0); }
function setProg(){ $("progLabel").textContent="事件 "+(G.idx+1)+" / 4 ・ "+MISSIONS[G.idx].name; $("progBar").style.width=(G.idx/4*100)+"%"; }

/* 各事件のデータ
   進む順番：①予想する → ②使う人になって実際にやってみる → ③まとめ（👤使う人の目線 → 🛠作る人の目線）
   ※「伝えたいこと(point)」は答えになってしまうので、予想と体験が終わってから表示する */
const MISSIONS=[
  { name:"会員番号の書き換え", kicker:"事件① ・ 会員番号の書き換え", title:"マイページの会員番号を、他人の番号に書き換えてみよう",
    point:`サイトが<b>番号だけで「誰の情報か」を決めている</b>と、番号を変えるだけで他人の情報が、さらには全員分が見えてしまう。`,
    story:()=>`あなたは、この会員サイトを使っている No.${G.me.id} の利用者。マイページのアドレスに会員番号が入っていて、その番号を<b>自分で書き換えられる</b>ことに気づきました。`,
    q:"番号を他人のものに変えて開くと…？", safe:["ブロックされる","本人しか見られないはず"], scary:["他人の情報が見える","住所やパスワードまで"], truth:"scary", render:renderIdor,
    userWhat:`番号を変えただけで、知らない人の名前・住所・電話番号・パスワードが見えました。「全会員を取り出す」では、<b>さっき登録したあなたの情報も</b>一覧に入っていました。利用者が気をつけていても、サイトの作りが悪ければ情報は漏れてしまいます。`,
    userTodo:[
      `<b>パスワードはサイトごとに変える</b>。1つのサイトから漏れても、ほかのサイトまで乗っ取られずにすみます。`,
      `<b>二段階認証（ログイン時のコード確認）をオンにする</b>。パスワードが漏れても、それだけではログインされにくくなります。`,
      `<b>必要のない情報は登録しない</b>。生年月日や住所などの「任意」の欄は空けておけば、漏れる量が減ります。`,
      `「情報漏えいのお知らせ」が届いたら、<b>すぐにパスワードを変える</b>。`,
      `番号を変えて他人の情報が出てしまったら、<b>それ以上見たり保存したりせず</b>、サイトの問い合わせ窓口に知らせる（見続けると不正アクセスになることがあります）。`
    ],
    why:`「誰の情報を返すか」を${T("request","リクエスト")}の<b>番号そのまま</b>で決め、「それがあなた本人か」を${T("auth","確かめて（認可）")}いませんでした。だから番号を書き換えれば他人の情報も全員分も返ってきます。番号は連番なので <code>1,2,3…</code> と回せば数十万件でも数秒で抜かれます。`,
    cwe:["IDOR","CWE-639","CWE-862"], terms:["idor","api","auth","request"],
    fix:`「ログイン中の本人は誰か」を${T("server","サーバー")}で確認し、<b>本人の情報だけ</b>返す。番号を渡されても本人のものでなければ拒否。上の「対策を有効にする」で弾かれるのを確認してみて。` },
  { name:"画面の裏側のぞき", kicker:"事件② ・ 画面の裏側のぞき", title:"マイページが“裏で”受け取っている情報を見てみよう",
    point:`画面に出ていなくても、あなたの情報はスマホに<b>届いていることがある</b>。そして、入力したパスワードが<b>そのまま返ってくる</b>サイトは、パスワードをそのまま保存している。`,
    story:()=>`あなたは今、このサイトの「マイページ」を開いています。マイページの画面に表示されているのは<b>「お名前」と「ポイント」の2つだけ</b>です。<br>ただ、スマホはこのページを表示するために、サイトから<b>情報を受け取って</b>います。受け取った情報は、本当に画面に見えている2つだけでしょうか？`,
    q:"画面に出ていない「あなたのパスワード」。スマホには届いている？", safe:["届いていない","画面に出てないなら大丈夫"], scary:["届いている","入力したそのままの形で"], truth:"scary", render:renderHidden,
    userWhat:`名前とポイントしか出ていない画面なのに、裏では住所や電話番号、そして<b>あなたが入力したパスワードが、そのままの形で</b>スマホに届いていました。<br>これは、このサイトがあなたのパスワードを<b>誰でも読める形のまま保存している</b>証拠です。このサイトから情報が漏れれば、あなたのパスワードもそのまま漏れます。`,
    userTodo:[
      `<b>パスワードを使い回さない</b>。こういうサイトから漏れたパスワードで、ほかのサイトにもログインされてしまいます。`,
      `「パスワードを忘れた」ときに<b>今のパスワードをそのままメールで送ってくるサイトは要注意</b>。きちんとしたサイトは保存したパスワードを読めないので、「新しく設定し直してください」と案内します。`,
      `学校や図書館などの<b>共用PCでログインしない</b>。使ったら必ずログアウトする。届いた情報が、次に使う人に読まれるおそれがあります。`,
      `登録するのは<b>本当に必要な情報だけ</b>にする。`
    ],
    why:`画面は名前とポイントしか<b>表示</b>していませんが、${T("server","サーバー")}は住所・電話・<b>パスワード</b>まで${T("client","あなたの端末")}に<b>送って</b>いました。「表示しない」のは目隠しにすぎず、届いたものは読める人には読めます。しかもパスワードを${T("plaintext","平文")}で保存しているので、返すことができてしまいました。`,
    cwe:["CWE-200","CWE-256","CWE-602"], terms:["client","pii","plaintext","hash","json"],
    fix:`端末に送るのは<b>本当に表示する項目だけ</b>。パスワードなどはそもそも返さない（隠すのではなく、最初から渡さない）。パスワードは${T("hash","ハッシュ")}にして保存し、サイト自身も元の文字を読めないようにする。` },
  { name:"暗号のふり見破り", kicker:"事件③ ・ 暗号のふり見破り", title:"「暗号化済み🔒」の会員メモを解読してみよう",
    point:`“暗号化”に見えても、<b>ただの変換</b>なら誰でも元に戻せる。「読めない文字」や「🔒マーク」だけで安全とは限らない。`,
    story:()=>`あなたの会員メモは「暗号化して保護しています」と書かれています。届いた文字列は、たしかに読めません。`,
    q:"この“暗号化済み🔒”の文字列、元に戻せる？", safe:["戻せない","暗号だから安全"], scary:["一瞬で戻せる","鍵がなくても"], truth:"scary", render:renderB64,
    userWhat:`「暗号化済み🔒」と書かれていたメモが、ワンタップで元の文章に戻りました。中にはカード番号の一部まで書かれていました。<b>「暗号化しています」という表示を信じていても、中身は守られていなかった</b>のです。`,
    userTodo:[
      `「暗号化しているから安全」「🔒」といった<b>表示だけで信用しない</b>。`,
      `カード番号やパスワードを、<b>メモ欄・自由記入欄・チャットに書かない</b>。決められた入力欄以外は、どう保存されるか分かりません。`,
      `ブラウザの鍵マーク（https）は「<b>通信の途中</b>が守られている」印。サイトの中でどう保存されているかまでは分かりません。`
    ],
    why:`この文字列は${T("encrypt","暗号")}ではなく ${T("base64","base64")} という「見た目を変えるだけの変換」。鍵もいらず <code>atob("…")</code> 一発で誰でも戻せます。「読めない文字＝守られている」は思い込みでした。`,
    cwe:["Security by Obscurity","CWE-326"], terms:["base64","encrypt","hash"],
    fix:`本当に隠したい情報は<b>そもそも端末に送らない</b>。暗号化が要るなら鍵で守る本物の${T("encrypt","暗号")}を使い、鍵は${T("server","サーバー")}側だけに置く。` },
  { name:"値段の書き換え", kicker:"事件④ ・ 値段の書き換え", title:"購入画面の値段を書き換えて、買ってみよう",
    point:`値段などの<b>大事な値を利用者の画面任せ</b>にすると、書き換えられてしまう。`,
    story:()=>`あなたが見ているのは、プレミアム会員（正規 <b id="rp">¥12,000</b>）の購入画面。なぜか値段の欄を書き換えられる作りになっています。`,
    q:"値段を安く書き換えて「購入」を押すと？", safe:["エラーで止まる","サーバーが気づくはず"], scary:["書き換えた値段で通る","そのまま請求される"], truth:"scary", render:renderPrice,
    userWhat:`対策のない状態では、画面で書き換えた値段が<b>そのまま請求額として扱われました</b>（対策を有効にすると、正規の値段で請求されます）。このように作りの弱いお店があると、お店が損をするだけでなく、<b>利用者にとっても「ほかの部分もずさんかもしれない」</b>というサインになります。`,
    userTodo:[
      `「バグで安く買える」方法を見つけても<b>使わない</b>。わざと使うと詐欺などの犯罪になることがあります。お店に知らせましょう。`,
      `買い物のあとは<b>請求額や明細を確認</b>し、カードの利用明細もときどきチェックする。`,
      `ネットで買い物をするときは<b>公式のサイトやアプリ</b>を使う。`
    ],
    why:`${T("server","サーバー")}が、画面から送られた<b>金額をそのまま信じて</b>請求しました。これは${T("clienttrust","クライアントを信用しすぎ")}という問題。値段・ポイント・残高を端末任せにすると、いくらでも書き換えられます。`,
    cwe:["CWE-602","ロジック改ざん"], terms:["clienttrust","client","server"],
    fix:`金額などの大事な値は<b>${T("server","サーバー")}が自分の記録から計算</b>する。端末から来た値段は信用しない。上の「対策を有効にする」で、値段を書き換えて送っても正規額で請求されるのを確認してみて。` }
];

function loadMission(i){
  G.idx=i; G.actionDone=false; show("scMission"); setProg();
  const m=MISSIONS[i], sc=$("scMission");
  sc.innerHTML=`
    <div><div class="kicker">${m.kicker}</div><h2>${esc(m.title)}</h2></div>
    <div class="steps"><span class="on">① 予想</span><span>② やってみる</span><span>③ まとめ</span></div>
    <p class="lead">${m.story()}</p>
    <div class="predict" id="predict">
      <div class="q">${esc(m.q)}</div>
      <div class="guide"><span class="hand">👇</span><span>まずは予想！ どちらだと思う？ <b>タップして選んでね</b></span></div>
      <div class="choices">
        <button class="choice safe" data-side="safe" type="button">${esc(m.safe[0])}<small>${esc(m.safe[1])}</small></button>
        <button class="choice scary" data-side="scary" type="button">${esc(m.scary[0])}<small>${esc(m.scary[1])}</small></button>
      </div></div>
    <div id="verdict"></div><div id="demo" hidden></div><div id="explain" hidden></div>
    <div id="nextWrap" hidden><button class="btn block" id="nextBtn" type="button">${i<3?"次の事件へ ▶":"結果を見る 🏁"}</button></div>`;
  sc.querySelectorAll(".choice").forEach(b=>b.onclick=()=>pick(m,b.dataset.side,b));
}
function pick(m,side,btn){
  $("predict").querySelectorAll(".choice").forEach(b=>{ b.disabled=true; if(b===btn)b.classList.add("picked"); });
  $("predict").querySelector(".guide").remove();
  const correct=side===m.truth; if(correct) addScore(50);
  $("verdict").innerHTML=`<div class="verdict ${correct?"hit":"miss"}"><div class="big">${correct?"🎯 予想的中！":"😮 おっと、逆でした"}</div>
     <div class="pts">${correct?"+50 まもりポイント":"大丈夫、やってみれば分かる"}</div></div>
     <span class="vp user">👤 使う人になって、実際にやってみよう ↓</span>`;
  setStep(2);
  const demo=$("demo"); demo.hidden=false; m.render(demo,m);
  // 結果と「やってみよう」が画面に入るようにスクロール
  setTimeout(()=>$("verdict").scrollIntoView({behavior:"smooth",block:"start"}), 150);
}
function setStep(n){ document.querySelectorAll("#scMission .steps span").forEach((s,i)=>s.classList.toggle("on",i<n)); }
function unlockNext(m){
  if(G.actionDone) return; G.actionDone=true; addScore(100); setStep(3);
  const ex=$("explain"); ex.hidden=false;
  ex.innerHTML=`<div class="explain">
    <div class="kicker">まとめ</div>
    <div class="point">💡 この事件で伝えたいこと：${m.point}</div>
    <div class="viewtab" role="tablist" aria-label="まとめの目線">
      <button type="button" role="tab" class="user" data-view="user" aria-selected="true">👤 使う人の目線</button>
      <button type="button" role="tab" class="dev" data-view="dev" aria-selected="false">🛠 作る人の目線</button>
    </div>
    <div class="note tabhint">いまは「👤 使う人の目線」。読んだら <b>「🛠 作る人の目線」をタップ</b> して切り替えてみよう</div>
    <div class="viewpane" data-pane="user">
      <div class="why"><b>何が起きた？</b> ${m.userWhat}</div>
      <div class="todo"><b>あなたができること</b><ul>${m.userTodo.map(t=>`<li>${t}</li>`).join("")}</ul></div>
    </div>
    <div class="viewpane" data-pane="dev" hidden>
      <div class="why"><b>なぜ起きた？</b> ${m.why}</div>
      <div class="cwe">${m.cwe.map(c=>`<span>${esc(c)}</span>`).join("")}</div>
      <div class="termrow">わからない言葉はタップ：${(m.terms||[]).map(k=>T(k)).join(" ")}</div>
      <div class="fix"><b>正しい作り方：</b> ${m.fix}</div>
    </div></div>`;
  // 目線の切り替え（一度に片方だけ表示して、情報量をしぼる）
  const hint=ex.querySelector(".tabhint");
  ex.querySelectorAll(".viewtab button").forEach(b=>b.onclick=()=>{
    ex.querySelectorAll(".viewtab button").forEach(x=>{ x.setAttribute("aria-selected",x===b); });
    ex.querySelectorAll(".viewpane").forEach(p=>p.hidden=(p.dataset.pane!==b.dataset.view));
    hint.innerHTML = b.dataset.view==="dev" ? "いまは「🛠 作る人の目線」。上でいつでも切り替えられます" : "いまは「👤 使う人の目線」。上でいつでも切り替えられます";
  });
  $("nextWrap").hidden=false;
  guide($("nextBtn"), "まとめを読み終わったら、下から先へ進もう");
  $("nextBtn").onclick=()=>{ if(G.idx<3){ confetti(); loadMission(G.idx+1); } else finish(); };
  toast("下に「まとめ」が出ました（タップで移動）", ex);
  confetti();
}
function fieldRow(k,v,danger){ return `<div class="field"><span class="k">${k}</span><span class="v${danger?" danger":""}">${esc(v)}</span></div>`; }

function renderIdor(el,m){
  el.innerHTML=`
    <div class="toggle"><label><input type="checkbox" id="fix"> 対策を有効にする（本人以外は拒否）</label><span class="note">※ まとめを読んだあとに試してね</span></div>
    <div class="idpick">
      <div class="idlabel">開く会員番号 <span class="note">（あなたの番号は No.${G.me.id}）</span></div>
      <div class="stepper"><button id="prev" type="button" aria-label="1つ前の番号">‹</button>
        <div class="idbox"><span>No.</span><input id="idIn" type="number" inputmode="numeric" value="${G.me.id>META.base?1:(G.me.id+1)}" min="1" aria-label="会員番号"></div>
        <button id="next" type="button" aria-label="1つ後の番号">›</button><button class="btn" id="open" type="button">開く</button></div></div>
    <div id="card"></div>
    <button class="btn danger block" id="all" type="button">⚠ 全会員の情報を一気に取り出す</button>
    <div id="scale" hidden>
      <div class="counter" id="cnt">0<small>人分が、たった今ぜんぶ抜き取られました</small></div>
      <div class="dots" id="dots"></div><div class="elapsed" id="elp"></div><div class="leaktable" id="tbl"></div></div>`;
  let reqNo=0; // 一番新しい「開く」だけを表示するための番号（古い応答で上書きされるのを防ぐ）
  const open=async id=>{
    const my=++reqNo;
    const fix=$("fix").checked;
    const url = fix ? `/api/user/safe?id=${id}&me=${G.me.id}` : `/api/user?id=${id}`;
    const {status,data}=await api(url);
    if(my!==reqNo) return;            // 後から別の「開く」が走っていたら、この古い結果は捨てる
    const c=$("card");
    if(status===404 && id===G.me.id){ // 自分のIDが見つからない＝サーバーが再起動して登録が消えた
      c.innerHTML=`<div class="card"><div class="err">⚠ あなたの登録（No.${G.me.id}）がサーバーから消えています</div>
        <div class="note" style="margin-top:4px">サーバーが再起動されると、登録した偽アカウントは消えます。お手数ですが最初から登録し直してください。</div>
        <button class="btn sub" type="button" style="margin-top:9px" onclick="location.reload()">最初から登録し直す</button></div>`;
      return;
    }
    if(status===403){
      c.innerHTML=`<div class="card"><div class="err">⛔ ${esc(data.error)}</div>
        <div class="note" style="margin-top:4px">対策ONでは、自分の番号（No.${G.me.id}）だけ見られます。</div>
        <button class="btn sub" id="openSelf" type="button" style="margin-top:9px">自分（No.${G.me.id}）を開く</button></div>`;
      const os=$("openSelf"); if(os) os.onclick=()=>{ $("idIn").value=G.me.id; open(G.me.id); }; return;
    }
    if(status!==200){ c.innerHTML=`<div class="card"><div class="err">⛔ ${esc(data.error||"見られません")}</div></div>`; return; }
    const mine=data.id===G.me.id; let rows=fieldRow("氏名",data.name);
    if(!fix){ rows+=fieldRow("メール",data.email)+fieldRow("電話",data.phone)+fieldRow("住所",data.address)+fieldRow("生年月日",data.birth)+fieldRow("パスワード",data.password,true); }
    else { rows+=fieldRow("プラン",data.plan)+fieldRow("ポイント",(data.points||0).toLocaleString()); }
    const hint = (fix&&mine) ? '<div class="note" style="margin-top:4px">番号を変えて他人を開こうとすると拒否されます。試してみて。</div>' : '';
    c.innerHTML=`<div class="card"><div class="ttl">会員 No.${data.id} <span class="tag ${mine?"":"warn"}">${mine?"あなた本人":"他人の情報！"}</span></div>${rows}${hint}</div>`;
  };
  // 案内：① 番号を変えて開く → ② 全会員を取り出す
  let triedOpen=false;
  const userOpened=()=>{ if(triedOpen||G.actionDone) return; triedOpen=true;
    guide($("all"), "② ほかの人の情報も見えたね。最後に「全会員の情報を一気に取り出す」を押してみよう"); };
  $("open").onclick=()=>{ open(Number($("idIn").value)||1); userOpened(); };
  $("prev").onclick=()=>{ $("idIn").value=Math.max(1,(Number($("idIn").value)||1)-1); open(Number($("idIn").value)); userOpened(); };
  $("next").onclick=()=>{ $("idIn").value=(Number($("idIn").value)||1)+1; open(Number($("idIn").value)); userOpened(); };
  $("fix").onchange=()=>{ open(Number($("idIn").value)||1); $("all").disabled=$("fix").checked; };
  $("all").onclick=async()=>{
    if($("fix").checked) return;
    const t0=performance.now(); const {status,data}=await api("/api/users"); const ms=Math.max(1,Math.round(performance.now()-t0));
    if(status!==200) return; window.__leaked=data.users; $("scale").hidden=false;
    const n=data.users.length, shown=Math.min(n,800), dots=$("dots"); dots.innerHTML="";
    for(let i=0;i<shown;i++) dots.appendChild(document.createElement("i"));
    const cnt=$("cnt"), tail=cnt.querySelector("small").outerHTML, dur=950, s0=performance.now();
    (function tick(now){ const k=Math.min(1,(now-s0)/dur); cnt.innerHTML=Math.round(n*k).toLocaleString()+tail;
      const hit=Math.floor(shown*k), cs=dots.children; for(let i=0;i<hit;i++) cs[i].classList.add("hit");
      if(k<1)requestAnimationFrame(tick); else for(const c of cs)c.classList.add("hit"); })(s0);
    $("elp").textContent="所要 "+ms+" ミリ秒（ノートPC1台・通信1回）。番号が連番だから、全員まとめて返ってきます。";
    const me=G.me; let html=`<table><thead><tr><th>No.</th><th>氏名</th><th>メール</th><th>電話</th><th>パスワード</th></tr></thead><tbody>`;
    html+=`<tr class="me"><td>${me.id}</td><td>${esc(me.name)} ←あなた！</td><td>${esc(me.email)}</td><td>${esc(me.phone)}</td><td class="pw">${esc(me.password)}</td></tr>`;
    const cap=Math.min(n,200);
    for(let i=0;i<cap;i++){ const u=data.users[i]; if(u.id===me.id) continue;
      html+=`<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td class="pw">${esc(u.password)}</td></tr>`; }
    html+=`</tbody></table>`; if(n>cap) html+=`<div class="more">…ほか ${(n-cap).toLocaleString()} 人分も、すでに端末に届いています</div>`;
    $("tbl").innerHTML=html; unlockNext(m);
  };
  open(Number($("idIn").value)||1);
  guide($("next"), "① ‹ › で番号を変えたり、番号を書き換えて「開く」を押したりしてみよう", {labelBefore:el.querySelector(".idpick")});
}
async function renderHidden(el,m){
  const {data}=await api("/api/user?id="+G.me.id);
  el.innerHTML=`<div class="card"><div class="ttl">📱 マイページの画面（あなたに見えているもの）</div>
      ${fieldRow("お名前",data.name)}${fieldRow("ポイント",(data.points||0).toLocaleString()+" pt")}
      <div class="note" style="margin-top:4px">画面に表示されているのは、この<b>2つだけ</b>です。</div></div>
    <button class="btn block" id="peek" type="button">🔍 スマホが受け取っていた情報を、ぜんぶ見てみる</button><div id="rawout"></div>`;
  guide($("peek"), "「ぜんぶ見てみる」を押して、スマホに届いていた情報を見てみよう");
  $("peek").onclick=()=>{
    $("peek").disabled=true;
    const row=(k,v,tag,cls)=>`<div class="irow ${cls||""}"><span class="k">${k}</span><span class="v mono">${esc(v)}</span>${tag?`<span class="src">${tag}</span>`:""}</div>`;
    const FAKE="ゲーム用の架空データ", MINE="あなたが登録画面で入力";
    // JSONの各行：画面に出していない項目を赤くする
    const keys=["id","name","email","phone","address","birth","password"], secret=new Set(["email","phone","address","birth","password"]);
    let s="{\n"; for(const k of keys){ const d=secret.has(k); s+=`  "${k}": ${d?'<span class="hl">':''}${esc(JSON.stringify(data[k]))}${d?'</span>':''},\n`; } s+="}";
    $("rawout").innerHTML=`
      <div class="sumup"><b>整理すると…</b><ol>
        <li>画面に<b>見えていた</b>情報は <b>2つ</b></li>
        <li>でも、スマホに<b>届いていた</b>情報は <b>7つ</b></li>
        <li>その中に、<b>あなたが入力したパスワード</b>がそのまま入っていた</li></ol></div>
      <div class="infogrp ok"><div class="gh">✅ 画面に表示されている情報（2つ）</div>
        ${row("お名前",data.name)}${row("ポイント",(data.points||0).toLocaleString()+" pt")}</div>
      <div class="infogrp ng"><div class="gh">⚠ 画面には表示されていないのに、スマホに届いていた情報（5つ）</div>
        ${row("パスワード",data.password,MINE,"pw")}
        ${row("メール",data.email,FAKE)}${row("電話番号",data.phone,FAKE)}${row("住所",data.address,FAKE)}${row("生年月日",data.birth,FAKE)}</div>
      <div class="plainbox" style="margin-top:12px">🔑 <b>いちばんの問題はパスワード「${esc(data.password)}」</b><br>これは、<b>あなたが少し前に登録画面で入力した文字</b>です。名前とポイントしか表示していないページなのに、裏ではパスワードが<b>入力したそのままの形</b>でスマホに送り返されていました。</div>
      <p class="note" style="margin-top:8px">※「ゲーム用の架空データ」と書かれたメール・電話番号・住所・生年月日は、あなたが入力したものではありません。本物のサイトなら会員登録のときに入力しているはずの情報を、このゲームでは<b>架空のもので自動的に用意</b>しています。</p>
      <details class="jsonbox"><summary>くわしい人向け：実際に届いたデータそのもの（JSON）を見る</summary>
        <p class="note" style="margin:8px 0">${T("json","JSON")}は、コンピュータ同士が情報をやりとりするときの書き方です。<code>"項目名": "中身"</code> がずらっと並んでいます。開発者ツールを使えば、誰でもこの形で見ることができます。</p>
        <div class="raw">${s}</div></details>`;
    unlockNext(m);
  };
}
async function renderB64(el,m){
  const {data}=await api("/api/user?id="+G.me.id); const enc=data.memo_enc||"";
  el.innerHTML=`<div class="secretbox">暗号化済み🔒　${esc(enc)}</div><button class="btn block" id="dec" type="button">🔓 解読してみる</button><div id="plain"></div>`;
  guide($("dec"), "「解読してみる」を押してみよう");
  $("dec").onclick=()=>{ let plain=""; try{ plain=decodeURIComponent(escape(atob(enc))); }catch(e){ plain="(解読できませんでした)"; }
    $("plain").innerHTML=`<div class="plainbox"><b>atob("…") で戻した中身：</b><br>${esc(plain)}<br><span class="note">鍵もパスワードも不要。base64 は暗号ではなく、ただの変換でした。</span></div>`; unlockNext(m); };
}
async function renderPrice(el,m){
  const {data}=await api("/api/product?id=premium_year"); const rp=$("rp"); if(rp) rp.textContent="¥"+data.price.toLocaleString();
  el.innerHTML=`<div class="card"><div class="ttl">🛒 ${esc(data.name)}</div>
      <div class="field"><span class="k">値段（円）※書き換え可</span>
        <input id="price" type="number" value="${data.price}" style="width:116px;border:2px solid var(--line);border-radius:9px;background:var(--bg);color:var(--ink);padding:6px 9px;font-family:var(--f-mono);text-align:right;min-width:0"></div>
      <div class="field"><span class="k">数量</span><span class="v">1</span></div></div>
    <div class="toggle"><label><input type="checkbox" id="pfix"> 対策を有効にする（サーバーが正規額で請求）</label></div>
    <button class="btn block" id="buy" type="button">この値段で購入する</button><div id="rcpt"></div>`;
  guide($("price"), "① 値段の数字を、好きな金額に書き換えてみよう", {labelBefore:el.querySelector(".card")});
  $("price").addEventListener("input",()=>{ if(!G.actionDone) guide($("buy"), "② 「この値段で購入する」を押してみよう"); }, {once:true});
  $("buy").onclick=async()=>{
    const safe=$("pfix").checked;
    const {data:r}=await api("/api/checkout"+(safe?"?safe=1":""),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:"premium_year",price:Number($("price").value),qty:1})});
    const rc=$("rcpt");
    if(r.safe){ rc.innerHTML=`<div class="receipt"><div>🧾 ${esc(G.me.name)} さん、ご購入ありがとうございます</div><div>${esc(r.productName)}</div>
        <div class="big ok">請求額：¥${r.charged.toLocaleString()}</div><div class="note" style="color:var(--green)">¥${Number($("price").value).toLocaleString()}を送っても、サーバーが正規額で請求。改ざんは通りません。</div></div>`; }
    else { const cheated=r.unit<r.realUnit; rc.innerHTML=`<div class="receipt"><div>🧾 ${esc(G.me.name)} さん、ご購入ありがとうございます</div><div>${esc(r.productName)}</div>
        <div class="big ${cheated?"bad":""}">請求額：¥${(r.charged||0).toLocaleString()}</div><div class="note" style="color:var(--red)">${cheated?`正規は¥${r.realUnit.toLocaleString()}なのに、あなたが送った¥${r.unit.toLocaleString()}で購入成立。サーバーが画面の値段を信じています。`:"サーバーは画面の値段をそのまま受け取りました。"}</div></div>`; }
    unlockNext(m);
  };
}
function finish(){ show("scResult"); $("progBar").style.width="100%"; confetti();
  const s=G.score; $("finalScore").textContent=s; let medal="🌱",rank="気づきの第一歩";
  if(s>=600){medal="🛡️";rank="ホワイトハッカー認定";} else if(s>=450){medal="🏅";rank="情報を守る番人";} else if(s>=300){medal="🔎";rank="セキュリティ見習い";}
  $("medal").textContent=medal; $("rankName").textContent=rank;
}
