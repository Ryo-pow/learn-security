/* ============ 画面遷移 ============ */
const SCREENS=["scHome","scGlossary","scJoin","scMission","scResult","scCardLobby","scCardPlay"];
function show(sc){ hideToast();SCREENS.forEach(x=>$(x).hidden=(x!==sc)); $("hud").hidden=(sc!=="scMission"); $("homeBtn").hidden=(sc==="scHome"); window.scrollTo({top:0,behavior:"smooth"}); }
function goHome(){ if(CR){ try{CR.leave();}catch(e){} CR=null; } show("scHome"); }
$("homeBtn").onclick=goHome;
document.querySelectorAll("[data-home]").forEach(b=>b.onclick=goHome);
$("toGloss").onclick=()=>show("scGlossary");
$("toQuest").onclick=()=>show("scJoin");
$("toCard").onclick=()=>show("scCardLobby");
