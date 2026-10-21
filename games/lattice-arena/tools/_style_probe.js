
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=process.argv[2];
function stub(){return{style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},getContext:()=>new Proxy({},{get:()=>()=>{}}),
 toDataURL:()=>"",appendChild(){},addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({width:900,height:600,left:0,top:0}),querySelector:()=>null,querySelectorAll:()=>[],setAttribute(){},focus(){}};}
const document={createElement:()=>stub(),getElementById:()=>stub(),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},body:stub(),documentElement:stub()};
const win={devicePixelRatio:1,document,requestAnimationFrame:()=>0,cancelAnimationFrame(){},Image:function(){},fetch:()=>Promise.resolve({json:()=>Promise.resolve({})}),setTimeout,clearTimeout,console};
win.window=win;const ctx=vm.createContext(win);
const load=(f)=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),"utf8"),ctx,{filename:f});
load("roster.js"); load("formation.js"); load("brain.js");
const R=win.LYGO_ARENA, B=win.LYGO_BRAIN;
const styles = (B && B.STYLES) || {};
console.log("styles defined in STYLES:", Object.keys(styles).sort().join(", "));
const list = R.ROSTER || [];
const missing=[], tok=[];
list.forEach(b=>{
  const s = b.style;
  const has = s && styles[s];
  if (b.cls === "token") { tok.push(b.id+"("+b.name+")"); }
  else if (!has) missing.push(b.id+" ["+(b.cls||"?")+"] style="+JSON.stringify(s));
});
console.log("\nroster size:", list.length);
console.log("TOKEN/utility kits (a ward is not a fighter):", tok.length, tok.join(", "));
console.log("\nREAL kits with NO usable style (" + missing.length + "):");
missing.forEach(m=>console.log("   " + m));
console.log("\nper-cls style coverage:");
const bycls={};
list.forEach(b=>{ if(b.cls==="token") return; const k=b.cls||"?"; bycls[k]=bycls[k]||{n:0,styled:0,styles:{}};
  bycls[k].n++; if(b.style&&styles[b.style]) bycls[k].styled++; bycls[k].styles[b.style||"NONE"]=(bycls[k].styles[b.style||"NONE"]||0)+1; });
Object.keys(bycls).sort().forEach(k=>console.log("   "+k.padEnd(11)+bycls[k].styled+"/"+bycls[k].n+"  "+JSON.stringify(bycls[k].styles)));
