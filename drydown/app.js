"use strict";
/* ---------- catalog: name, brand, family, seasons (s u f w), occasions, notes ---------- */
const CAT=[
["Aventus","Creed","Fruity","suf","casual office date","pineapple, birch, musk"],
["Sauvage Eau de Toilette","Dior","Aromatic","suf","casual office date","bergamot, pepper, ambroxan"],
["Bleu de Chanel Eau de Parfum","Chanel","Woody","sufw","office date formal","grapefruit, incense, cedar"],
["Acqua di Gio Profumo","Giorgio Armani","Aquatic","su","casual office date","sea notes, incense, patchouli"],
["Le Beau Paradise Garden","Jean Paul Gaultier","Fresh","su","casual date","coconut, fig, green notes"],
["Le Male Elixir","Jean Paul Gaultier","Amber","fw","date evening","lavender, honey, tonka"],
["Bianco Latte","Giardini Di Toscana","Gourmand","fw","casual date","caramel, vanilla, honey"],
["Hawas Sapphire","Rasasi","Aquatic","su","casual gym","sea notes, lavender, amber"],
["Hawas for Him","Rasasi","Aquatic","su","casual gym","apple, sea notes, ambergris"],
["Supremacy Collector's Edition","Afnan","Fruity","su","casual date","pineapple, apple, musk"],
["9PM","Afnan","Gourmand","fw","date evening","apple, cinnamon, vanilla"],
["Y Eau de Parfum","Yves Saint Laurent","Aromatic","sufw","casual office date","apple, sage, tonka"],
["La Nuit de L'Homme","Yves Saint Laurent","Spicy","fw","date evening","cardamom, lavender, cedar"],
["Eros Eau de Toilette","Versace","Amber","fw","date evening","mint, apple, vanilla"],
["Dylan Blue","Versace","Aromatic","sufw","casual office","bergamot, incense, patchouli"],
["1 Million","Rabanne","Spicy","fw","evening date","cinnamon, leather, amber"],
["Invictus","Rabanne","Aquatic","su","casual gym","grapefruit, sea notes, guaiac"],
["Spicebomb Extreme","Viktor&Rolf","Spicy","fw","date evening","tobacco, vanilla, cinnamon"],
["The Most Wanted Parfum","Azzaro","Gourmand","fw","date evening","toffee, cardamom, vanilla"],
["Light Blue Eau Intense","Dolce&Gabbana","Citrus","su","casual gym","grapefruit, sea water, musk"],
["The One Eau de Parfum","Dolce&Gabbana","Amber","fw","date formal","tobacco, amber, ginger"],
["Terre d'Hermes","Hermes","Woody","sf","office formal","orange, vetiver, flint"],
["Un Jardin sur le Nil","Hermes","Fresh","su","casual office","green mango, lotus, sycamore"],
["Tobacco Vanille","Tom Ford","Gourmand","w","evening date","tobacco, vanilla, cacao"],
["Oud Wood","Tom Ford","Woody","fw","office formal","oud, rosewood, cardamom"],
["Neroli Portofino","Tom Ford","Citrus","su","casual office","neroli, bergamot, amber"],
["Ombre Leather","Tom Ford","Leather","fw","evening date","leather, cardamom, patchouli"],
["Baccarat Rouge 540","Maison Francis Kurkdjian","Amber","fw","date formal evening","saffron, ambergris, cedar"],
["Grand Soir","Maison Francis Kurkdjian","Amber","w","evening formal","amber, vanilla, benzoin"],
["Layton","Parfums de Marly","Spicy","fw","date office","apple, vanilla, cardamom"],
["Delina","Parfums de Marly","Floral","s","date casual","rose, lychee, vanilla"],
["Hacivat","Nishane","Fruity","sf","office casual","pineapple, oakmoss, cedar"],
["Naxos","Xerjoff","Gourmand","fw","evening date","honey, tobacco, lavender"],
["Erba Pura","Xerjoff","Fruity","su","casual date","fruits, musk, vanilla"],
["Reflection Man","Amouage","Floral","sf","office formal","neroli, jasmine, sandalwood"],
["Santal 33","Le Labo","Woody","sfw","casual office","sandalwood, cardamom, leather"],
["Another 13","Le Labo","Musk","sufw","casual office","ambroxan, musk, jasmine"],
["Gypsy Water","Byredo","Woody","sf","casual","juniper, pine, vanilla"],
["Wood Sage & Sea Salt","Jo Malone","Aromatic","su","casual office","sea salt, sage, ambrette"],
["Philosykos","Diptyque","Fresh","su","casual","fig leaf, fig, cedar"],
["Coco Mademoiselle","Chanel","Floral","sf","office date","orange, rose, patchouli"],
["Chance Eau Tendre","Chanel","Floral","su","casual office","grapefruit, jasmine, musk"],
["Black Opium","Yves Saint Laurent","Gourmand","fw","evening date","coffee, vanilla, white flowers"],
["Libre Eau de Parfum","Yves Saint Laurent","Floral","sfw","office date","lavender, orange blossom, vanilla"],
["La Vie Est Belle","Lancome","Gourmand","fw","date casual","iris, praline, vanilla"],
["Good Girl","Carolina Herrera","Amber","fw","evening date","tuberose, tonka, cacao"],
["Flowerbomb","Viktor&Rolf","Floral","fw","date evening","jasmine, rose, patchouli"],
["Cloud","Ariana Grande","Gourmand","sfw","casual date","lavender, coconut, praline"],
["Daisy","Marc Jacobs","Floral","su","casual","strawberry, violet, jasmine"],
["Light Blue","Dolce&Gabbana","Citrus","su","casual gym","lemon, apple, cedar"],
["Club de Nuit Intense Man","Armaf","Fruity","sf","casual office","lemon, birch, musk"],
["Khamrah","Lattafa","Gourmand","fw","evening date","cinnamon, dates, vanilla"],
["Asad","Lattafa","Spicy","fw","evening date","pepper, tobacco, vanilla"],
["Cool Water","Davidoff","Aquatic","su","casual gym","mint, sea water, lavender"],
["CK One","Calvin Klein","Citrus","su","casual gym","lemon, green tea, musk"],
["Encre Noire","Lalique","Woody","fw","office evening","vetiver, cypress, musk"],
["Mojave Ghost","Byredo","Floral","su","casual office","ambrette, magnolia, sandalwood"],
["Jazz Club","Maison Margiela","Leather","fw","evening date","rum, tobacco, vanilla"],
["By the Fireplace","Maison Margiela","Woody","w","casual evening","chestnut, smoke, vanilla"],
["Vanilla 28","Kayali","Gourmand","fw","casual date","vanilla, brown sugar, tonka"]
].map(a=>({name:a[0],brand:a[1],fam:a[2],sea:a[3],occ:a[4].split(" "),notes:a[5]}));
const FAMS=["Fresh","Citrus","Aquatic","Aromatic","Fruity","Floral","Woody","Spicy","Amber","Gourmand","Leather","Musk"];
const FCOL={Fresh:"#6fae7d",Citrus:"#e0b83a",Aquatic:"#4f93c4",Aromatic:"#5a8f8a",Fruity:"#d9795f",Floral:"#d48aa6",Woody:"#8a6a4a",Spicy:"#b5532f",Amber:"#c98a2b",Gourmand:"#a8744f",Leather:"#5b4636",Musk:"#9a98a8"};
const SEAS={s:"Spring",u:"Summer",f:"Fall",w:"Winter"};
const OCCS=["casual","office","date","evening","formal","gym"];
const CONDS=["Sunny","Cloudy","Rain","Snow","Humid"];
const MTEMP=[35,38,48,58,68,78,84,82,74,62,50,40];

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid6=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const dayKey=d=>{d=d||new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const ago=ts=>{const m=Math.floor((Date.now()-ts)/60000);if(m<1)return"now";if(m<60)return m+"m";if(m<1440)return Math.floor(m/60)+"h";return Math.floor(m/1440)+"d"};
function bottle(fam,small){const c=FCOL[fam]||"#999";return '<div class="bot'+(small?" s":"")+'"><svg viewBox="0 0 32 44" width="'+(small?24:30)+'" aria-hidden="true"><rect x="12" y="2" width="8" height="6" rx="1.5" fill="'+c+'" opacity=".55"/><rect x="10" y="8" width="12" height="4" rx="1" fill="'+c+'" opacity=".8"/><rect x="4" y="12" width="24" height="30" rx="5" fill="'+c+'"/><rect x="9" y="22" width="14" height="10" rx="2" fill="#fff" opacity=".8"/></svg></div>'}
let toastT;function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),1800)}

