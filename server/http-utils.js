// レスポンス・リクエストを扱う小道具

// JSONを返す。各ハンドラが「処理した」と分かるように true を返す。
function json(res, code, obj){
  res.writeHead(code, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
  res.end(JSON.stringify(obj));
  return true;
}
function readBody(req){
  return new Promise(resolve=>{ let b=""; req.on("data",c=>{ b+=c; if(b.length>1e6) req.destroy(); }); req.on("end",()=>resolve(b)); });
}

module.exports = { json, readBody };
