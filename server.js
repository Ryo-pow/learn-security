// 個人情報どこまで見えてる？ ― 情報漏えい体験ブース（ローカルLAN版）サーバー
// Node.js の標準モジュールだけで動きます（追加インストール不要）。
// 使い方:  node server.js
// 同じPC（またはWi-Fi内の端末）のブラウザで、表示されるURLを開いてください。
//
// ★ ここで扱う会員データは、すべてこのプログラムが自動生成した「架空データ」です。
//   実在の人物・連絡先とは一切関係ありません（メールは example.com、電話は 090-0000-xxxx など）。
// ★ 通信はすべてこのPCの中（同じWi-Fi内）だけを通り、外部やクラウドには一切出ません。
// ★ これは「わざと脆弱に作った教材」です。現実の他人のサイトやシステムには絶対に使わないでください。
//
// ファイル構成:
//   server.js              … 起動（このファイル）
//   server/config.js       … 設定値（ポート・会員数など）
//   server/fake-users.js   … 架空会員データの自動生成
//   server/visitors.js     … 来場者の偽アカウント
//   server/products.js     … 商品と正しい値段
//   server/http-utils.js   … JSON応答・リクエスト本文読み取り
//   server/static-files.js … 画面（client.html / client/）の配信
//   server/api.js          … ゲーム①の API（わざと脆弱な箇所あり）
//   server/realtime.js     … ゲーム②のローカル通信
//   server/app.js          … リクエストの振り分け

const os = require("os");
const { PORT } = require("./server/config");
const { USERS } = require("./server/fake-users");
const { server } = require("./server/app");

server.listen(PORT, "0.0.0.0", ()=>{
  const nets = os.networkInterfaces();
  const ips = [];
  for(const name of Object.keys(nets)) for(const n of nets[name]) if(n.family==="IPv4" && !n.internal) ips.push(n.address);
  console.log("\n  個人情報どこまで見えてる？ ― 情報漏えい体験ブース（ローカル版）が起動しました");
  console.log("  架空の会員 " + USERS.length + " 人分のダミーデータを用意しました（すべて自動生成・実在しません）。\n");
  console.log("  このPC自身で開く   : http://localhost:" + PORT);
  if(ips.length){
    console.log("\n  同じWi-Fi内の端末（スマホなど）から開く:");
    for(const ip of ips) console.log("    http://" + ip + ":" + PORT);
  } else {
    console.log("\n  （他のネットワーク用IPが見つかりませんでした。PCとスマホを同じWi-Fiにつないでください）");
  }
  console.log("\n  会員数を変えたいとき : USERS=3000 node server.js");
  console.log("  ポートを変えたいとき : PORT=9000 node server.js");
  console.log("  通信はこのPCの中だけを通り、外部やクラウドには一切出ません。");
  console.log("  終了する : Ctrl + C\n");
});