/* ---------- state + storage ---------- */
const blank=()=>({col:[],wears:[],comps:[],combos:[],follows:[],set:{unit:"F",wx:null}});
let S=blank();
const LS="drydown-v1";
try{const r=localStorage.getItem(LS);if(r)S=Object.assign(blank(),JSON.parse(r))}catch(e){}
let db=null,user=null,sample=null,me=null,stateRef=null,cloud=false,ready=false;
let saving=false,dirty=false,saveT;
async function push(){if(!stateRef)return;if(saving){dirty=true;return}saving=true;
  try{await stateRef.set(JSON.parse(JSON.stringify(S)));cloud=true}catch(e){cloud=false}
  saving=false;if(dirty){dirty=false;push()}}
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}clearTimeout(saveT);saveT=setTimeout(push,600)}

/* ---------- domain ---------- */
const owned=()=>S.col.filter(f=>f.status==="own");
const byId=id=>S.col.find(f=>f.id===id);
const wearsOf=id=>S.wears.filter(w=>w.fid===id||(w.layer===id));
const compsOf=id=>S.comps.filter(c=>c.fid===id);
function lastWorn(id){const w=wearsOf(id).sort((a,b)=>b.ts-a.ts)[0];return w?w.ts:0}
function streak(){const days=new Set(S.wears.map(w=>w.day));let n=0,i=days.has(dayKey())?0:1;while(days.has(dayKey(daysAgo(i)))){n++;i++}return n}
function bestStreak(){const ds=[...new Set(S.wears.map(w=>w.day))].sort();let best=0,cur=0,prev=null;for(const d of ds){const t=new Date(d+"T12:00").getTime();cur=(prev&&Math.round((t-prev)/864e5)===1)?cur+1:1;best=Math.max(best,cur);prev=t}return best}
function weather(){const w=S.set.wx,now=new Date();if(w&&w.day===dayKey())return{t:w.t,c:w.c,set:true};const t=MTEMP[now.getMonth()];return{t:t,c:t>=70?"Sunny":"Cloudy",set:false}}
function season(t){const m=new Date().getMonth();if(t>=78)return"u";if(t<45)return"w";if(t>=60)return(m>=8&&m<=10)?"f":"s";return m>=6?"f":"s"}
function tempStr(t){return S.set.unit==="C"?Math.round((t-32)*5/9)+"°C":Math.round(t)+"°F"}
function pick(){const o=owned();if(!o.length)return null;const wx=weather(),se=season(wx.t),night=new Date().getHours()>=18,day=dayKey();
  let best=null;for(const f of o){let s=0,why=[];
    if(f.sea.includes(se)){s+=3;why.push("made for "+SEAS[se].toLowerCase())}
    if(wx.t>=80){if(["Fresh","Citrus","Aquatic"].includes(f.fam)){s+=2;why.push("stays crisp in "+tempStr(wx.t)+" heat")}if(["Gourmand","Amber","Leather"].includes(f.fam))s-=2}
    if(wx.t<45&&["Amber","Gourmand","Spicy","Leather","Woody"].includes(f.fam)){s+=2;why.push("warm enough for "+tempStr(wx.t))}
    if((wx.c==="Rain"||wx.c==="Snow")&&["Woody","Aromatic","Leather"].includes(f.fam)){s+=1;why.push("great in "+wx.c.toLowerCase())}
    if(wx.c==="Humid"&&["Gourmand","Amber"].includes(f.fam))s-=1.5;
    if(night){if(f.occ.includes("evening")||f.occ.includes("date")){s+=1.5;why.push("an evening scent")}}
    else if(f.occ.includes("casual")||f.occ.includes("office")){s+=1.5;why.push("easy daytime wear")}
    if(f.fav)s+=.5;s+=(f.rating||0)*.2;
    const lw=lastWorn(f.id);if(lw&&Date.now()-lw<2*864e5)s-=3;else if(!lw){s+=.4}
    let h=0;for(const ch of day+f.id)h=(h*31+ch.charCodeAt(0))%997;s+=h/5000;
    if(!best||s>best.s)best={f:f,s:s,why:why}}
  best.text=best.why.length?cap(best.why.slice(0,2).join(", ")):"A change of pace for your rotation";return best}
