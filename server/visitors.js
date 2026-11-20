const { mulberry32, CITY, md5, USERS, byId } = require("./fake-users");

/* ===== 来場者が作る“自分の偽アカウント”（体験を自分事にするため）===== */
// 端末ごとに1つ。古いものから自動で消える（上限あり）。すべて架空・ローカル限定。
const VISITOR_CAP = 150;
let nextVisitorId = 10001;
const visitors = new Map();        // id -> record
const visitorOrder = [];           // FIFO
function addVisitor(name, password){
  const rnd = mulberry32((nextVisitorId*2654435761)>>>0);
  const safeName = String(name||"ゲスト").slice(0,16);
  const pw = String(password||"password").slice(0,32);
  const id = nextVisitorId++;
  const rec = {
    id, name: safeName,
    email: "you" + id + "@example.com",
    phone: "090-7777-" + String(id).slice(-4),
    address: CITY[rnd()*CITY.length|0] + (1+(rnd()*5|0)) + "-" + (1+(rnd()*20|0)) + "-" + (1+(rnd()*30|0)),
    birth: (1980+(rnd()*30|0)) + "-" + String(1+(rnd()*12|0)).padStart(2,"0") + "-" + String(1+(rnd()*28|0)).padStart(2,"0"),
    password: pw,
    pw_md5: md5(pw),
    plan: "一般",
    points: rnd()*3000|0,
    memo_enc: Buffer.from("会員メモ：" + safeName + "さん（来場者）。登録パスワードは「" + pw + "」", "utf8").toString("base64"),
    visitor: true
  };
  visitors.set(id, rec); visitorOrder.push(id);
  while(visitorOrder.length > VISITOR_CAP){ const old=visitorOrder.shift(); visitors.delete(old); }
  return rec;
}
function findUser(id){ return byId.get(id) || visitors.get(id) || null; }
function allUsers(){ return USERS.concat(visitorOrder.map(i=>visitors.get(i)).filter(Boolean)); }

module.exports = { addVisitor, findUser, allUsers };
