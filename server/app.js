// リクエストを、担当するファイルへ振り分ける
const http = require("http");
const { handleStatic } = require("./static-files");
const { handleApi } = require("./api");
const { handleRealtime } = require("./realtime");

const server = http.createServer(async (req,res)=>{
  const u = new URL(req.url, "http://x");
  const p = u.pathname;

  if(handleStatic(req, res, p)) return;            // 画面・CSS・JS
  if(await handleApi(req, res, u, p)) return;      // ゲーム①の API
  if(await handleRealtime(req, res, u, p)) return; // ゲーム②のローカル通信

  res.writeHead(404); res.end("not found");
});

module.exports = { server };