function score(){const o=owned();const seas=new Set(),occs=new Set(),fams=new Set();
  o.forEach(f=>{f.sea.split("").forEach(x=>seas.add(x));f.occ.forEach(x=>occs.add(x));fams.add(f.fam)});
  const a=seas.size*10,b=Math.min(occs.size,6)*5,c=Math.min(fams.size,6)*5,tips=[];
  Object.keys(SEAS).forEach(k=>{if(!seas.has(k))tips.push("Nothing for "+SEAS[k].toLowerCase()+" yet — add a "+({s:"floral or green",u:"citrus or aquatic",f:"woody or spicy",w:"amber or gourmand"}[k])+" scent.")});
  OCCS.forEach(k=>{if(!occs.has(k))tips.push("No "+k+" option in your collection.")});
  if(fams.size<6)tips.push("You own "+fams.size+" scent "+(fams.size===1?"family":"families")+" — six or more maxes out variety.");
  return{total:o.length?a+b+c:0,a:a,b:b,c:c,tips:tips}}
function magnet(){const since=Date.now()-7*864e5,m={};S.comps.filter(c=>c.ts>=since).forEach(c=>m[c.fid]=(m[c.fid]||0)+1);
  const top=Object.entries(m).sort((x,y)=>y[1]-x[1])[0];if(!top)return null;const f=byId(top[0]);return f?{f:f,n:top[1]}:null}
function addFrag(src,status){if(S.col.some(f=>f.name===src.name&&f.brand===src.brand)){toast("Already in your collection");return null}
  const f={id:uid6(),name:src.name,brand:src.brand,fam:src.fam||"Woody",sea:src.sea||"sufw",occ:src.occ||["casual"],notes:src.notes||"",status:status||"own",fav:false,rating:0,review:"",added:Date.now()};
  S.col.push(f);save();return f}
async function logWear(fid,occ,layer,share,note){const f=byId(fid);if(!f)return;
  const w={id:uid6(),fid:fid,day:dayKey(),ts:Date.now(),occ:occ||"casual",layer:layer||"",note:note||""};S.wears.push(w);
  if(layer){const k=[fid,layer].sort().join("+");if(!S.combos.some(c=>c.k===k))S.combos.push({k:k,a:fid,b:layer,ts:Date.now()})}
  save();toast("Wear logged · "+streak()+" day streak");
  if(share&&db&&me){const l=layer?byId(layer):null;try{await db.collection("posts").add({uid:me,name:f.name,brand:f.brand,fam:f.fam,occ:w.occ,note:(note||"").slice(0,200),layer:l?l.name:"",ts:w.ts})}catch(e){toast("Couldn't share to the feed")}}}

/* ---------- social (shared db) ---------- */
let posts=[],likes=[],comments=[],names={},socialErr="",socialTab="feed",feedFilter="all";
function subSocial(){if(!db)return;
  const t=setTimeout(()=>{if(!posts.length&&!socialErr){socialErr="The feed can't be reached yet.";if(tab==="social")render()}},10000);
  const err=()=>{clearTimeout(t);socialErr="The feed isn't available right now.";if(tab==="social")render()};
  db.collection("posts").orderBy("ts","desc").limit(100).onSnapshot(s=>{clearTimeout(t);socialErr="";posts=s.docs.map(d=>Object.assign({id:d.id},d.data()));resolveNames();if(tab==="social"||tab==="home")render()},err);
  db.collection("likes").limit(1000).onSnapshot(s=>{likes=s.docs.map(d=>Object.assign({id:d.id},d.data()));if(tab==="social")render()},()=>{});
  db.collection("comments").orderBy("ts","asc").limit(500).onSnapshot(s=>{comments=s.docs.map(d=>Object.assign({id:d.id},d.data()));if(tab==="social")render();if(sheetKind==="comments")openSheet("comments",sheetArg)},()=>{})}
async function resolveNames(){if(!user||!user.profiles)return;const ids=[...new Set(posts.map(p=>p.uid).concat(comments.map(c=>c.uid)))].filter(i=>i&&!(i in names));if(!ids.length)return;
  try{const ps=await user.profiles(ids);ids.forEach(i=>names[i]=(ps&&ps[i]&&ps[i].name)||"");if(tab==="social")render()}catch(e){}}
const who=u=>u===me?"You":(names[u]||"Someone");
function trending(){const since=Date.now()-7*864e5,m={};posts.filter(p=>p.ts>=since).forEach(p=>{const k=p.name+"|"+p.brand;(m[k]=m[k]||{name:p.name,brand:p.brand,fam:p.fam,n:0}).n++});return Object.values(m).sort((a,b)=>b.n-a.n).slice(0,10)}

/* ---------- views ---------- */
let tab="home",shelfTab="own",shelfQ="";
const TABS=[["home","Home",'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],["social","Social",'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5c2.2.8 3.5 2.800 3.500 5.500"/>'],["ask","Ask",'<path d="M4 5h16v11H9l-5 4z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>'],["shelf","Collection",'<rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/>'],["me","Profile",'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7"/>']];
function renderNav(){$("#nav").innerHTML=TABS.map(t=>'<button data-act="tab" data-id="'+t[0]+'" class="'+(tab===t[0]?"on":"")+'"><svg viewBox="0 0 24 24">'+t[2]+"</svg>"+t[1]+"</button>").join("")}
function fragRow(f,right){return '<button class="item" data-act="detail" data-id="'+f.id+'">'+bottle(f.fam,true)+'<div class="grow"><div class="ttl">'+esc(f.name)+(f.fav?" ♥":"")+'</div><div class="mut">'+esc(f.brand)+" · "+esc(f.fam)+'</div></div>'+(right||"")+"</button>"}
function vHome(){const sc=score(),st=streak(),wx=weather(),p=pick(),mg=magnet(),tr=trending().slice(0,3);
  let h='<div class="top"><div class="brand">Drydown<small>Wear it well.</small></div><button class="btn sm ghost" data-act="add">+ Add</button></div>';
  h+='<div class="stats"><button class="stat" data-act="score"><div class="ring" style="background:conic-gradient(var(--acc) '+sc.total*3.6+'deg,var(--soft) 0)"><span>'+sc.total+'</span></div><div><div class="ttl">Scent Score</div><div class="mut">See breakdown</div></div></button>';
  h+='<button class="stat" data-act="tab" data-id="me"><div class="big">🔥 '+st+'</div><div><div class="ttl">Day streak</div><div class="mut">'+(S.wears.some(w=>w.day===dayKey())?"Logged today":"Log to keep it")+'</div></div></button></div>';
  h+='<div class="card"><p class="lbl">Daily recommendation</p><button class="item" data-act="wx" style="margin-bottom:12px"><div class="big">'+tempStr(wx.t)+'</div><div class="grow"><div class="ttl">'+esc(wx.c)+", "+SEAS[season(wx.t)]+'</div><div class="mut">'+(wx.set?"Tap to change":"Seasonal estimate — tap to set today's weather")+'</div></div><span class="mut">'+new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})+"</span></button>";
  if(p){h+='<p class="lbl" style="color:var(--acc)">Today\'s pick</p><div class="row" style="margin-bottom:12px">'+bottle(p.f.fam)+'<div class="grow"><div class="ttl" style="font-size:17px">'+esc(p.f.name)+'</div><div class="mut">'+esc(p.f.brand)+'</div><div class="mut">'+esc(p.text)+'</div></div></div><button class="btn w" data-act="wearnow" data-id="'+p.f.id+'">✓ Wear this fragrance</button>'}
  else h+='<div class="empty">Add the fragrances you own and you\'ll get a pick here every day.<br><br><button class="btn" data-act="add">Add your first fragrance</button></div>';
  h+="</div>";
  h+='<div class="row" style="margin-bottom:12px"><button class="btn ghost grow" data-act="wear">＋ Log wear</button><button class="btn ghost grow" data-act="comp">💬 Log compliment</button></div>';
  h+='<div class="card"><p class="lbl">Compliment magnet of the week</p>'+(mg?fragRow(mg.f,'<span class="tag">'+mg.n+" this week</span>"):'<div class="mut">Log compliments and your most-noticed scent of the week shows up here.</div>')+"</div>";
  if(tr.length)h+='<div class="card"><p class="lbl">Trending on the feed</p><div class="list">'+tr.map(t=>'<div class="row">'+bottle(t.fam,true)+'<div class="grow"><div class="ttl">'+esc(t.name)+'</div><div class="mut">'+esc(t.brand)+'</div></div><span class="tag">'+t.n+" wears</span></div>").join("")+"</div></div>";
  return h}
