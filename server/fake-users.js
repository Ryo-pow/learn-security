const crypto = require("crypto");
const { USER_COUNT } = require("./config");

/* ===== 架空データの自動生成（決定論的・毎回同じ）===== */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const SEI = ["佐藤","鈴木","高橋","田中","渡辺","伊藤","山本","中村","小林","加藤","吉田","山田","佐々木","山口","松本","井上","木村","林","清水","森"];
const MEI = ["はると","ゆうと","そうた","れん","ゆい","ひなた","めい","あおい","さくら","ゆうき","りく","かえで","みなと","つむぎ","いちか","ひまり","あかり","そら","なぎさ","りこ"];
const CITY = ["東京都港区","大阪市北区","名古屋市中区","札幌市中央区","福岡市博多区","横浜市西区","京都市下京区","神戸市中央区","仙台市青葉区","広島市中区"];
// よくある弱いパスワード例（使い回しの危険を伝えるための教材用。架空アカウント専用）
const WEAKPW = ["password","123456","sakura","qwerty","111111","love1234","tokyo2026","iloveyou","nekochan","abc123","000000","hanako","ohana0423","soccer","password1"];

function md5(s){ return crypto.createHash("md5").update(s).digest("hex"); }

function genUsers(n){
  const rnd = mulberry32(20261112);
  const users = [];
  for(let i=1;i<=n;i++){
    const name = SEI[rnd()*SEI.length|0] + " " + MEI[rnd()*MEI.length|0];
    const pw   = WEAKPW[rnd()*WEAKPW.length|0] + (rnd()<0.4 ? "" : String(10+(rnd()*89|0)));
    const prem = rnd()<0.35;
    users.push({
      id: i,
      name,
      email: "user" + String(i).padStart(4,"0") + "@example.com",
      phone: "090-0000-" + String(i).padStart(4,"0"),          // 架空（中央が0000）
      address: CITY[rnd()*CITY.length|0] + (1+(rnd()*5|0)) + "-" + (1+(rnd()*20|0)) + "-" + (1+(rnd()*30|0)),
      birth: (1960+(rnd()*46|0)) + "-" + String(1+(rnd()*12|0)).padStart(2,"0") + "-" + String(1+(rnd()*28|0)).padStart(2,"0"),
      password: pw,                 // ← 平文保存（これ自体がダメな例）
      pw_md5: md5(pw),              // ← ハッシュ化しても弱いパスワードは逆引きされる、を見せる用
      plan: prem ? "プレミアム" : "一般",
      points: rnd()*5000|0,
      // 「暗号化済み🔒」に見せかけた base64（＝ただの変換、暗号ではない）
      memo_enc: Buffer.from("会員メモ：" + name + "さんは" + (prem?"プレミアム":"一般") + "会員。支払いカード下4桁 " + String(1000+(rnd()*9000|0)), "utf8").toString("base64")
    });
  }
  return users;
}
const USERS = genUsers(USER_COUNT);
const byId = new Map(USERS.map(u=>[u.id,u]));

module.exports = { mulberry32, CITY, md5, USERS, byId };
