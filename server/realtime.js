// ===== ゲーム②（のぞき見チャレンジ）用のローカル通信 =====
// 同じ「あいことば（room）」に入った2台を、このPCの中だけでつなぐ。外部には出ない。
const { readBody } = require("./http-utils");

// room名 -> Map(peerId -> { presence, res(SSE) })
const sseRooms = new Map();
function sseRoom(name){ if(!sseRooms.has(name)) sseRooms.set(name, new Map()); return sseRooms.get(name); }
function sseBroadcast(name){
  const r = sseRoom(name);
  const peers = [...r.entries()].map(([peer,v])=>({ peer, presence:v.presence||{}, kind:"viewer" }));
  const payload = "data: " + JSON.stringify({ type:"peers", peers }) + "\n\n";
  for(const v of r.values()){ try{ v.res.write(payload); }catch(e){} }
}

// 処理したら true、担当外なら false を返す
async function handleRealtime(req, res, u, p){
  // サーバー→ブラウザ（相手の状態を配信）
  if(req.method==="GET" && p==="/events"){
    const name = u.searchParams.get("room") || "lobby";
    const peer = u.searchParams.get("peer");
    if(!peer){ res.writeHead(400); res.end(); return true; }
    res.writeHead(200, { "Content-Type":"text/event-stream", "Cache-Control":"no-cache", "Connection":"keep-alive" });
    res.write("retry: 2000\n\n");
    const r = sseRoom(name);
    r.set(peer, { presence:{}, res });
    sseBroadcast(name);
    const hb = setInterval(()=>{ try{ res.write(": ping\n\n"); }catch(e){} }, 20000);
    req.on("close", ()=>{ clearInterval(hb); r.delete(peer); sseBroadcast(name); });
    return true;
  }
  // ブラウザ→サーバー（自分の状態を送る）
  if(req.method==="POST" && p==="/presence"){
    const body = await readBody(req);
    try{
      const { room:name, peer, presence } = JSON.parse(body);
      const r = sseRoom(name||"lobby");
      if(r.has(peer)){ r.get(peer).presence = presence||{}; sseBroadcast(name||"lobby"); }
    }catch(e){}
    res.writeHead(204); res.end(); return true;
  }

  return false;
}

module.exports = { handleRealtime };