function vSocial(){let h='<div class="top"><h1>Social</h1></div><div class="seg"><button data-act="stab" data-id="feed" class="'+(socialTab==="feed"?"on":"")+'">Feed</button><button data-act="stab" data-id="trend" class="'+(socialTab==="trend"?"on":"")+'">Trending</button></div>';
  if(!db)return h+'<div class="card empty">'+(ready?"The shared feed only works in the Claude-hosted version of this app. Everything else works here and saves in this browser.":"Connecting to the feed…")+"</div>";
  if(socialErr)h+='<div class="note">'+esc(socialErr)+"</div>";
  if(socialTab==="trend"){const tr=trending();if(!tr.length)return h+'<div class="card empty">Nothing trending yet. Wears shared in the last 7 days are ranked here.</div>';
    return h+'<div class="card"><div class="list">'+tr.map((t,i)=>{const have=S.col.some(f=>f.name===t.name&&f.brand===t.brand);return '<div class="row"><b style="width:18px">'+(i+1)+"</b>"+bottle(t.fam,true)+'<div class="grow"><div class="ttl">'+esc(t.name)+'</div><div class="mut">'+esc(t.brand)+" · "+t.n+' wears</div></div>'+(have?'<span class="tag">Yours</span>':'<button class="btn sm ghost" data-act="wishpost" data-name="'+esc(t.name)+'" data-brand="'+esc(t.brand)+'" data-fam="'+esc(t.fam)+'">+ Wishlist</button>')+"</div>"}).join("")+"</div></div>"}
  h+='<div class="chips" style="margin-bottom:12px"><button class="chip '+(feedFilter==="all"?"on":"")+'" data-act="ffilter" data-id="all">Everyone</button><button class="chip '+(feedFilter==="fol"?"on":"")+'" data-act="ffilter" data-id="fol">Following</button></div>';
  let ps=posts;if(feedFilter==="fol")ps=ps.filter(p=>p.uid===me||S.follows.includes(p.uid));
  if(!ps.length)return h+'<div class="card empty">'+(feedFilter==="fol"?"No posts from people you follow yet.":"No posts yet. Log a wear with “Share to feed” on to start it off. Others appear here once you share this page with them.")+"</div>";
  let last="";ps.forEach(p=>{const d=new Date(p.ts).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});if(d!==last){h+='<p class="lbl" style="margin-top:14px">'+d+"</p>";last=d}
    const lk=likes.filter(l=>l.post===p.id),mine=lk.some(l=>l.uid===me),cm=comments.filter(c=>c.post===p.id).length,fol=S.follows.includes(p.uid);
    h+='<div class="card"><div class="row" style="margin-bottom:10px"><div class="grow"><b>'+esc(who(p.uid))+'</b> <span class="mut">· '+ago(p.ts)+'</span></div>'+(p.uid===me?'<button class="btn sm bad" data-act="delpost" data-id="'+esc(p.id)+'">Delete</button>':'<button class="btn sm ghost" data-act="follow" data-id="'+esc(p.uid)+'">'+(fol?"Following":"Follow")+"</button>")+'</div><div class="row">'+bottle(p.fam)+'<div class="grow"><div class="ttl">'+esc(p.name)+'</div><div class="mut">'+esc(p.brand)+(p.layer?" · layered with "+esc(p.layer):"")+'</div><span class="tag">'+esc(cap(p.occ||"casual"))+"</span></div></div>"+(p.note?'<div style="margin-top:8px">'+esc(p.note)+"</div>":"")+'<div style="margin-top:10px"><button class="act '+(mine?"on":"")+'" data-act="like" data-id="'+esc(p.id)+'">♥ '+lk.length+'</button><button class="act" data-act="comments" data-id="'+esc(p.id)+'">💬 '+cm+"</button></div></div>"});
  return h}
let chat=[],chatBusy=false,chatAbort=null;
function vAsk(){let h='<div class="top"><div><h1>Ask Vetiver</h1><div class="mut">Your fragrance assistant, powered by Claude</div></div>'+(chat.length?'<button class="btn sm ghost" data-act="chatclear">Clear</button>':"")+"</div>";
  if(ready&&!sample)h+='<div class="note">The assistant only works in the Claude-hosted version of this app.</div>';
  if(!chat.length)h+='<div class="card"><p class="lbl">Try asking</p><div class="chips">'+["What should I wear tonight?","What's missing from my collection?","Suggest a layering combo from what I own","Recommend a fresh summer scent under $100"].map(q=>'<button class="chip" data-act="chatq" data-q="'+esc(q)+'">'+esc(q)+"</button>").join("")+"</div></div>";
  h+='<div class="msgs" id="msgs">'+chat.map(m=>'<div class="msg '+(m.role==="user"?"u":"a")+'">'+esc(m.content||"…")+"</div>").join("")+"</div>";
  h+='<form class="send" id="chatForm"><input type="text" id="chatIn" placeholder="Ask about fragrances…" autocomplete="off" aria-label="Message"><button class="btn" '+(chatBusy?"disabled":"")+">Send</button></form>";return h}
