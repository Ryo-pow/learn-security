// 画面（client.html）と、その CSS / JavaScript を配信する
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CLIENT = fs.readFileSync(path.join(ROOT, "client.html"), "utf8");
const CLIENT_DIR = path.join(ROOT, "client");
const TYPES = { ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8" };

// 処理したら true、担当外なら false を返す
function handleStatic(req, res, p){
  if(req.method!=="GET") return false;

  // トップページ（教材本体）
  if(p==="/"||p==="/index.html"){
    res.writeHead(200,{ "Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store" });
    res.end(CLIENT); return true;
  }

  // client/ フォルダの CSS・JS（フォルダの外は読ませない）
  if(p.startsWith("/client/")){
    const file = path.join(CLIENT_DIR, path.normalize(decodeURIComponent(p.slice("/client/".length))));
    const type = TYPES[path.extname(file)];
    if(!file.startsWith(CLIENT_DIR + path.sep) || !type || !fs.existsSync(file)) return false;
    res.writeHead(200,{ "Content-Type":type, "Cache-Control":"no-store" });
    res.end(fs.readFileSync(file)); return true;
  }
  return false;
}

module.exports = { handleStatic };
