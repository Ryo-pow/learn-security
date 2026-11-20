// ゲーム①（情報まもりクエスト）用の API
// ★ わざと脆弱に作っている箇所には【脆弱】と書いてあります。
const { YOU } = require("./config");
const { USERS } = require("./fake-users");
const { addVisitor, findUser, allUsers } = require("./visitors");
const { PRODUCTS } = require("./products");
const { json, readBody } = require("./http-utils");

// 処理したら true、担当外なら false を返す
async function handleApi(req, res, u, p){
  // 全体情報（会員数・自分の番号）
  if(req.method==="GET" && p==="/api/meta"){
    return json(res,200,{ count:allUsers().length, base:USERS.length, you:YOU });
  }

  // 来場者が“自分の偽アカウント”を作る（体験用・架空・ローカル限定）
  if(req.method==="POST" && p==="/api/join"){
    const body = await readBody(req);
    let d={}; try{ d=JSON.parse(body); }catch(e){}
    const rec = addVisitor(d.name, d.password);
    return json(res,200,{ id:rec.id, record:rec, total:allUsers().length });
  }

  // 【脆弱】会員1人の全データ。本人確認（認可）を一切していない → 番号を変えれば誰の情報でも見える（IDOR）
  if(req.method==="GET" && p==="/api/user"){
    const id = Number(u.searchParams.get("id"));
    const user = findUser(id);
    if(!user) return json(res,404,{ error:"そのIDの会員はいません" });
    return json(res,200,user);        // ← パスワードや住所まで“まるごと”返している
  }

  // 【脆弱】会員一覧エンドポイント。認証なしで全員分の全データを返す → 1リクエストで全員漏えい
  if(req.method==="GET" && p==="/api/users"){
    const list = allUsers();
    return json(res,200,{ count:list.length, users:list });
  }

  // 【脆弱】ランキング。画面には上位3人しか出さないのに、応答には全員分を同梱（＝取りすぎ）
  if(req.method==="GET" && p==="/api/ranking"){
    const sorted = [...USERS].sort((a,b)=>b.points-a.points);
    const top = sorted.slice(0,3).map(u=>({ name:u.name, points:u.points }));
    return json(res,200,{ top, _all:USERS });   // ← 画面に出さないだけで全員分が届く
  }

  // 【対策版】ログイン中の本人(me)の、見せてよい項目だけを返す。本人以外のID（id!==me）は拒否。
  // ※本物の実装では me はサーバー側のセッションから取る。ここではデモとしてクライアントが持つ本人IDを使う。
  if(req.method==="GET" && p==="/api/user/safe"){
    const id = Number(u.searchParams.get("id"));
    const me = Number(u.searchParams.get("me"));
    if(!me) return json(res,403,{ error:"ログインが必要です" });
    if(id!==me) return json(res,403,{ error:"他人の情報は見られません（アクセス拒否）" });
    const user = findUser(id);
    if(!user) return json(res,404,{ error:"会員がいません" });
    return json(res,200,{ id:user.id, name:user.name, plan:user.plan, points:user.points }); // 必要最小限
  }

  // 商品情報（正しい値段）
  if(req.method==="GET" && p==="/api/product"){
    const pid = u.searchParams.get("id");
    const prod = PRODUCTS[pid];
    if(!prod) return json(res,404,{ error:"商品がありません" });
    return json(res,200,prod);
  }

  // 購入処理。safe=1 なら対策版。
  if(req.method==="POST" && p==="/api/checkout"){
    const body = await readBody(req);
    let d={}; try{ d=JSON.parse(body); }catch(e){}
    const prod = PRODUCTS[d.productId];
    if(!prod) return json(res,400,{ error:"商品が不正です" });
    const qty = Math.max(1, Number(d.qty)||1);
    const safe = u.searchParams.get("safe")==="1";
    if(safe){
      // 【正しい】クライアントの値段は無視し、サーバーが持つ正規の値段で計算する
      const charged = prod.price * qty;
      return json(res,200,{ ok:true, safe:true, productName:prod.name, unit:prod.price, qty, charged, note:"サーバー側の正規価格で請求しました" });
    } else {
      // 【脆弱】クライアントが送ってきた値段をそのまま信じる
      const unit = Number(d.price);
      const charged = unit * qty;
      return json(res,200,{ ok:true, safe:false, productName:prod.name, unit, qty, charged, realUnit:prod.price, note:"クライアントが送った値段で請求しました（！）" });
    }
  }

  return false;
}

module.exports = { handleApi };