function chatContext(){const wx=weather(),o=owned();
  return "You are Vetiver, a witty, knowledgeable fragrance expert inside a fragrance-tracking app. Give concise, practical, friendly answers (under 150 words unless asked for more). Plain text only, no markdown. Prefer recommending from the user's own collection when it fits; suggest new fragrances when asked or when there is a gap.\n\nUser's collection ("+o.length+"): "+(o.map(f=>f.name+" by "+f.brand+" ["+f.fam+"; seasons "+f.sea.split("").map(x=>SEAS[x]).join("/")+"; "+f.occ.join("/")+"; worn "+wearsOf(f.id).length+"x; "+compsOf(f.id).length+" compliments"+(f.rating?"; rated "+f.rating+"/5":"")+"]").join("; ")||"empty")+"\nWishlist: "+(S.col.filter(f=>f.status==="wish").map(f=>f.name).join(", ")||"none")+"\nToday: "+new Date().toDateString()+", "+tempStr(wx.t)+" "+wx.c+", local hour "+new Date().getHours()+".\n\n"}
async function sendChat(q){q=(q||"").trim();if(!q||chatBusy)return;if(!sample){toast("Assistant isn't available here");return}
  chat.push({role:"user",content:q});const a={role:"assistant",content:""};chat.push(a);chatBusy=true;render();window.scrollTo(0,document.body.scrollHeight);
  const hist=chat.slice(0,-1).slice(-12);while(hist.length&&hist[0].role!=="user")hist.shift();
  const msgs=hist.map((m,i)=>({role:m.role,content:(i===0?chatContext():"")+m.content}));
  chatAbort=new AbortController();
  try{const r=await sample(msgs,{cache:false,signal:chatAbort.signal,onText:o=>{a.content=o.text;const b=document.querySelector("#msgs .msg:last-child");if(b&&tab==="ask")b.textContent=o.text}});a.content=(r&&r.text)||a.content||"(no answer)"}
  catch(e){a.content=(e&&e.text)||(e&&e.code==="rate_limited"?"I'm getting a lot of questions — try again in a minute.":e&&e.code==="not_granted"?"The assistant needs permission to ask Claude before it can answer.":"Sorry, I couldn't answer that just now.")}
  chatBusy=false;if(tab==="ask")render()}
function vShelf(){const own=owned(),wish=S.col.filter(f=>f.status==="wish");
  let h='<div class="top"><h1>Collection</h1><button class="btn sm" data-act="add">+ Add</button></div><div class="seg"><button data-act="shtab" data-id="own" class="'+(shelfTab==="own"?"on":"")+'">Owned ('+own.length+')</button><button data-act="shtab" data-id="wish" class="'+(shelfTab==="wish"?"on":"")+'">Wishlist ('+wish.length+')</button><button data-act="shtab" data-id="fav" class="'+(shelfTab==="fav"?"on":"")+'">Favorites</button></div>';
  h+='<input type="text" id="shelfQ" placeholder="Search your collection" value="'+esc(shelfQ)+'" aria-label="Search your collection">';
  let l=shelfTab==="own"?own:shelfTab==="wish"?wish:S.col.filter(f=>f.fav);const q=shelfQ.toLowerCase();if(q)l=l.filter(f=>(f.name+" "+f.brand+" "+f.fam+" "+f.notes).toLowerCase().includes(q));
  l=l.slice().sort((a,b)=>a.name.localeCompare(b.name));
  if(!l.length)return h+'<div class="card empty">'+(q?"No matches.":shelfTab==="fav"?"Tap ♥ on a fragrance to favorite it.":"Nothing here yet.")+"</div>";
  return h+'<div class="card"><div class="list">'+l.map(f=>{const n=wearsOf(f.id).length;return fragRow(f,'<span class="mut">'+(f.status==="own"?n+"×":"")+(f.rating?" ★"+f.rating:"")+"</span>")}).join("")+"</div></div>"}
function vMe(){const o=owned(),tot=S.wears.length,days=new Set(S.wears.map(w=>w.day));
  let h='<div class="top"><h1>Profile</h1></div><div class="stats">'+[["Fragrances",o.length],["Wears logged",tot],["Compliments",S.comps.length],["Best streak",bestStreak()+" d"]].map(x=>'<div class="stat"><div><div class="big">'+x[1]+'</div><div class="mut">'+x[0]+"</div></div></div>").join("")+"</div>";
  h+='<div class="card"><p class="lbl">Last 30 days · current streak '+streak()+'</p><div class="cal">';for(let i=29;i>=0;i--)h+='<i class="'+(days.has(dayKey(daysAgo(i)))?"on":"")+'"></i>';h+="</div></div>";
  const top=o.map(f=>({f:f,n:wearsOf(f.id).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,5);
  h+='<div class="card"><p class="lbl">Most worn</p>'+(top.length?top.map(x=>'<div style="margin-bottom:10px"><div class="row"><div class="grow ttl">'+esc(x.f.name)+'</div><span class="mut">'+x.n+'×</span></div><div class="bar"><i style="width:'+Math.round(x.n/top[0].n*100)+'%"></i></div></div>').join(""):'<div class="mut">Log a wear to see your patterns.</div>')+"</div>";
  const gap=o.filter(f=>Date.now()-(lastWorn(f.id)||f.added)>30*864e5);
  if(gap.length)h+='<div class="card"><p class="lbl">Gathering dust · not worn in 30 days</p><div class="list">'+gap.slice(0,6).map(f=>fragRow(f)).join("")+"</div></div>";
  const fm={};o.forEach(f=>fm[f.fam]=(fm[f.fam]||0)+1);
  if(o.length)h+='<div class="card"><p class="lbl">Scent families</p>'+Object.entries(fm).sort((a,b)=>b[1]-a[1]).map(x=>'<span class="tag" style="margin-bottom:6px">'+esc(x[0])+" · "+x[1]+"</span>").join("")+"</div>";
  if(S.combos.length)h+='<div class="card"><p class="lbl">Layering combos</p><div class="list">'+S.combos.map(c=>{const a=byId(c.a),b=byId(c.b);return a&&b?'<div class="row"><div class="grow">'+esc(a.name)+" + "+esc(b.name)+'</div><button class="btn sm bad" data-act="delcombo" data-id="'+esc(c.k)+'">Remove</button></div>':""}).join("")+"</div></div>";
  const hist=S.wears.slice().sort((a,b)=>b.ts-a.ts).slice(0,15);
  h+='<div class="card"><p class="lbl">Wear history</p>'+(hist.length?'<div class="list">'+hist.map(w=>{const f=byId(w.fid),l=w.layer&&byId(w.layer);return '<div class="row"><div class="grow"><div class="ttl">'+esc(f?f.name:"Removed fragrance")+(l?" + "+esc(l.name):"")+'</div><div class="mut">'+new Date(w.ts).toLocaleDateString(undefined,{month:"short",day:"numeric"})+" · "+esc(cap(w.occ))+'</div></div><button class="btn sm bad" data-act="delwear" data-id="'+w.id+'">Undo</button></div>'}).join("")+"</div>":'<div class="mut">No wears yet.</div>')+"</div>";
  h+='<div class="card"><p class="lbl">Settings</p><div class="row" style="margin-bottom:12px"><div class="grow">Temperature unit</div><div class="chips"><button class="chip '+(S.set.unit==="F"?"on":"")+'" data-act="unit" data-id="F">°F</button><button class="chip '+(S.set.unit==="C"?"on":"")+'" data-act="unit" data-id="C">°C</button></div></div><div class="mut" style="margin-bottom:12px">'+(cloud?"✓ Saved to your Claude account — available on any device.":"Saved in this browser only"+(ready?" (account sync unavailable in this view).":"…"))+'</div><button class="btn bad sm" data-act="reset">Erase all my data</button></div>';
  return h}
function render(){const keep=document.activeElement&&document.activeElement.id;const v={home:vHome,social:vSocial,ask:vAsk,shelf:vShelf,me:vMe}[tab]||vHome;$("#app").innerHTML=v();renderNav();
  if(keep==="shelfQ"){const e=$("#shelfQ");if(e){e.focus();e.setSelectionRange(e.value.length,e.value.length)}}}

/* ---------- sheets ---------- */
let sheetKind="",sheetArg=null,addStatus="own",addQ="";
function head(t){return '<div class="sh"><h2>'+esc(t)+'</h2><button class="x" data-act="close" aria-label="Close">×</button></div>'}
function chipGroup(name,opts,sel,multi,labels){return '<div class="chips" data-group="'+name+'"'+(multi?" data-multi":"")+">"+opts.map((o,i)=>'<button type="button" class="chip '+((multi?sel.includes(o):sel===o)?"on":"")+'" data-chip="'+esc(o)+'">'+esc(labels?labels[i]:cap(o))+"</button>").join("")+"</div>"}
const groupVal=n=>{const g=document.querySelector('#sheetIn [data-group="'+n+'"]');if(!g)return null;const v=[...g.querySelectorAll(".chip.on")].map(b=>b.dataset.chip);return g.hasAttribute("data-multi")?v:v[0]||""};
function fragSelect(id,sel,none){const o=owned();return '<select id="'+id+'">'+(none?'<option value="">'+none+"</option>":"")+o.map(f=>'<option value="'+f.id+'"'+(f.id===sel?" selected":"")+">"+esc(f.name)+" — "+esc(f.brand)+"</option>").join("")+"</select>"}
function addResults(){const q=addQ.toLowerCase();const r=CAT.filter(c=>!S.col.some(f=>f.name===c.name&&f.brand===c.brand)&&(!q||(c.name+" "+c.brand+" "+c.fam+" "+c.notes).toLowerCase().includes(q))).slice(0,q?30:12);
  return (r.length?'<div class="card"><div class="list">'+r.map(c=>'<button class="item" data-act="addcat" data-i="'+CAT.indexOf(c)+'">'+bottle(c.fam,true)+'<div class="grow"><div class="ttl">'+esc(c.name)+'</div><div class="mut">'+esc(c.brand)+" · "+esc(c.fam)+'</div></div><span class="tag">+ Add</span></button>').join("")+"</div></div>":'<div class="card empty">Not in the built-in list.</div>')+'<button class="btn ghost w" data-act="custom">Can\'t find it? Add it yourself</button>'}
const SHEETS={
 add(){return head("Add a fragrance")+'<div class="seg"><button data-act="addstatus" data-id="own" class="'+(addStatus==="own"?"on":"")+'">I own it</button><button data-act="addstatus" data-id="wish" class="'+(addStatus==="wish"?"on":"")+'">Wishlist</button></div><input type="text" id="addQ" placeholder="Search name, brand or note" value="'+esc(addQ)+'" aria-label="Search fragrances"><div id="addRes">'+addResults()+"</div>"},
 custom(){return head("Add your own")+'<label class="f" for="cName">Name</label><input type="text" id="cName" value="'+esc(addQ)+'"><label class="f" for="cBrand">Brand</label><input type="text" id="cBrand"><label class="f" for="cNotes">Notes (optional)</label><input type="text" id="cNotes" placeholder="e.g. bergamot, cedar, vanilla"><div class="fg"><label class="f">Scent family</label>'+chipGroup("fam",FAMS,"Woody")+'</div><div class="fg"><label class="f">Seasons</label>'+chipGroup("sea",["s","u","f","w"],["s","u","f","w"],true,["Spring","Summer","Fall","Winter"])+'</div><div class="fg"><label class="f">Occasions</label>'+chipGroup("occ",OCCS,["casual"],true)+'</div><button class="btn w" data-act="savecustom">Add to '+(addStatus==="own"?"collection":"wishlist")+"</button>"},
 wear(fid){if(!owned().length)return head("Log a wear")+'<div class="card empty">Add a fragrance you own first.<br><br><button class="btn" data-act="add">Add a fragrance</button></div>';
  return head("Log a wear")+'<label class="f" for="wFid">What are you wearing?</label>'+fragSelect("wFid",fid)+'<div class="fg"><label class="f">Occasion</label>'+chipGroup("wocc",OCCS,new Date().getHours()>=18?"evening":"casual")+'</div><label class="f" for="wLayer">Layered with (optional)</label>'+fragSelect("wLayer","","Nothing — worn on its own")+'<label class="f" for="wNote">Note (optional)</label><input type="text" id="wNote" maxlength="200" placeholder="How\'s it wearing today?">'+(db&&me?'<label class="row" style="margin-bottom:14px;min-height:44px"><input type="checkbox" id="wShare" checked style="width:20px;height:20px"> Share to the social feed</label>':"")+'<button class="btn w" data-act="savewear">Log wear</button>'},
 comp(fid){if(!owned().length)return head("Log a compliment")+'<div class="card empty">Add a fragrance you own first.<br><br><button class="btn" data-act="add">Add a fragrance</button></div>';
  return head("Log a compliment")+'<label class="f" for="cFid">Which fragrance got noticed?</label>'+fragSelect("cFid",fid||(S.wears.length?S.wears[S.wears.length-1].fid:""))+'<label class="f" for="cFrom">Who from? (optional)</label><input type="text" id="cFrom" placeholder="Coworker, date, stranger…"><label class="f" for="cNote">What they said (optional)</label><input type="text" id="cNote"><button class="btn w" data-act="savecomp">Save compliment</button>'},
 wx(){const w=weather();return head("Today's weather")+'<div class="note">This page can\'t read your location or a live forecast, so set the conditions yourself — the daily pick updates right away.</div><label class="f" for="wxT">Temperature: <b id="wxV">'+tempStr(w.t)+'</b></label><input type="range" id="wxT" min="0" max="110" value="'+w.t+'" style="width:100%;height:44px"><div class="fg"><label class="f">Conditions</label>'+chipGroup("cond",CONDS,w.c)+'</div><button class="btn w" data-act="savewx">Update pick</button>'},
 score(){const s=score();const row=(t,v,m)=>'<div style="margin-bottom:12px"><div class="row"><div class="grow ttl">'+t+'</div><span class="mut">'+v+" / "+m+'</span></div><div class="bar"><i style="width:'+v/m*100+'%"></i></div></div>';
  return head("Scent Score · "+s.total)+'<div class="card">'+row("Seasonal coverage",s.a,40)+row("Versatility (occasions)",s.b,30)+row("Variety (scent families)",s.c,30)+'</div><div class="card"><p class="lbl">How to raise it</p>'+(s.tips.length?"<div class='list'>"+s.tips.slice(0,6).map(t=>"<div>"+esc(t)+"</div>").join("")+"</div>":"<div>Your collection covers every season, occasion and plenty of families. 100 is yours.</div>")+"</div>"},
 detail(id){const f=byId(id);if(!f)return head("Not found");const w=wearsOf(id),c=compsOf(id),lw=lastWorn(id);
  return head(f.name)+'<div class="row" style="margin-bottom:12px">'+bottle(f.fam)+'<div class="grow"><div class="ttl">'+esc(f.brand)+'</div><div class="mut">'+esc(f.notes||"No notes listed")+'</div></div><button class="x" data-act="fav" data-id="'+id+'" aria-label="Favorite" style="color:'+(f.fav?"var(--bad)":"var(--mut)")+'">♥</button></div><div style="margin-bottom:12px"><span class="tag">'+esc(f.fam)+"</span>"+f.sea.split("").map(x=>'<span class="tag">'+SEAS[x]+"</span>").join("")+f.occ.map(x=>'<span class="tag">'+esc(cap(x))+"</span>").join("")+'</div><div class="stats"><div class="stat"><div><div class="big">'+w.length+'</div><div class="mut">Wears'+(lw?" · last "+ago(lw):"")+'</div></div></div><div class="stat"><div><div class="big">'+c.length+'</div><div class="mut">Compliments</div></div></div></div>'
  +(f.status==="own"?'<div class="row" style="margin-bottom:12px"><button class="btn grow" data-act="wear" data-id="'+id+'">Wear today</button><button class="btn ghost grow" data-act="comp" data-id="'+id+'">Compliment</button></div>':'<button class="btn w" style="margin-bottom:12px" data-act="toown" data-id="'+id+'">I bought it — move to owned</button>')
  +'<div class="card"><p class="lbl">Your rating</p><div class="stars">'+[1,2,3,4,5].map(n=>'<button data-act="rate" data-id="'+id+'" data-n="'+n+'" class="'+(n<=f.rating?"on":"")+'" aria-label="'+n+' stars">★</button>').join("")+'</div><label class="f" for="rev" style="margin-top:8px">Your review</label><textarea id="rev" data-id="'+id+'" placeholder="Longevity, projection, when it works…">'+esc(f.review)+"</textarea></div>"
  +(c.length?'<div class="card"><p class="lbl">Compliments</p><div class="list">'+c.slice().reverse().slice(0,8).map(x=>"<div><b>"+esc(x.from||"Someone")+'</b> <span class="mut">· '+ago(x.ts)+"</span>"+(x.note?"<div>"+esc(x.note)+"</div>":"")+"</div>").join("")+"</div></div>":"")
  +'<button class="btn bad w" data-act="remove" data-id="'+id+'">Remove from '+(f.status==="own"?"collection":"wishlist")+"</button>"},
 comments(pid){const p=posts.find(x=>x.id===pid),cs=comments.filter(c=>c.post===pid);
  return head("Comments")+(p?'<div class="mut" style="margin-bottom:12px">'+esc(who(p.uid))+" wore "+esc(p.name)+"</div>":"")+(cs.length?'<div class="card"><div class="list">'+cs.map(c=>'<div class="row"><div class="grow"><b>'+esc(who(c.uid))+'</b> <span class="mut">· '+ago(c.ts)+"</span><div>"+esc(c.text)+"</div></div>"+(c.uid===me?'<button class="btn sm bad" data-act="delcomment" data-id="'+esc(c.id)+'">Delete</button>':"")+"</div>").join("")+"</div></div>":'<div class="card empty">No comments yet.</div>')+'<form id="cmForm" class="row"><input type="text" id="cmIn" maxlength="300" placeholder="Add a comment" style="margin:0" aria-label="Comment"><button class="btn">Post</button></form>'},
 confirm(a){return head(a.title)+'<p style="margin:0 0 16px">'+esc(a.text)+'</p><div class="row"><button class="btn ghost grow" data-act="close">Cancel</button><button class="btn grow" style="background:var(--bad);color:#fff" data-act="'+a.act+'" data-id="'+esc(a.id||"")+'">'+esc(a.yes)+"</button></div>"}
};
function openSheet(k,arg){sheetKind=k;sheetArg=arg;$("#sheetIn").innerHTML=SHEETS[k](arg);$("#sheet").classList.add("on")}
function closeSheet(){sheetKind="";$("#sheet").classList.remove("on")}

/* ---------- events ---------- */
const ACT={
 tab(d){tab=d.id;try{history.replaceState(null,"","#"+tab)}catch(e){}render();window.scrollTo(0,0)},
 close(){closeSheet()},
 add(){addQ="";openSheet("add")}, custom(){openSheet("custom")},
 addstatus(d){addStatus=d.id;openSheet("add")},
 addcat(d){const f=addFrag(CAT[+d.i],addStatus);if(f){toast("Added "+f.name);$("#addRes").innerHTML=addResults();render()}},
 savecustom(){const n=$("#cName").value.trim(),b=$("#cBrand").value.trim();if(!n){toast("Give it a name");return}
  const sea=groupVal("sea").join("")||"sufw",occ=groupVal("occ");const f=addFrag({name:n,brand:b||"Unknown",fam:groupVal("fam")||"Woody",sea:sea,occ:occ.length?occ:["casual"],notes:$("#cNotes").value.trim()},addStatus);if(f){toast("Added "+f.name);closeSheet();render()}},
 wear(d){openSheet("wear",d.id||"")}, comp(d){openSheet("comp",d.id||"")}, wx(){openSheet("wx")}, score(){openSheet("score")}, detail(d){openSheet("detail",d.id)},
 async wearnow(d){await logWear(d.id,new Date().getHours()>=18?"evening":"casual","",!!(db&&me),"");render()},
 async savewear(){const fid=$("#wFid").value;let l=$("#wLayer").value;if(l===fid)l="";const sh=$("#wShare");closeSheet();await logWear(fid,groupVal("wocc"),l,sh?sh.checked:false,$("#wNote")?$("#wNote").value.trim():"");render()},
 savecomp(){const fid=$("#cFid").value;if(!fid)return;S.comps.push({id:uid6(),fid:fid,ts:Date.now(),from:$("#cFrom").value.trim(),note:$("#cNote").value.trim()});save();closeSheet();toast("Compliment logged");render()},
 savewx(){S.set.wx={t:+$("#wxT").value,c:groupVal("cond")||"Sunny",day:dayKey()};save();closeSheet();render()},
 fav(d){const f=byId(d.id);f.fav=!f.fav;save();openSheet("detail",d.id);render()},
 rate(d){const f=byId(d.id);f.rating=f.rating===+d.n?0:+d.n;save();openSheet("detail",d.id);render()},
 toown(d){byId(d.id).status="own";save();openSheet("detail",d.id);render();toast("Moved to owned")},
 remove(d){const f=byId(d.id);openSheet("confirm",{title:"Remove "+f.name+"?",text:"Its wears and compliments stay in your history.",yes:"Remove",act:"remove2",id:d.id})},
 remove2(d){S.col=S.col.filter(f=>f.id!==d.id);S.combos=S.combos.filter(c=>c.a!==d.id&&c.b!==d.id);save();closeSheet();render()},
 delwear(d){S.wears=S.wears.filter(w=>w.id!==d.id);save();render()},
 delcombo(d){S.combos=S.combos.filter(c=>c.k!==d.id);save();render()},
 unit(d){S.set.unit=d.id;save();render()},
 reset(){openSheet("confirm",{title:"Erase everything?",text:"This deletes your collection, wears, compliments and settings. Your feed posts stay until you delete them.",yes:"Erase",act:"reset2"})},
 reset2(){S=blank();save();closeSheet();render();toast("Data erased")},
 shtab(d){shelfTab=d.id;render()}, stab(d){socialTab=d.id;render()}, ffilter(d){feedFilter=d.id;render()},
 follow(d){S.follows=S.follows.includes(d.id)?S.follows.filter(x=>x!==d.id):S.follows.concat(d.id);save();render()},
 async like(d){if(!db||!me)return;const ref=db.doc("likes/"+d.id+"_"+me);try{if(likes.some(l=>l.post===d.id&&l.uid===me))await ref.delete();else await ref.set({post:d.id,uid:me,ts:Date.now()})}catch(e){toast("Couldn't update like")}},
 comments(d){openSheet("comments",d.id)},
 delpost(d){openSheet("confirm",{title:"Delete this post?",text:"It disappears from everyone's feed.",yes:"Delete",act:"delpost2",id:d.id})},
 async delpost2(d){closeSheet();try{await db.doc("posts/"+d.id).delete()}catch(e){toast("Couldn't delete")}},
 async delcomment(d){try{await db.doc("comments/"+d.id).delete()}catch(e){toast("Couldn't delete")}},
 wishpost(d){const c=CAT.find(x=>x.name===d.name&&x.brand===d.brand)||{name:d.name,brand:d.brand,fam:FAMS.includes(d.fam)?d.fam:"Woody"};if(addFrag(c,"wish")){toast("Added to wishlist");render()}},
 chatq(d){sendChat(d.q)}, chatclear(){if(chatAbort)chatAbort.abort();chat=[];chatBusy=false;render()}
};
document.addEventListener("click",e=>{
  if(e.target.id==="sheet"){closeSheet();return}
  const chip=e.target.closest("[data-chip]");if(chip){const g=chip.parentElement;if(g.hasAttribute("data-multi"))chip.classList.toggle("on");else g.querySelectorAll(".chip").forEach(c=>c.classList.toggle("on",c===chip));return}
  const b=e.target.closest("[data-act]");if(b&&ACT[b.dataset.act]){e.preventDefault();ACT[b.dataset.act](b.dataset)}});
document.addEventListener("input",e=>{const t=e.target;
  if(t.id==="addQ"){addQ=t.value;$("#addRes").innerHTML=addResults()}
  else if(t.id==="shelfQ"){shelfQ=t.value;render()}
  else if(t.id==="wxT"){$("#wxV").textContent=tempStr(+t.value)}
  else if(t.id==="rev"){const f=byId(t.dataset.id);if(f){f.review=t.value;save()}}});
document.addEventListener("submit",async e=>{e.preventDefault();
  if(e.target.id==="chatForm"){const i=$("#chatIn"),q=i.value;i.value="";sendChat(q)}
  else if(e.target.id==="cmForm"){const i=$("#cmIn"),t=i.value.trim();if(!t||!db||!me)return;i.value="";try{await db.collection("comments").add({post:sheetArg,uid:me,text:t.slice(0,300),ts:Date.now()})}catch(x){toast("Couldn't post comment")}}});
function route(){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h)&&h!==tab){tab=h;render()}}
window.addEventListener("hashchange",route);

/* ---------- boot ---------- */
(function(){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h))tab=h})();
render();
(async function boot(){
  const use=n=>{try{return window.claude&&window.claude.use?window.claude.use(n):Promise.resolve(null)}catch(e){return Promise.resolve(null)}};
  try{[db,user,sample]=await Promise.all([use("db"),use("user"),use("sample")])}catch(e){}
  try{if(user&&user.id)me=await user.id()}catch(e){}
  if(db&&me){try{stateRef=db.doc("data/users/"+me+"/state");const snap=await stateRef.get();
      if(snap.exists){const local=S,remote=Object.assign(blank(),JSON.parse(JSON.stringify(snap.data())));remote.set=Object.assign(blank().set,remote.set||{});S=remote;cloud=true;try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
        if(!remote.col.length&&local.col.length){S=local;push()}}
      else if(S.col.length||S.wears.length)push();else cloud=true}catch(e){stateRef=null}}
  ready=true;if(db)subSocial();render()})();
