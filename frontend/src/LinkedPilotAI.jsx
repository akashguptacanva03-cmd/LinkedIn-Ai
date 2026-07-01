import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, FileText, Settings, Bell, Sparkles,
  CheckCircle, Clock, Send, TrendingUp, Users, Eye,
  ThumbsUp, MessageSquare, Share2, ChevronRight, Linkedin, Zap,
  BarChart2, Edit3, Trash2, X, Check, AlertCircle, LogOut,
  ChevronDown, RefreshCw, Copy, Save, ToggleLeft, ToggleRight,
  BookOpen, Bot, Lightbulb, Wand2, Target, Cpu, Plus,
  SendHorizonal, Play, Pause, PenLine, Hash, AtSign,
  Smile, Layers, Flame, BarChart, XCircle, RotateCcw,
  CheckSquare, AlertTriangle, ChevronUp, Upload, Calendar
} from "lucide-react";

// ── THEME ─────────────────────────────────────────────────────────────────────
const C = {
  blue:"#0A66C2", blueDk:"#004182", blueLt:"#EAF0FA", blueMd:"#378FE9",
  white:"#FFFFFF", bg:"#F3F2EE", text:"#191919", sub:"#666666",
  muted:"#999999", border:"#E0DFDC", card:"#FFFFFF",
  green:"#057642", greenLt:"#E8F5EF",
  orange:"#C37D16", orangeLt:"#FFF3E0",
  red:"#CC1016", redLt:"#FDECEA",
  purple:"#7B2D8B", purpleLt:"#F3E8F6",
  teal:"#0A7C6E", tealLt:"#E6F4F2",
};

const TONES = ["Professional","Casual","Inspirational","Educational","Storytelling","Bold","Thought Leader"];
const AI_PROVIDERS = [
  {id:"claude", label:"Claude (Anthropic)", logo:"🟣"},
  {id:"openai", label:"GPT-4o (OpenAI)",   logo:"🟢"},
  {id:"gemini", label:"Gemini (Google)",    logo:"🔵"},
];

// ── API CLIENT ────────────────────────────────────────────────────────────────
const API = "https://linkedin-ai-production-b75d.up.railway.app/api";

async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
}

async function apiUpload(path, formData, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: "POST", headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
  return data;
}

// ── UNICODE TEXT STYLES ───────────────────────────────────────────────────────
const toBold = s => s.replace(/[A-Za-z0-9]/g, c => {
  const n = c.charCodeAt(0);
  if(n>=65&&n<=90) return String.fromCodePoint(0x1D400+n-65);
  if(n>=97&&n<=122) return String.fromCodePoint(0x1D41A+n-97);
  if(n>=48&&n<=57) return String.fromCodePoint(0x1D7CE+n-48);
  return c;
});
const toItalic = s => s.replace(/[A-Za-z]/g, c => {
  const n = c.charCodeAt(0);
  if(n>=65&&n<=90) return String.fromCodePoint(0x1D434+n-65);
  if(n>=97&&n<=122) return c==='h' ? '\u210E' : String.fromCodePoint(0x1D44E+n-97);
  return c;
});
const toScript = s => s.replace(/[A-Za-z]/g, c =>
  ({A:'𝒜',B:'ℬ',C:'𝒞',D:'𝒟',E:'ℰ',F:'ℱ',G:'𝒢',H:'ℋ',I:'ℐ',J:'𝒥',K:'𝒦',L:'ℒ',M:'ℳ',N:'𝒩',O:'𝒪',P:'𝒫',Q:'𝒬',R:'ℛ',S:'𝒮',T:'𝒯',U:'𝒰',V:'𝒱',W:'𝒲',X:'𝒳',Y:'𝒴',Z:'𝒵',a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'ℯ',f:'𝒻',g:'ℊ',h:'𝒽',i:'𝒾',j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'ℴ',p:'𝓅',q:'𝓆',r:'𝓇',s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏'}[c] || c)
);
const toUnder = s => [...s].map(c => c+'\u0332').join('');
const toStrike = s => [...s].map(c => c+'\u0336').join('');
const toUpper = s => s.toUpperCase();
const toLower = s => s.toLowerCase();
const toNumbered = s => s.split('\n').filter(l=>l.trim()).map((l,i) => `${i+1}. ${l.trim()}`).join('\n');
const toBullets = s => s.split('\n').filter(l=>l.trim()).map(l => `• ${l.trim()}`).join('\n');
const toChecklist = s => s.split('\n').filter(l=>l.trim()).map(l => `☐ ${l.trim()}`).join('\n');

// ── SHARED UI COMPONENTS ──────────────────────────────────────────────────────
function Spinner({size=18, color=C.white}) {
  return <>
    <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    <div style={{width:size,height:size,border:`2.5px solid ${color}33`,borderTop:`2.5px solid ${color}`,borderRadius:"50%",animation:"sp .7s linear infinite",flexShrink:0}}/>
  </>;
}

function Shimmer({rows=5}) {
  return <>
    <style>{`@keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    {Array.from({length:rows},(_,i) => <div key={i} style={{height:13,borderRadius:6,marginBottom:10,width:`${[100,80,90,70,85][i%5]}%`,background:"linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",backgroundSize:"200% 100%",animation:"sh 1.2s infinite"}}/>)}
  </>;
}

function Toast({msg, type, onClose}) {
  return <>
    <style>{`@keyframes su{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,maxWidth:380,background:type==="error"?C.red:C.text,color:"#fff",padding:"12px 20px",borderRadius:10,display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 24px rgba(0,0,0,.2)",animation:"su .2s ease",fontSize:14,fontWeight:500}}>
      {type==="error" ? <AlertCircle size={16}/> : <Check size={16} color="#4ADE80"/>}
      <span style={{flex:1}}>{msg}</span>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",display:"flex",padding:0}}><X size={14}/></button>
    </div>
  </>;
}

function Modal({title, onClose, children, width=520}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div style={{background:C.white,borderRadius:14,width:"100%",maxWidth:width,boxShadow:"0 20px 60px rgba(0,0,0,.25)",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700,color:C.text}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex"}}><X size={18}/></button>
        </div>
        <div style={{padding:20,overflowY:"auto"}}>{children}</div>
      </div>
    </div>
  );
}

function Btn({children, onClick, variant="primary", disabled, size="md", icon, full, type="button"}) {
  const vs = {
    primary: {bg:C.blue,   color:"#fff",    border:"none"},
    outline: {bg:"transparent", color:C.blue, border:`1.5px solid ${C.blue}`},
    ghost:   {bg:"transparent", color:C.sub,  border:`1.5px solid ${C.border}`},
    danger:  {bg:C.redLt,  color:C.red,     border:`1px solid ${C.red}44`},
    success: {bg:C.greenLt,color:C.green,   border:`1px solid ${C.green}44`},
    purple:  {bg:C.purpleLt,color:C.purple, border:`1px solid ${C.purple}44`},
    orange:  {bg:C.orangeLt,color:C.orange, border:`1px solid ${C.orange}44`},
    red:     {bg:C.red,    color:"#fff",    border:"none"},
  };
  const pads = {sm:"5px 11px", md:"9px 18px", lg:"12px 26px"};
  const fonts = {sm:12, md:14, lg:15};
  const v = vs[variant] || vs.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:pads[size],background:disabled?"#B0C7E8":v.bg,color:disabled?"#fff":v.color,border:v.border,borderRadius:22,fontSize:fonts[size],fontWeight:700,cursor:disabled?"not-allowed":"pointer",width:full?"100%":undefined,transition:"all .15s",opacity:disabled?.7:1,boxSizing:"border-box"}}>
      {icon}{children}
    </button>
  );
}

function Field({label, hint, children, error}) {
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{fontSize:13,fontWeight:600,color:C.text,display:"block",marginBottom:6}}>{label}</label>}
      {children}
      {error && <p style={{margin:"4px 0 0",fontSize:12,color:C.red,fontWeight:600}}>{error}</p>}
      {hint && !error && <p style={{margin:"4px 0 0",fontSize:12,color:C.muted}}>{hint}</p>}
    </div>
  );
}

function TInput({value, onChange, placeholder, type="text", mono, onKeyDown, disabled}) {
  const [f,setF] = useState(false);
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} onKeyDown={onKeyDown} disabled={disabled}
    style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${f?C.blue:C.border}`,borderRadius:8,fontSize:14,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:mono?"monospace":"inherit",background:disabled?"#f8f8f8":C.white,transition:"border .15s"}}/>;
}

function TArea({value, onChange, placeholder, rows=4, xStyle}) {
  const [f,setF] = useState(false);
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${f?C.blue:C.border}`,borderRadius:8,fontSize:14,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.7,resize:"vertical",transition:"border .15s",...xStyle}}/>;
}

function DDrop({value, onChange, options}) {
  const [f,setF] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <select value={value} onChange={e=>onChange(e.target.value)} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:"100%",padding:"9px 34px 9px 12px",border:`1.5px solid ${f?C.blue:C.border}`,borderRadius:8,fontSize:14,color:C.text,outline:"none",background:C.white,appearance:"none",cursor:"pointer",boxSizing:"border-box",fontFamily:"inherit",transition:"border .15s"}}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      <ChevronDown size={13} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",color:C.sub,pointerEvents:"none"}}/>
    </div>
  );
}

function Badge({status, revised}) {
  const m = {
    pending:  {c:C.orange, bg:C.orangeLt, Icon:Clock,        l:"Pending"},
    approved: {c:C.green,  bg:C.greenLt,  Icon:CheckCircle,  l:"Approved"},
    posted:   {c:C.blue,   bg:C.blueLt,   Icon:Send,         l:"Posted"},
    rejected: {c:C.red,    bg:C.redLt,    Icon:XCircle,      l:"Rejected"},
    draft:    {c:C.muted,  bg:"#F0F0F0",  Icon:Edit3,        l:"Draft"},
    failed:   {c:C.red,    bg:C.redLt,    Icon:AlertCircle,  l:"Failed"},
  };
  const s = m[status] || m.draft;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.c,fontSize:12,fontWeight:600}}>
      <s.Icon size={11}/>{s.l}
      {revised && <span style={{marginLeft:3,background:C.orange,color:"#fff",borderRadius:8,fontSize:9,fontWeight:800,padding:"0 5px"}}>REVISED</span>}
    </span>
  );
}

function AiBadge({id}) {
  const p = AI_PROVIDERS.find(x=>x.id===id);
  if(!p) return null;
  return <span style={{fontSize:11,background:"#F0F0F0",padding:"2px 7px",borderRadius:9,color:C.sub}}>{p.logo} {p.label.split(" ")[0]}</span>;
}

// ── FORMAT TOOLBAR (shared between Create Post + Posts editor) ─────────────────
function FormatToolbar({value, onChange, onInsert}) {
  const [showMore, setShowMore] = useState(false);
  const EMOJIS = ["🚀","💡","🎯","📈","✅","🔥","💪","🌟","👇","🤝","⚡","🎉","💼","🏆","📊","🛠","💬","🙌"];

  const applyStyle = (fn) => {
    const el = document.activeElement;
    const start = el?.selectionStart ?? 0;
    const end   = el?.selectionEnd   ?? 0;
    if (start === end) { onChange(fn(value)); return; }
    onChange(value.slice(0,start) + fn(value.slice(start,end)) + value.slice(end));
  };

  const TB = ({label, tip, onClick}) => (
    <button title={tip} onClick={onClick}
      style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12,fontWeight:600,color:C.text,transition:"all .12s",lineHeight:1.3}}
      onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;e.currentTarget.style.borderColor=C.blue;e.currentTarget.style.color=C.blue;}}
      onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;}}>
      {label}
    </button>
  );

  const Div = () => <div style={{width:1,height:18,background:C.border,margin:"0 3px",flexShrink:0}}/>;

  return (
    <div style={{border:`1px solid ${C.border}`,borderRadius:9,overflow:"hidden",marginBottom:7}}>
      <div style={{display:"flex",alignItems:"center",gap:3,padding:"6px 8px",background:C.bg,flexWrap:"wrap",borderBottom:`1px solid ${C.border}`}}>
        <button title="Hashtag" onClick={()=>onInsert(" #")} style={{width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;e.currentTarget.style.borderColor=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.border;}}><Hash size={12}/></button>
        <button title="Mention" onClick={()=>onInsert(" @")} style={{width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;e.currentTarget.style.borderColor=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.border;}}><AtSign size={12}/></button>
        <button title="Line break" onClick={()=>onInsert("\n\n")} style={{width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;e.currentTarget.style.borderColor=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.border;}}>↵</button>
        <Div/>
        <TB label="𝗕old"      tip="Bold"           onClick={()=>applyStyle(toBold)}/>
        <TB label="𝘐talic"    tip="Italic"         onClick={()=>applyStyle(toItalic)}/>
        <TB label="𝒮cript"    tip="Script"         onClick={()=>applyStyle(toScript)}/>
        <TB label="U̲nder"     tip="Underline"      onClick={()=>applyStyle(toUnder)}/>
        <TB label="S̶trike"    tip="Strikethrough"  onClick={()=>applyStyle(toStrike)}/>
        <Div/>
        <TB label="1. List"   tip="Numbered list"  onClick={()=>applyStyle(toNumbered)}/>
        <TB label="• Bullets" tip="Bullet points"  onClick={()=>applyStyle(toBullets)}/>
        <TB label="☐ Check"   tip="Checklist"      onClick={()=>applyStyle(toChecklist)}/>
        <Div/>
        <div style={{position:"relative"}}>
          <button style={{width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{const el=e.currentTarget.nextSibling;el.style.display=el.style.display==="flex"?"none":"flex";}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;}}><Smile size={12}/></button>
          <div style={{display:"none",position:"absolute",top:"110%",left:0,zIndex:200,background:C.white,border:`1px solid ${C.border}`,borderRadius:9,padding:8,boxShadow:"0 8px 22px rgba(0,0,0,.14)",flexWrap:"wrap",gap:3,width:195}}>
            {EMOJIS.map(e => <button key={e} onClick={()=>onInsert(e)} style={{fontSize:16,background:"none",border:"none",cursor:"pointer",borderRadius:4,padding:2}}>{e}</button>)}
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:5}}>
          <TB label="UPPER" tip="UPPERCASE" onClick={()=>applyStyle(toUpper)}/>
          <TB label="lower" tip="lowercase" onClick={()=>applyStyle(toLower)}/>
          <button title="Copy all" onClick={()=>navigator.clipboard?.writeText(value)} style={{width:24,height:24,borderRadius:5,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;}}><Copy size={12}/></button>
        </div>
      </div>
      <button onClick={()=>setShowMore(v=>!v)} style={{width:"100%",padding:"3px 0",background:showMore?"#EAF0FA":C.bg,border:"none",borderTop:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,color:showMore?C.blue:C.muted,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        {showMore ? <><ChevronUp size={10}/>Hide extra styles</> : <><ChevronDown size={10}/>More styles</>}
      </button>
    </div>
  );
}

// ── IMAGE UPLOADER ─────────────────────────────────────────────────────────────
function ImageUploader({value, onChange, compact}) {
  const [mode,setMode] = useState("upload");
  const [drag,setDrag] = useState(false);
  const ref = useRef(null);

  const handleFile = (file) => {
    if(!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:7}}>
        <button onClick={()=>setMode("upload")} style={{padding:"4px 11px",borderRadius:13,border:`1.5px solid ${mode==="upload"?C.blue:C.border}`,background:mode==="upload"?C.blueLt:C.white,color:mode==="upload"?C.blue:C.sub,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          <Upload size={11}/>Upload File
        </button>
        <button onClick={()=>setMode("url")} style={{padding:"4px 11px",borderRadius:13,border:`1.5px solid ${mode==="url"?C.blue:C.border}`,background:mode==="url"?C.blueLt:C.white,color:mode==="url"?C.blue:C.sub,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          🔗 Paste URL
        </button>
      </div>
      {mode==="upload" ? (
        <div onClick={()=>ref.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files?.[0]);}}
          style={{borderRadius:8,border:`2px dashed ${drag?C.blue:C.border}`,background:drag?C.blueLt:C.bg,padding:compact?"13px":"20px",textAlign:"center",cursor:"pointer",transition:"all .15s"}}>
          <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])}/>
          <Upload size={compact?17:22} color={drag?C.blue:C.muted} style={{marginBottom:5}}/>
          <p style={{margin:0,fontSize:13,fontWeight:600,color:drag?C.blue:C.text}}>Click to upload or drag & drop</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>PNG, JPG, GIF — max 5 MB</p>
        </div>
      ) : (
        <TInput value={value?.startsWith("data:")?"":value} onChange={onChange} placeholder="https://…/image.jpg"/>
      )}
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({onLogin}) {
  const [tab,setTab]       = useState("login");
  const [email,setEmail]   = useState("");
  const [password,setPwd]  = useState("");
  const [name,setName]     = useState("");
  const [loading,setL]     = useState(false);
  const [error,setError]   = useState("");

  const submit = async () => {
    setError(""); setL(true);
    try {
      let res;
      if(tab==="login") {
        res = await api("POST","/auth/login",{email,password});
      } else {
        if(!name.trim()){setError("Name is required");setL(false);return;}
        res = await api("POST","/auth/signup",{email,password,name});
      }
      onLogin(res.token, res.user);
    } catch(e) {
      setError(e.message);
    }
    setL(false);
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:16}}>
      <div style={{background:C.white,borderRadius:16,padding:"40px 36px",width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(0,0,0,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:28,justifyContent:"center"}}>
          <div style={{width:40,height:40,background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}><Linkedin size={22} color="#fff"/></div>
          <div><p style={{margin:0,fontSize:18,fontWeight:800,color:C.text}}>LinkedPilot AI</p><p style={{margin:0,fontSize:11,color:C.blue,fontWeight:700,letterSpacing:1}}>AI AUTOPILOT</p></div>
        </div>

        <div style={{display:"flex",gap:0,marginBottom:24,background:C.bg,borderRadius:10,padding:4}}>
          {["login","signup"].map(t => (
            <button key={t} onClick={()=>{setTab(t);setError("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:tab===t?C.white:"transparent",color:tab===t?C.text:C.muted,fontWeight:tab===t?700:500,fontSize:14,cursor:"pointer",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,.1)":"none",transition:"all .15s",textTransform:"capitalize"}}>
              {t==="login"?"Sign In":"Create Account"}
            </button>
          ))}
        </div>

        {tab==="signup" && (
          <Field label="Full Name">
            <TInput value={name} onChange={setName} placeholder="Your Name"/>
          </Field>
        )}
        <Field label="Email">
          <TInput value={email} onChange={setEmail} type="email" placeholder="you@example.com"/>
        </Field>
        <Field label="Password">
          <TInput value={password} onChange={setPwd} type="password" placeholder={tab==="signup"?"Create a password (min 8 chars)":"Your password"}
            onKeyDown={e=>e.key==="Enter"&&submit()}/>
        </Field>

        {error && <div style={{background:C.redLt,border:`1px solid ${C.red}33`,borderRadius:7,padding:"9px 12px",marginBottom:14,fontSize:13,color:C.red,fontWeight:600}}>{error}</div>}

        <Btn full onClick={submit} disabled={loading||!email||!password} icon={loading?<Spinner size={15}/>:null}>
          {loading?(tab==="login"?"Signing in…":"Creating account…"):(tab==="login"?"Sign In":"Create Account")}
        </Btn>

        <div style={{marginTop:20,padding:"14px 16px",background:C.blueLt,borderRadius:9,fontSize:12,color:C.blueDk}}>
          <p style={{margin:"0 0 4px",fontWeight:700}}>Before signing in:</p>
          <p style={{margin:0,lineHeight:1.6}}>Make sure the backend is running:<br/><code style={{background:"rgba(0,0,0,.07)",padding:"1px 5px",borderRadius:4}}>./run.sh</code> in the project folder</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({token, liStatus, onNav}) {
  const [stats,setStats] = useState(null);
  const [posts,setPosts] = useState([]);

  useEffect(()=>{
    api("GET","/analytics/summary",null,token).then(setStats).catch(()=>{});
    api("GET","/posts",null,token).then(setPosts).catch(()=>{});
  },[token]);

  const pending = posts.filter(p=>p.status==="pending").length;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:0}}>Good morning 👋</h1>
        <p style={{color:C.sub,margin:"4px 0 0",fontSize:14}}>{liStatus?.connected?`${pending} post${pending!==1?"s":""} need approval`:"Connect LinkedIn in Settings to start posting."}</p>
      </div>

      {!liStatus?.connected && (
        <div style={{background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,borderRadius:12,padding:"16px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
          <Linkedin size={28} color="#fff"/>
          <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:15,color:"#fff"}}>Connect LinkedIn to start posting</p><p style={{margin:"2px 0 0",fontSize:13,color:"rgba(255,255,255,.85)"}}>Go to Settings → connect your account.</p></div>
          <Btn onClick={()=>onNav("settings")} style={{background:"#fff",color:C.blue,border:"none"}}>Connect Now</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Posts Published",  value:stats?.total_posts??"-",            icon:FileText,  c:C.blue,   note:`${posts.filter(p=>p.status==="pending").length} pending approval`},
          {label:"Total Likes",      value:stats?.total_likes??"-",            icon:ThumbsUp,  c:C.green,  note:"Across all posts"},
          {label:"Total Impressions",value:stats?.total_impressions??"-",      icon:Eye,       c:C.orange, note:"Tracked in-app"},
          {label:"Auto-Generated",   value:stats?.auto_generated??"-",         icon:Sparkles,  c:C.purple, note:"By pipeline"},
        ].map(s => (
          <div key={s.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"15px 17px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><p style={{margin:0,fontSize:12,color:C.sub,fontWeight:600}}>{s.label}</p><p style={{margin:"4px 0 0",fontSize:22,fontWeight:800,color:C.text}}>{s.value}</p></div>
              <div style={{background:C.blueLt,borderRadius:8,padding:7}}><s.icon size={16} color={s.c}/></div>
            </div>
            <p style={{margin:"6px 0 0",fontSize:12,color:C.muted,fontWeight:500}}>{s.note}</p>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:13}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:17}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13}}>
            <h2 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>Recent Posts</h2>
            <button onClick={()=>onNav("posts")} style={{fontSize:13,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>View all →</button>
          </div>
          {posts.slice(0,5).map(p => (
            <div key={p.id} style={{padding:"10px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10}}>
              {p.image_url ? <div style={{width:42,height:42,borderRadius:7,overflow:"hidden",flexShrink:0,background:C.bg}}><img src={p.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
                : <div style={{width:34,height:34,borderRadius:"50%",background:C.blueLt,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Linkedin size={15} color={C.blue}/></div>}
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:"0 0 4px",fontSize:13,color:C.text,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.content}</p>
                <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <Badge status={p.status} revised={p.revised}/>
                  {p.ai_provider && <AiBadge id={p.ai_provider}/>}
                </div>
              </div>
            </div>
          ))}
          {posts.length===0 && <p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No posts yet. Generate or create one!</p>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:15}}>
            <h3 style={{margin:"0 0 11px",fontSize:14,fontWeight:700,color:C.text}}>Quick Actions</h3>
            {[
              {icon:Flame,    label:"Automation Pipeline", act:"automation", c:"#FF6B35"},
              {icon:PenLine,  label:"Create & Format Post", act:"create",   c:C.blue},
              {icon:BookOpen, label:"Research Hub",        act:"research",  c:C.teal},
              {icon:Sparkles, label:"AI Generate",         act:"generate",  c:C.purple},
            ].map(a => (
              <button key={a.label} onClick={()=>onNav(a.act)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",marginBottom:6,textAlign:"left"}}>
                <div style={{width:26,height:26,borderRadius:7,background:a.c+"18",display:"flex",alignItems:"center",justifyContent:"center"}}><a.icon size={13} color={a.c}/></div>
                <span style={{fontSize:13,fontWeight:600,color:C.text,flex:1}}>{a.label}</span>
                <ChevronRight size={12} color={C.muted}/>
              </button>
            ))}
          </div>
          {stats?.best_post && (
            <div style={{background:`linear-gradient(135deg,${C.greenLt},#fff)`,border:`1px solid ${C.green}22`,borderRadius:11,padding:14}}>
              <p style={{margin:"0 0 7px",fontSize:13,fontWeight:700,color:C.green}}>🏆 Best Performing Post</p>
              <p style={{margin:"0 0 5px",fontSize:13,color:C.text,lineHeight:1.5}}>{stats.best_post.content}</p>
              <p style={{margin:0,fontSize:12,color:C.muted}}><ThumbsUp size={10} style={{verticalAlign:"middle",marginRight:3}}/>{stats.best_post.likes} likes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POSTS — approval workflow wired to real backend
// ═══════════════════════════════════════════════════════════════════════════════
function Posts({token, showToast, onNav}) {
  const [posts,setPosts]     = useState([]);
  const [filter,setFilter]   = useState("pending");
  const [loading,setL]       = useState(true);
  const [active,setActive]   = useState(null);
  const [rejectModal,setRM]  = useState(false);
  const [rejectReason,setRR] = useState("");
  const [rejectType,setRT]   = useState("both");
  const [regen,setRegen]     = useState(false);
  const [editingContent,setEC] = useState(false);
  const [editContent,setEditC] = useState("");
  const [editImg,setEditImg]   = useState("");
  const [editingImg,setEI]     = useState(false);
  const [acting,setActing]     = useState(false);

  const loadPosts = useCallback(async () => {
    setL(true);
    try { setPosts(await api("GET","/posts",null,token)); }
    catch(e) { showToast(e.message,"error"); }
    setL(false);
  },[token]);

  useEffect(()=>{ loadPosts(); },[loadPosts]);

  const counts = ["all","pending","approved","posted","rejected","draft"].reduce((a,s)=>({...a,[s]:s==="all"?posts.length:posts.filter(p=>p.status===s).length}),{});
  const filtered = filter==="all" ? posts : posts.filter(p=>p.status===filter);

  const selectPost = p => { setActive(p); setEditC(p.content); setEditImg(p.image_url||""); setEC(false); setEI(false); };

  const saveChanges = async () => {
    try {
      const updated = await api("PATCH",`/posts/${active.id}`,{content:editContent,image_url:editImg},token);
      setPosts(ps=>ps.map(p=>p.id===active.id?updated:p));
      setActive(updated); setEC(false); setEI(false);
      showToast("Changes saved.");
    } catch(e) { showToast(e.message,"error"); }
  };

  const approve = async () => {
    setActing(true);
    try {
      if(editContent!==active.content||editImg!==(active.image_url||"")) await saveChanges();
      const updated = await api("POST",`/posts/${active.id}/approve`,null,token);
      setPosts(ps=>ps.map(p=>p.id===active.id?updated:p));
      setActive(updated);
      showToast("✅ Approved & posted to LinkedIn!");
    } catch(e) { showToast(e.message,"error"); }
    setActing(false);
  };

  const confirmReject = async () => {
    if(!rejectReason.trim()){showToast("Add a reason so AI can fix it.","error");return;}
    setActing(true);
    try {
      const updated = await api("POST",`/posts/${active.id}/reject`,{reason:rejectReason,reject_type:rejectType},token);
      setPosts(ps=>ps.map(p=>p.id===active.id?updated:p));
      setActive(updated); setRM(false); setRR(""); setRT("both");
      showToast("Post rejected. Click Regenerate to fix with AI.");
    } catch(e) { showToast(e.message,"error"); }
    setActing(false);
  };

  const regenerate = async () => {
    setRegen(true);
    try {
      const updated = await api("POST",`/posts/${active.id}/regenerate`,null,token);
      setPosts(ps=>ps.map(p=>p.id===active.id?updated:p));
      setActive(updated); setEditC(updated.content); setEditImg(updated.image_url||"");
      showToast("♻️ Content regenerated! Review the revised version.");
    } catch(e) { showToast(e.message,"error"); }
    setRegen(false);
  };

  const deletePost = async (id) => {
    try {
      await api("DELETE",`/posts/${id}`,null,token);
      setPosts(ps=>ps.filter(p=>p.id!==id));
      if(active?.id===id) setActive(null);
      showToast("Post deleted.");
    } catch(e) { showToast(e.message,"error"); }
  };

  const hasChanges = active && (editContent!==active.content || editImg!==(active.image_url||""));

  return (
    <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:14,height:"calc(100vh - 110px)"}}>
      {/* LIST */}
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexShrink:0}}>
          <h1 style={{fontSize:20,fontWeight:800,color:C.text,margin:0}}>Posts</h1>
          <Btn size="sm" icon={<PenLine size={13}/>} onClick={()=>onNav("create")}>New</Btn>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap",flexShrink:0}}>
          {Object.entries(counts).map(([f,n])=>(
            <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 9px",borderRadius:13,cursor:"pointer",textTransform:"capitalize",border:`1.5px solid ${filter===f?C.blue:C.border}`,background:filter===f?C.blueLt:C.white,color:filter===f?C.blue:C.sub,fontSize:11,fontWeight:filter===f?700:400,display:"flex",alignItems:"center",gap:3}}>
              {f}{n>0&&<span style={{background:filter===f?C.blue:"#e0e0e0",color:filter===f?"#fff":C.sub,borderRadius:8,fontSize:10,fontWeight:700,padding:"0 4px"}}>{n}</span>}
            </button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
          {loading && <Shimmer rows={5}/>}
          {!loading && filtered.length===0 && <div style={{textAlign:"center",padding:"32px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10}}><FileText size={26} color={C.muted} style={{marginBottom:7}}/><p style={{color:C.sub,fontSize:13,margin:0}}>No posts here.</p></div>}
          {filtered.map(p=>(
            <div key={p.id} onClick={()=>selectPost(p)}
              style={{background:C.card,border:`1.5px solid ${active?.id===p.id?C.blue:C.border}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",transition:"border .15s"}}
              onMouseEnter={e=>{if(active?.id!==p.id)e.currentTarget.style.borderColor=C.blueMd;}}
              onMouseLeave={e=>{if(active?.id!==p.id)e.currentTarget.style.borderColor=C.border;}}>
              {p.image_url&&<div style={{width:"100%",height:60,borderRadius:6,overflow:"hidden",marginBottom:6,background:C.bg}}><img src={p.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
              <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                <Badge status={p.status} revised={p.revised}/>
                {p.ai_provider&&<AiBadge id={p.ai_provider}/>}
                {p.auto&&<span style={{fontSize:10,background:C.orangeLt,color:C.orange,padding:"1px 5px",borderRadius:7,fontWeight:700}}>⚡ Auto</span>}
              </div>
              <p style={{margin:"0 0 3px",fontSize:12,color:C.text,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.content}</p>
              {p.reject_reason&&<p style={{margin:"3px 0 0",fontSize:11,color:C.red,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>❌ {p.reject_reason}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* REVIEW PANEL */}
      <div style={{overflowY:"auto"}}>
        {!active ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:C.muted}}>
            <FileText size={44} style={{marginBottom:12,opacity:.2}}/>
            <p style={{fontSize:15,fontWeight:600,margin:0}}>Select a post to review</p>
          </div>
        ) : (
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"13px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:7,flexWrap:"wrap",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                <Badge status={active.status} revised={active.revised}/>
                {active.ai_provider&&<AiBadge id={active.ai_provider}/>}
                {active.auto&&<span style={{fontSize:11,background:C.orangeLt,color:C.orange,padding:"2px 7px",borderRadius:9,fontWeight:700}}>⚡ Auto-Generated</span>}
                {active.revised&&<span style={{fontSize:11,background:C.purpleLt,color:C.purple,padding:"2px 7px",borderRadius:9,fontWeight:700}}>♻️ AI Revised</span>}
              </div>
              <button onClick={loadPosts} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex",gap:4,alignItems:"center",fontSize:12}}><RefreshCw size={12}/>Refresh</button>
            </div>

            {active.reject_reason&&(
              <div style={{padding:"11px 18px",background:C.redLt,borderBottom:`1px solid ${C.red}22`,display:"flex",gap:9,alignItems:"flex-start"}}>
                <AlertTriangle size={14} color={C.red} style={{flexShrink:0,marginTop:1}}/>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontSize:13,fontWeight:700,color:C.red}}>Rejection Remarks</p>
                  <p style={{margin:"2px 0 0",fontSize:13,color:C.text}}>{active.reject_reason}</p>
                  <p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>Applies to: <strong>{active.reject_type==="both"?"Content & Image":active.reject_type==="image"?"Image only":"Content only"}</strong></p>
                </div>
                {active.status==="rejected"&&(
                  <button onClick={regenerate} disabled={regen} style={{padding:"6px 12px",background:C.purple,color:"#fff",border:"none",borderRadius:16,fontSize:12,fontWeight:700,cursor:regen?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0,opacity:regen?.7:1}}>
                    {regen?<Spinner size={12}/>:<RotateCcw size={12}/>}{regen?"Regenerating…":"Regenerate with AI"}
                  </button>
                )}
              </div>
            )}

            <div style={{padding:18}}>
              {/* IMAGE */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>🖼 Post Image</h3>
                  <div style={{display:"flex",gap:6}}>
                    <Btn size="sm" variant="ghost" icon={<Edit3 size={11}/>} onClick={()=>setEI(v=>!v)}>{editingImg?"Hide":"Change"}</Btn>
                    <Btn size="sm" variant="danger" icon={<Trash2 size={11}/>} onClick={()=>{setEditImg("");showToast("Image removed — save changes to apply.");}}>Remove</Btn>
                  </div>
                </div>
                {editImg ? (
                  <div style={{borderRadius:9,overflow:"hidden",border:`1px solid ${C.border}`,height:180,position:"relative"}}>
                    <img src={editImg} alt="Post" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                    {active.image_prompt&&<div style={{position:"absolute",bottom:6,left:6,background:"rgba(0,0,0,.55)",borderRadius:5,padding:"2px 8px",fontSize:10,color:"#fff",maxWidth:"80%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>AI: {active.image_prompt.slice(0,50)}…</div>}
                  </div>
                ) : (
                  <div style={{borderRadius:9,border:`2px dashed ${C.border}`,background:C.bg,height:70,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    <span style={{color:C.muted,fontSize:13}}>No image attached</span>
                  </div>
                )}
                {editingImg&&<div style={{marginTop:8}}><ImageUploader value={editImg} onChange={setEditImg} compact/>{active.image_prompt&&<div style={{background:C.bg,borderRadius:7,padding:"7px 10px",fontSize:12,color:C.sub,marginTop:6}}><strong>AI Prompt:</strong> {active.image_prompt}</div>}</div>}
              </div>

              {/* CONTENT */}
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <h3 style={{margin:0,fontSize:14,fontWeight:700,color:C.text}}>📝 Post Content</h3>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Btn size="sm" variant="ghost" icon={editingContent?<Eye size={11}/>:<Edit3 size={11}/>} onClick={()=>setEC(v=>!v)}>{editingContent?"Preview":"Edit & Format"}</Btn>
                    <Btn size="sm" variant="ghost" icon={<Copy size={11}/>} onClick={()=>{navigator.clipboard?.writeText(editContent);showToast("Copied!");}}>Copy</Btn>
                  </div>
                </div>
                {editingContent ? (
                  <>
                    <FormatToolbar value={editContent} onChange={setEditC} onInsert={txt=>setEditC(c=>c+txt)}/>
                    <TArea value={editContent} onChange={setEditC} rows={9} xStyle={{fontSize:14,lineHeight:1.8}}/>
                  </>
                ) : (
                  <div style={{background:C.bg,borderRadius:9,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",gap:8,marginBottom:9}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>Y</div>
                      <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.text}}>Your Name</p><p style={{margin:0,fontSize:11,color:C.muted}}>Just now</p></div>
                    </div>
                    <p style={{fontSize:14,lineHeight:1.8,color:C.text,whiteSpace:"pre-wrap",margin:0}}>{editContent}</p>
                  </div>
                )}
              </div>

              {hasChanges&&(
                <div style={{background:C.blueLt,border:`1.5px solid ${C.blue}`,borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                  <AlertCircle size={14} color={C.blue}/>
                  <p style={{margin:0,fontSize:13,color:C.blue,fontWeight:600,flex:1}}>You have unsaved changes.</p>
                  <Btn size="sm" icon={<Save size={11}/>} onClick={saveChanges}>Save</Btn>
                  <button onClick={()=>{setEditC(active.content);setEditImg(active.image_url||"");setEC(false);setEI(false);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:12}}>Discard</button>
                </div>
              )}

              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,display:"flex",flexDirection:"column",gap:8}}>
                {active.status==="pending"&&<>
                  <Btn full variant="success" disabled={acting} icon={acting?<Spinner size={14} color={C.green}/>:<CheckCircle size={14}/>} onClick={approve}>✅ Approve & Post to LinkedIn</Btn>
                  <Btn full variant="danger"  icon={<XCircle size={13}/>} onClick={()=>setRM(true)}>❌ Reject with Remarks</Btn>
                </>}
                {active.status==="rejected"&&<>
                  <Btn full variant="purple" disabled={regen} icon={regen?<Spinner size={13} color={C.purple}/>:<RotateCcw size={13}/>} onClick={regenerate}>{regen?"AI is regenerating…":"♻️ Regenerate with AI"}</Btn>
                  <Btn full variant="ghost" icon={<Edit3 size={13}/>} onClick={()=>setEC(true)}>Edit Manually</Btn>
                  <Btn full variant="success" disabled={acting} icon={acting?<Spinner size={13} color={C.green}/>:<CheckCircle size={13}/>} onClick={approve}>Approve & Post Anyway</Btn>
                </>}
                {active.status==="approved"&&<div style={{background:C.greenLt,border:`1px solid ${C.green}33`,borderRadius:9,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}><CheckCircle size={17} color={C.green}/><p style={{margin:0,fontSize:14,fontWeight:700,color:C.green}}>Post approved and published to LinkedIn!</p></div>}
                {active.status==="posted"&&<div style={{background:C.blueLt,border:`1px solid ${C.blue}33`,borderRadius:9,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}><Send size={17} color={C.blue}/><div><p style={{margin:0,fontSize:14,fontWeight:700,color:C.blue}}>Posted to LinkedIn</p>{active.li_post_id&&<p style={{margin:"2px 0 0",fontSize:11,color:C.muted}}>ID: {active.li_post_id}</p>}</div></div>}
                {active.status==="failed"&&<div style={{background:C.redLt,border:`1px solid ${C.red}33`,borderRadius:9,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}><AlertCircle size={17} color={C.red}/><p style={{margin:0,fontSize:13,fontWeight:600,color:C.red}}>Posting failed — check your LinkedIn connection and try again.</p></div>}
                {active.status!=="posted"&&<button onClick={()=>deletePost(active.id)} style={{padding:"7px",background:"none",border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,color:C.muted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Trash2 size={11}/>Delete Post</button>}
              </div>
            </div>
          </div>
        )}
      </div>

      {rejectModal&&(
        <Modal title="❌ Reject Post — Add Remarks" onClose={()=>setRM(false)}>
          <p style={{fontSize:14,color:C.sub,margin:"0 0 14px"}}>Tell the AI exactly what's wrong so it can fix it precisely.</p>
          <Field label="What needs fixing?"><DDrop value={rejectType} onChange={setRT} options={[{value:"both",label:"Both content & image"},{value:"content",label:"Content only"},{value:"image",label:"Image only"}]}/></Field>
          <Field label="Remarks / Reason *" hint="Be specific — AI uses this to regenerate.">
            <TArea value={rejectReason} onChange={setRR} rows={4} placeholder="e.g. Too casual, needs more data points. Start with a surprising fact instead of a question."/>
          </Field>
          <div style={{background:C.orangeLt,border:`1px solid ${C.orange}33`,borderRadius:7,padding:"9px 12px",marginBottom:14,fontSize:13,color:C.orange}}>
            💡 After rejecting, click <strong>Regenerate with AI</strong> — it reads your remarks and fixes exactly what you described.
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <Btn variant="ghost" onClick={()=>setRM(false)}>Cancel</Btn>
            <Btn variant="red" disabled={acting} icon={acting?<Spinner size={12}/>:<XCircle size={13}/>} onClick={confirmReject}>Reject & Send to AI</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERATE — calls real backend
// ═══════════════════════════════════════════════════════════════════════════════
function Generate({token, showToast, onNav}) {
  const [topic,setTopic]   = useState("");
  const [tone,setTone]     = useState("Professional");
  const [kw,setKw]         = useState("");
  const [provider,setProv] = useState("claude");
  const [genImg,setGenImg] = useState(true);
  const [loading,setL]     = useState(false);
  const [result,setResult] = useState(null);

  const generate = async () => {
    if(!topic.trim()){showToast("Enter a topic.","error");return;}
    setL(true); setResult(null);
    try {
      const res = await api("POST","/content/generate",{topic,tone,keywords:kw,provider,generate_image:genImg},token);
      setResult(res);
    } catch(e) { showToast(e.message,"error"); }
    setL(false);
  };

  const sendToQueue = async () => {
    if(!result) return;
    try {
      await api("POST","/posts",{content:result.content,image_url:result.image_url||"",image_prompt:result.image_prompt||"",status:"pending",topic,tone,ai_provider:provider},token);
      showToast("Sent to approval queue — check Posts tab!");
      setResult(null); setTopic("");
    } catch(e) { showToast(e.message,"error"); }
  };

  const saveDraft = async () => {
    if(!result) return;
    try {
      await api("POST","/posts",{content:result.content,image_url:result.image_url||"",image_prompt:result.image_prompt||"",status:"draft",topic,tone,ai_provider:provider},token);
      showToast("Draft saved!");
      setResult(null); setTopic("");
    } catch(e) { showToast(e.message,"error"); }
  };

  return (
    <div style={{maxWidth:720}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>AI Content Generator</h1>
      <p style={{color:C.sub,fontSize:14,marginBottom:18}}>Generate content + real AI image, then send to approval queue.</p>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20,marginBottom:14}}>
        <Field label="AI Provider"><DDrop value={provider} onChange={setProv} options={AI_PROVIDERS.map(p=>({value:p.id,label:`${p.logo}  ${p.label}`}))}/></Field>
        <Field label="Topic *"><TArea value={topic} onChange={setTopic} rows={3} placeholder="e.g. How AI is transforming hiring in 2025…"/></Field>
        <Field label="Tone">
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {TONES.map(t=><button key={t} onClick={()=>setTone(t)} style={{padding:"4px 11px",borderRadius:16,cursor:"pointer",fontSize:12,fontWeight:tone===t?700:400,border:`1.5px solid ${tone===t?C.blue:C.border}`,background:tone===t?C.blueLt:C.white,color:tone===t?C.blue:C.sub,transition:"all .15s"}}>{t}</button>)}
          </div>
        </Field>
        <Field label="Keywords" hint="Optional"><TInput value={kw} onChange={setKw} placeholder="e.g. automation, growth"/></Field>
        <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.bg,borderRadius:7,cursor:"pointer",marginBottom:14}}>
          <input type="checkbox" checked={genImg} onChange={e=>setGenImg(e.target.checked)} style={{accentColor:C.blue,width:14,height:14}}/>
          <span style={{fontSize:13,color:C.sub,fontWeight:600}}>Generate real AI image with DALL-E 3 (requires OpenAI key)</span>
        </label>
        <Btn full onClick={generate} disabled={loading||!topic.trim()} icon={loading?<Spinner size={15}/>:<Sparkles size={14}/>}>{loading?"Generating…":"Generate Post"}</Btn>
      </div>

      {loading && <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20}}><Shimmer/></div>}

      {result && !loading && (
        <div style={{background:C.card,border:`1.5px solid ${C.blue}`,borderRadius:11,padding:20}}>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:700}}>Y</div>
            <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:14,color:C.text}}>Your Name</p><p style={{margin:"1px 0 0",fontSize:12,color:C.muted}}>Just now</p></div>
            <AiBadge id={provider}/>
          </div>

          {result.image_url && (
            <div style={{borderRadius:8,overflow:"hidden",marginBottom:12,height:200}}>
              <img src={result.image_url} alt="AI generated" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.parentElement.style.display="none"}/>
            </div>
          )}
          {!result.image_url && genImg && <div style={{background:C.orangeLt,borderRadius:7,padding:"7px 11px",marginBottom:12,fontSize:12,color:C.orange}}>⚠ Image generation skipped — add an OpenAI API key in Settings.</div>}

          <FormatToolbar value={result.content} onChange={v=>setResult(r=>({...r,content:v}))} onInsert={txt=>setResult(r=>({...r,content:r.content+txt}))}/>
          <TArea value={result.content} onChange={v=>setResult(r=>({...r,content:v}))} rows={8} xStyle={{fontSize:14,lineHeight:1.8}}/>

          <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginTop:12}}>
            <Btn variant="ghost" size="sm" icon={<RefreshCw size={11}/>} onClick={generate}>Regenerate</Btn>
            <Btn variant="ghost" size="sm" icon={<Copy size={11}/>} onClick={()=>{navigator.clipboard?.writeText(result.content);showToast("Copied!");}}>Copy</Btn>
            <div style={{marginLeft:"auto",display:"flex",gap:7}}>
              <Btn variant="ghost" size="sm" icon={<Save size={11}/>} onClick={saveDraft}>Save Draft</Btn>
              <Btn variant="success" size="sm" icon={<CheckCircle size={11}/>} onClick={sendToQueue}>Send to Approval Queue</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATION PIPELINE — wired to real backend
// ═══════════════════════════════════════════════════════════════════════════════
function AutomationPipeline({token, liStatus, showToast}) {
  const [topics,setTopics]     = useState([]);
  const [settings,setSettings] = useState({pipeline_active:false,pipeline_freq:"daily",pipeline_time:"09:00",auto_post:false,gen_image:true,default_ai:"claude"});
  const [newT,setNewT]         = useState("");
  const [newTone,setNewTone]   = useState("Professional");
  const [running,setRunning]   = useState(false);
  const [logs,setLogs]         = useState([]);
  const [loadingTopics,setLT]  = useState(true);

  useEffect(()=>{
    Promise.all([
      api("GET","/automation/topics",null,token),
      api("GET","/settings",null,token),
    ]).then(([t,s])=>{setTopics(t);setSettings(s);}).catch(()=>{}).finally(()=>setLT(false));
  },[token]);

  const addLog = msg => setLogs(l=>[{t:new Date().toLocaleTimeString(),msg},...l].slice(0,20));

  const saveSetting = async (patch) => {
    const merged = {...settings,...patch};
    setSettings(merged);
    try { await api("PATCH","/settings/pipeline",patch,token); }
    catch(e) { showToast(e.message,"error"); }
  };

  const addTopic = async () => {
    if(!newT.trim()) return;
    try {
      const t = await api("POST","/automation/topics",{topic:newT.trim(),tone:newTone},token);
      setTopics(prev=>[...prev,t]); setNewT(""); showToast("Topic added!");
    } catch(e) { showToast(e.message,"error"); }
  };

  const toggleTopic = async (id) => {
    try {
      const t = await api("PATCH",`/automation/topics/${id}/toggle`,null,token);
      setTopics(prev=>prev.map(x=>x.id===id?t:x));
    } catch(e) { showToast(e.message,"error"); }
  };

  const deleteTopic = async (id) => {
    try {
      await api("DELETE",`/automation/topics/${id}`,null,token);
      setTopics(prev=>prev.filter(x=>x.id!==id));
    } catch(e) { showToast(e.message,"error"); }
  };

  const runNow = async () => {
    const active = topics.filter(t=>t.active);
    if(!active.length){showToast("No active topics!","error");return;}
    setRunning(true);
    addLog("🚀 Starting pipeline run…");
    try {
      const res = await api("POST","/automation/run",null,token);
      addLog(`🎯 Topic: "${res.topic_used}"`);
      addLog(`✅ Content generated`);
      if(res.image_url) addLog("🖼 AI image generated");
      addLog(res.status==="posted"?"📤 Posted to LinkedIn!":"📋 Added to approval queue");
      showToast(res.status==="posted"?"Auto-posted to LinkedIn!":"Post added to approval queue!");
    } catch(e) {
      addLog(`❌ ${e.message}`);
      showToast(e.message,"error");
    }
    setRunning(false);
  };

  const activeCnt = topics.filter(t=>t.active).length;

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:0}}>Automation Pipeline</h1>
        <p style={{color:C.sub,fontSize:14,margin:"4px 0 0"}}>Add research topics — AI picks, writes, creates image, and posts automatically.</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 310px",gap:14}}>
        <div>
          {/* Master switch */}
          <div style={{background:settings.pipeline_active?`linear-gradient(135deg,${C.green},#0a9c58)`:C.card,border:`1px solid ${settings.pipeline_active?C.green:C.border}`,borderRadius:11,padding:"14px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:13,transition:"all .3s"}}>
            <div style={{width:38,height:38,borderRadius:9,background:settings.pipeline_active?"rgba(255,255,255,.2)":C.greenLt,display:"flex",alignItems:"center",justifyContent:"center"}}>{settings.pipeline_active?<Play size={18} color="#fff"/>:<Play size={18} color={C.green}/>}</div>
            <div style={{flex:1}}><p style={{margin:0,fontWeight:800,fontSize:14,color:settings.pipeline_active?"#fff":C.text}}>Auto-Pilot Mode</p><p style={{margin:"2px 0 0",fontSize:12,color:settings.pipeline_active?"rgba(255,255,255,.8)":C.sub}}>{settings.pipeline_active?`Running · ${activeCnt} active topic${activeCnt!==1?"s":""} · ${settings.pipeline_freq}`:`Paused · ${activeCnt} active`}</p></div>
            <button onClick={()=>saveSetting({pipeline_active:!settings.pipeline_active})} style={{padding:"8px 16px",borderRadius:20,border:"none",background:settings.pipeline_active?"rgba(255,255,255,.2)":"#fff",color:settings.pipeline_active?"#fff":C.green,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              {settings.pipeline_active?<><Pause size={12}/>Pause</>:<><Play size={12}/>Start</>}
            </button>
          </div>

          {/* Settings */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:16,marginBottom:12}}>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>⚙️ Pipeline Settings</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <Field label="AI Provider"><DDrop value={settings.default_ai} onChange={v=>saveSetting({default_ai:v})} options={AI_PROVIDERS.map(p=>({value:p.id,label:`${p.logo}  ${p.label}`}))}/></Field>
              <Field label="Frequency"><DDrop value={settings.pipeline_freq} onChange={v=>saveSetting({pipeline_freq:v})} options={[{value:"hourly",label:"Every hour"},{value:"daily",label:"Once a day"},{value:"twice",label:"Twice a day"},{value:"weekly",label:"Once a week"}]}/></Field>
              <Field label="Post Time"><input type="time" value={settings.pipeline_time} onChange={e=>saveSetting({pipeline_time:e.target.value})} style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}/></Field>
            </div>
            <div style={{display:"flex",gap:16}}>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:C.sub,fontWeight:600}}>
                <input type="checkbox" checked={settings.gen_image} onChange={e=>saveSetting({gen_image:e.target.checked})} style={{accentColor:C.blue,width:14,height:14}}/>
                Auto-generate AI image
              </label>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:C.sub,fontWeight:600,marginLeft:16}}>
                <input type="checkbox" checked={settings.auto_post} onChange={e=>saveSetting({auto_post:e.target.checked})} style={{accentColor:C.blue,width:14,height:14}}/>
                Auto-post (skip approval queue)
              </label>
            </div>
            {settings.auto_post && !liStatus?.connected && <p style={{margin:"8px 0 0",fontSize:12,color:C.orange,fontWeight:600}}>⚠ Auto-post requires LinkedIn to be connected (Settings tab).</p>}
          </div>

          {/* Topics */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:16,marginBottom:12}}>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>📋 Research Topics <span style={{fontSize:12,fontWeight:400,color:C.muted}}>({activeCnt}/{topics.length} active)</span></h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 140px auto",gap:7,marginBottom:12,padding:"10px 12px",background:C.bg,borderRadius:9,border:`1.5px dashed ${C.border}`}}>
              <TInput value={newT} onChange={setNewT} placeholder="Add a research topic…" onKeyDown={e=>e.key==="Enter"&&addTopic()}/>
              <DDrop value={newTone} onChange={setNewTone} options={TONES.map(t=>({value:t,label:t}))}/>
              <Btn icon={<Plus size={13}/>} onClick={addTopic} disabled={!newT.trim()}>Add</Btn>
            </div>
            {loadingTopics && <Shimmer rows={3}/>}
            {!loadingTopics && topics.length===0 && <div style={{textAlign:"center",padding:"22px 0",color:C.muted}}><Layers size={24} style={{marginBottom:7}}/><p style={{margin:0,fontSize:13}}>No topics yet. Add your first one above.</p></div>}
            {topics.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,border:`1.5px solid ${t.active?C.blue:C.border}`,background:t.active?C.blueLt:C.bg,marginBottom:6,transition:"all .2s"}}>
                <button onClick={()=>toggleTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,flexShrink:0,display:"flex"}}>{t.active?<ToggleRight size={24} color={C.blue}/>:<ToggleLeft size={24} color={C.muted}/>}</button>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:600,color:t.active?C.text:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.topic}</p><span style={{fontSize:11,color:t.active?C.blue:C.muted,fontWeight:600}}>{t.tone}</span></div>
                <button onClick={()=>deleteTopic(t.id)} style={{padding:"4px 7px",background:C.redLt,border:"none",borderRadius:11,cursor:"pointer",display:"flex"}}><Trash2 size={11} color={C.red}/></button>
              </div>
            ))}
          </div>

          <Btn full onClick={runNow} disabled={running||!topics.some(t=>t.active)} icon={running?<Spinner size={15}/>:<Flame size={14}/>}>
            {running?"Running pipeline…":settings.auto_post&&liStatus?.connected?"Run Now → Post to LinkedIn":"Run Now → Add to Approval Queue"}
          </Btn>
        </div>

        {/* Right side */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>📡 Activity Log</p>{logs.length>0&&<button onClick={()=>setLogs([])} style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer"}}>Clear</button>}</div>
            {logs.length===0?<div style={{textAlign:"center",padding:"16px 0",color:C.muted,fontSize:13}}>No activity yet. Run the pipeline.</div>:<div style={{maxHeight:200,overflowY:"auto"}}>{logs.map((l,i)=><div key={i} style={{fontSize:11,padding:"4px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:6}}><span style={{color:C.muted,whiteSpace:"nowrap"}}>{l.t}</span><span style={{color:C.text}}>{l.msg}</span></div>)}</div>}
          </div>
          <div style={{background:`linear-gradient(135deg,${C.blueLt},#fff)`,border:`1px solid ${C.border}`,borderRadius:11,padding:14}}>
            <p style={{margin:"0 0 9px",fontSize:13,fontWeight:700,color:C.text}}>🔄 Pipeline Flow</p>
            {[{s:"1",l:"Pick random topic",c:C.blue},{s:"2",l:"AI generates content",c:C.purple},{s:"3",l:"DALL-E creates image",c:C.teal},{s:"4",l:settings.auto_post&&liStatus?.connected?"Posts to LinkedIn":"Queued for approval",c:C.green}].map((s,i)=>(
              <div key={s.s} style={{display:"flex",gap:8,alignItems:"center",marginBottom:i<3?7:0}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:s.c,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:9,fontWeight:800,color:"#fff"}}>{s.s}</span></div>
                <p style={{margin:0,fontSize:12,color:C.text,fontWeight:600}}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE POST (manual) — wired to backend
// ═══════════════════════════════════════════════════════════════════════════════
function ManualPost({token, liStatus, showToast}) {
  const [content,setContent] = useState("");
  const [imgUrl,setImgUrl]   = useState("");
  const [schedDate,setSD]    = useState("");
  const [schedTime,setST]    = useState("09:00");
  const [mode,setMode]       = useState("now");
  const [done,setDone]       = useState(false);
  const MAX = 3000;

  const handlePost = async () => {
    if(!content.trim()){showToast("Write something first!","error");return;}
    if(!liStatus?.connected){showToast("Connect LinkedIn in Settings first.","error");return;}
    const scheduledAt = mode==="schedule"&&schedDate ? `${schedDate}T${schedTime}:00` : null;
    try {
      await api("POST","/manual/post",{content,image_url:imgUrl||"",scheduled_at:scheduledAt},token);
      setDone(true);
      showToast(mode==="schedule"?"Post scheduled!":"Posted to LinkedIn!");
      setTimeout(()=>{setContent("");setImgUrl("");setSD("");setDone(false);},2000);
    } catch(e) { showToast(e.message,"error"); }
  };

  return (
    <div style={{maxWidth:800}}>
      <div style={{marginBottom:18}}>
        <h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:0}}>Create Post</h1>
        <p style={{color:C.sub,fontSize:14,margin:"4px 0 0"}}>Write, format, and post directly to LinkedIn. Select text then click a format button.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:14}}>
        <div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:12}}>
            <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:C.text}}>✍️ Compose Post</p>
            <FormatToolbar value={content} onChange={setContent} onInsert={txt=>setContent(c=>c+txt)}/>
            <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What do you want to share? Select text then click a style button to format it." rows={9}
              style={{width:"100%",padding:"11px 13px",border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.text,outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.8,resize:"vertical",transition:"border .15s"}}
              onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
              <div style={{flex:1,height:3,background:C.bg,borderRadius:10,overflow:"hidden"}}>
                <div style={{height:"100%",background:content.length>MAX*0.9?C.red:C.blue,borderRadius:10,width:`${Math.min((content.length/MAX)*100,100)}%`,transition:"width .2s"}}/>
              </div>
              <span style={{fontSize:11,color:content.length>MAX*0.9?C.red:C.muted,whiteSpace:"nowrap"}}>{content.length}/{MAX}</span>
            </div>
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
            <h4 style={{margin:"0 0 8px",fontSize:13,fontWeight:700,color:C.text}}>Attach Image (optional)</h4>
            <ImageUploader value={imgUrl} onChange={setImgUrl} compact/>
            {imgUrl&&<div style={{marginTop:8,borderRadius:7,overflow:"hidden",maxHeight:100,position:"relative"}}><img src={imgUrl} alt="" style={{maxWidth:"100%",maxHeight:100,objectFit:"cover",borderRadius:7}} onError={e=>e.target.style.display="none"}/><button onClick={()=>setImgUrl("")} style={{position:"absolute",top:5,right:5,width:20,height:20,borderRadius:"50%",background:"rgba(0,0,0,.6)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={11} color="#fff"/></button></div>}
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{display:"flex",gap:8,marginBottom:mode==="schedule"?12:0}}>
              <button onClick={()=>setMode("now")} style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${mode==="now"?C.blue:C.border}`,background:mode==="now"?C.blueLt:C.white,color:mode==="now"?C.blue:C.sub,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Send size={13}/>Post Now</button>
              <button onClick={()=>setMode("schedule")} style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${mode==="schedule"?C.blue:C.border}`,background:mode==="schedule"?C.blueLt:C.white,color:mode==="schedule"?C.blue:C.sub,fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Calendar size={13}/>Schedule</button>
            </div>
            {mode==="schedule"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginTop:0}}>
              <Field label="Date"><input type="date" value={schedDate} onChange={e=>setSD(e.target.value)} min={new Date().toISOString().split("T")[0]} style={{width:"100%",padding:"8px 9px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></Field>
              <Field label="Time"><input type="time" value={schedTime} onChange={e=>setST(e.target.value)} style={{width:"100%",padding:"8px 9px",border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/></Field>
            </div>}
          </div>

          {!liStatus?.connected&&<div style={{background:C.orangeLt,border:`1px solid ${C.orange}33`,borderRadius:7,padding:"8px 12px",marginBottom:10,fontSize:13,color:C.orange,fontWeight:600}}>⚠ Connect LinkedIn in Settings to enable posting.</div>}
          <Btn full onClick={handlePost} disabled={!content.trim()||done} icon={done?<CheckCircle size={14}/>:mode==="schedule"?<Calendar size={14}/>:<Send size={14}/>}>
            {done?"Done!":mode==="schedule"?"Schedule Post":"Post to LinkedIn Now"}
          </Btn>
        </div>

        {/* Live preview */}
        <div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",position:"sticky",top:80}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.bg,display:"flex",alignItems:"center",gap:7}}>
              <Linkedin size={12} color={C.blue}/><p style={{margin:0,fontSize:12,fontWeight:700,color:C.sub,textTransform:"uppercase",letterSpacing:.8}}>Live Preview</p>
            </div>
            <div style={{padding:14}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,flexShrink:0}}>Y</div>
                <div><p style={{margin:0,fontWeight:700,fontSize:13,color:C.text}}>Your Name</p><p style={{margin:0,fontSize:11,color:C.muted}}>Your Headline • Just now</p></div>
              </div>
              <div style={{fontSize:13,lineHeight:1.75,color:C.text,whiteSpace:"pre-wrap",minHeight:50,marginBottom:8}}>{content||<span style={{color:C.muted}}>Start writing to see preview…</span>}</div>
              {imgUrl&&<div style={{borderRadius:7,overflow:"hidden",marginBottom:8}}><img src={imgUrl} alt="" style={{width:"100%",maxHeight:120,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:8,display:"flex",gap:14}}>
                {[[ThumbsUp,"Like"],[MessageSquare,"Comment"],[Share2,"Repost"]].map(([Icon,l])=><span key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:C.muted}}><Icon size={12}/>{l}</span>)}
              </div>
            </div>
          </div>
          <div style={{background:`linear-gradient(135deg,${C.purpleLt},#fff)`,border:`1px solid ${C.purple}22`,borderRadius:11,padding:13,marginTop:11}}>
            <p style={{margin:"0 0 7px",fontSize:13,fontWeight:700,color:C.purple}}>✨ Format Tips</p>
            {[["Select text → click style","Applies to selection only"],["Click without selection","Applies to entire text"],["List formats","Each line becomes a list item"]].map(([t,d])=><div key={t} style={{marginBottom:6}}><p style={{margin:0,fontSize:12,fontWeight:600,color:C.text}}>{t}</p><p style={{margin:0,fontSize:11,color:C.sub}}>{d}</p></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH HUB — 3 tabs, wired to backend
// ═══════════════════════════════════════════════════════════════════════════════
function ResearchHub({token, liStatus, showToast}) {
  const [tab,setTab]           = useState("chat");
  const [provider,setProvider] = useState("claude");
  const TABS=[{id:"chat",icon:Bot,label:"AI Research Chat"},{id:"auto",icon:Cpu,label:"Auto Account Analysis"},{id:"topics",icon:Lightbulb,label:"Topic Ideas"}];
  return (
    <div>
      <div style={{marginBottom:18}}><h1 style={{fontSize:22,fontWeight:800,color:C.text,margin:0}}>Research Hub</h1><p style={{color:C.sub,fontSize:14,margin:"4px 0 0"}}>Research topics, analyze your account, discover content ideas — powered by real AI.</p></div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <span style={{fontSize:13,fontWeight:700,color:C.text,whiteSpace:"nowrap"}}>AI Provider:</span>
        <div style={{minWidth:200}}><DDrop value={provider} onChange={setProvider} options={AI_PROVIDERS.map(p=>({value:p.id,label:`${p.logo}  ${p.label}`}))}/></div>
      </div>
      <div style={{display:"flex",gap:0,marginBottom:18,background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:5,width:"fit-content"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"none",background:tab===t.id?C.blue:"transparent",color:tab===t.id?"#fff":C.sub,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}><t.icon size={14}/>{t.label}</button>)}
      </div>
      {tab==="chat"  &&<ResearchChat   token={token} provider={provider} showToast={showToast}/>}
      {tab==="auto"  &&<AutoAnalysis   token={token} provider={provider} liStatus={liStatus} showToast={showToast}/>}
      {tab==="topics"&&<TopicIdeas     token={token} provider={provider} showToast={showToast}/>}
    </div>
  );
}

function ResearchChat({token,provider,showToast}) {
  const [msgs,setMsgs]   = useState([{role:"assistant",content:"👋 Hi! I'm your LinkedIn research assistant.\n\nAsk me:\n• Trending topics in AI this week?\n• 10 hook ideas for my niche\n• What makes a viral LinkedIn post?\n• Research angles for SaaS founders"}]);
  const [input,setInput] = useState("");
  const [loading,setL]   = useState(false);
  const [niche,setNiche] = useState("LinkedIn content");
  const bottomRef        = useRef(null);
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),[msgs]);
  const QUICK=["Trending LinkedIn topics this week","Viral hook formulas for thought leaders","10 content ideas for my niche","Best time to post on LinkedIn"];

  const send = async txt => {
    const msg=txt||input.trim();if(!msg||loading)return;setInput("");
    const newMsgs=[...msgs,{role:"user",content:msg}];setMsgs(newMsgs);setL(true);
    try {
      const res = await api("POST","/research/chat",{messages:newMsgs.slice(-6),niche,provider},token);
      setMsgs(m=>[...m,{role:"assistant",content:res.reply}]);
    } catch(e){showToast(e.message||"AI error.","error");}
    setL(false);
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 250px",gap:14}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,display:"flex",flexDirection:"column",height:530}}>
        <div style={{padding:"9px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:9}}>
          <Target size={13} color={C.blue}/>
          <span style={{fontSize:12,color:C.sub,fontWeight:600,flexShrink:0}}>Niche:</span>
          <input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. SaaS, AI, Marketing…" style={{flex:1,border:"none",outline:"none",fontSize:13,color:C.text,background:"transparent",fontFamily:"inherit"}}/>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:11}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:m.role==="user"?`linear-gradient(135deg,${C.blue},${C.blueMd})`:C.purpleLt,display:"flex",alignItems:"center",justifyContent:"center",color:m.role==="user"?"#fff":C.purple,fontSize:11,fontWeight:700}}>{m.role==="user"?"Y":"🤖"}</div>
              <div style={{maxWidth:"80%",padding:"10px 13px",borderRadius:m.role==="user"?"11px 11px 4px 11px":"11px 11px 11px 4px",background:m.role==="user"?C.blue:C.bg,color:m.role==="user"?"#fff":C.text,fontSize:14,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:8}}><div style={{width:28,height:28,borderRadius:"50%",background:C.purpleLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>🤖</div><div style={{padding:"10px 13px",borderRadius:"11px 11px 11px 4px",background:C.bg,display:"flex",gap:5,alignItems:"center"}}><style>{`@keyframes blink{0%,100%{opacity:.3}50%{opacity:1}}`}</style>{[0,1,2].map(d=><div key={d} style={{width:5,height:5,borderRadius:"50%",background:C.muted,animation:`blink 1s ${d*.2}s infinite`}}/>)}</div></div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"10px 13px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about LinkedIn topics, trends, hooks…" style={{flex:1,padding:"8px 13px",border:`1.5px solid ${C.border}`,borderRadius:20,fontSize:14,color:C.text,outline:"none",fontFamily:"inherit",transition:"border .15s"}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:36,height:36,borderRadius:"50%",background:input.trim()&&!loading?C.blue:"#B0C7E8",border:"none",cursor:input.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{loading?<Spinner size={14}/>:<SendHorizonal size={14} color="#fff"/>}</button>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:13}}>
          <p style={{margin:"0 0 9px",fontSize:13,fontWeight:700,color:C.text}}>⚡ Quick Prompts</p>
          {QUICK.map(q=><button key={q} onClick={()=>send(q)} style={{width:"100%",textAlign:"left",padding:"7px 8px",borderRadius:7,border:`1px solid ${C.border}`,background:C.bg,cursor:"pointer",marginBottom:5,fontSize:12,color:C.sub,lineHeight:1.4,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background=C.blueLt;e.currentTarget.style.color=C.blue;}} onMouseLeave={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.sub;}}>{q}</button>)}
        </div>
      </div>
    </div>
  );
}

function AutoAnalysis({token,provider,liStatus,showToast}) {
  const [analyzing,setA]=useState(false);const [report,setR]=useState(null);
  const run=async()=>{if(!liStatus?.connected){showToast("Connect LinkedIn first in Settings.","error");return;}setA(true);setR(null);
    try{const res=await api("POST","/research/analyze",{provider},token);setR(res.report);showToast("Analysis complete!");}
    catch(e){showToast(e.message,"error");}setA(false);};
  return(
    <div>
      <div style={{background:liStatus?.connected?C.greenLt:C.orangeLt,border:`1px solid ${liStatus?.connected?C.green:C.orange}33`,borderRadius:11,padding:"13px 16px",marginBottom:13,display:"flex",alignItems:"center",gap:11}}>
        <Linkedin size={24} color={liStatus?.connected?C.green:C.orange}/>
        <div style={{flex:1}}><p style={{margin:0,fontWeight:700,fontSize:14,color:C.text}}>{liStatus?.connected?`Connected: ${liStatus.name||"Your Profile"}`:"LinkedIn Not Connected"}</p><p style={{margin:"2px 0 0",fontSize:12,color:C.sub}}>{liStatus?.connected?"Analysis uses your actual posted content.":"Connect LinkedIn in Settings first."}</p></div>
      </div>
      <Btn full onClick={run} disabled={analyzing||!liStatus?.connected} icon={analyzing?<Spinner size={15}/>:<BarChart size={14}/>}>{analyzing?"Analyzing…":"Run Full AI Analysis"}</Btn>
      {analyzing&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:18,marginTop:12}}><Shimmer rows={8}/></div>}
      {report&&!analyzing&&<div style={{background:C.card,border:`1.5px solid ${C.blue}`,borderRadius:11,padding:20,marginTop:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>AI Analysis Report</h3><Btn variant="ghost" size="sm" icon={<Copy size={11}/>} onClick={()=>{navigator.clipboard?.writeText(report);showToast("Copied!");}}>Copy</Btn></div><div style={{fontSize:14,color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{report}</div></div>}
    </div>
  );
}

function TopicIdeas({token,provider,showToast}) {
  const [niche,setNiche]=useState("");const [audience,setAud]=useState("");const [style,setStyle]=useState("mixed");const [loading,setL]=useState(false);const [ideas,setIdeas]=useState([]);
  const gen=async()=>{if(!niche.trim()){showToast("Enter your niche.","error");return;}setL(true);setIdeas([]);
    try{const res=await api("POST","/research/topic-ideas",{niche,audience:audience||"LinkedIn professionals",style,provider},token);
    const blocks=res.raw.split(/\d+\.\s+/).filter(Boolean);setIdeas(blocks.map(b=>({title:b.match(/TITLE:\s*(.+)/i)?.[1]?.trim()||b.split("\n")[0].trim(),angle:b.match(/ANGLE:\s*(.+)/i)?.[1]?.trim()||"",why:b.match(/WHY:\s*(.+)/i)?.[1]?.trim()||"",format:b.match(/FORMAT:\s*(.+)/i)?.[1]?.trim()||"Post"})).filter(x=>x.title.length>3).slice(0,12));}
    catch(e){showToast(e.message,"error");}setL(false);};
  return(
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:11,alignItems:"flex-end"}}>
          <Field label="Your Niche *"><TInput value={niche} onChange={setNiche} placeholder="e.g. SaaS, Marketing, AI"/></Field>
          <Field label="Target Audience"><TInput value={audience} onChange={setAud} placeholder="e.g. Startup founders"/></Field>
          <Field label="Style"><DDrop value={style} onChange={setStyle} options={[{value:"mixed",label:"Mixed"},{value:"educational",label:"Educational"},{value:"story",label:"Personal Stories"},{value:"opinion",label:"Hot Takes"}]}/></Field>
          <div style={{paddingBottom:14}}><Btn onClick={gen} disabled={loading||!niche.trim()} icon={loading?<Spinner size={15}/>:<Lightbulb size={14}/>}>{loading?"Generating…":"Get 12 Ideas"}</Btn></div>
        </div>
      </div>
      {loading&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20}}><Shimmer rows={8}/></div>}
      {!loading&&ideas.length===0&&<div style={{background:C.card,border:`1.5px dashed ${C.border}`,borderRadius:11,padding:"40px 28px",textAlign:"center"}}><Lightbulb size={36} color={C.muted} style={{marginBottom:12}}/><p style={{fontSize:15,fontWeight:700,color:C.text,margin:"0 0 4px"}}>Enter your niche to generate ideas</p><p style={{fontSize:13,color:C.muted,margin:0}}>AI generates 12 specific, high-engagement LinkedIn post ideas.</p></div>}
      {ideas.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {ideas.map((idea,i)=><div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:14,transition:"box-shadow .15s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
          <span style={{fontSize:11,fontWeight:700,color:C.muted}}>#{i+1}</span>
          <p style={{margin:"5px 0 5px",fontSize:13,fontWeight:700,color:C.text,lineHeight:1.4}}>{idea.title}</p>
          {idea.angle&&<p style={{margin:"0 0 4px",fontSize:12,color:C.sub,lineHeight:1.4}}>{idea.angle}</p>}
          {idea.why&&<p style={{margin:"0 0 10px",fontSize:11,color:C.green,fontWeight:600}}>💡 {idea.why}</p>}
          {idea.format&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:9,background:C.blueLt,color:C.blue}}>{idea.format.split("/")[0].trim()}</span>}
        </div>)}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS — real data from backend
// ═══════════════════════════════════════════════════════════════════════════════
function Analytics({token}) {
  const [stats,setStats]=useState(null);const [loading,setL]=useState(true);
  useEffect(()=>{api("GET","/analytics/summary",null,token).then(setStats).catch(()=>{}).finally(()=>setL(false));},[token]);
  if(loading) return <div style={{padding:24}}><Shimmer rows={8}/></div>;
  return(
    <div>
      <h1 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Analytics</h1>
      <p style={{color:C.sub,fontSize:14,marginBottom:18}}>Real data from your posted content.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[{l:"Posts Published",v:stats?.total_posts??0,icon:FileText,c:C.blue,n:"All time"},{l:"Total Likes",v:stats?.total_likes??0,icon:ThumbsUp,c:C.green,n:"Across all posts"},{l:"Total Impressions",v:stats?.total_impressions??0,icon:Eye,c:C.orange,n:"Tracked in-app"},{l:"Last 30 Days",v:stats?.posts_last_30_days??0,icon:TrendingUp,c:C.purple,n:"Posts published"}].map(s=>(
          <div key={s.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:17}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><p style={{margin:0,fontSize:12,color:C.sub,fontWeight:600}}>{s.l}</p><s.icon size={14} color={s.c}/></div>
            <p style={{margin:0,fontSize:23,fontWeight:800,color:C.text}}>{s.v.toLocaleString()}</p>
            <p style={{margin:"3px 0 0",fontSize:12,color:C.muted}}>{s.n}</p>
          </div>
        ))}
      </div>
      {stats?.recent_posts?.length>0&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20}}>
          <h3 style={{margin:"0 0 14px",fontSize:15,fontWeight:700,color:C.text}}>Recent Post Performance</h3>
          {stats.recent_posts.map((p,i)=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,fontWeight:700,color:C.muted,minWidth:22}}>#{i+1}</span>
              <p style={{flex:1,margin:0,fontSize:13,color:C.text,display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{p.content}</p>
              <div style={{display:"flex",gap:14,fontSize:12,flexShrink:0}}>
                <span style={{color:C.text,fontWeight:600}}><ThumbsUp size={10} style={{verticalAlign:"middle",marginRight:3}}/>{p.likes}</span>
                <span style={{color:C.muted}}><Eye size={10} style={{verticalAlign:"middle",marginRight:3}}/>{p.impressions.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {(!stats?.recent_posts||stats.recent_posts.length===0)&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"40px 24px",textAlign:"center"}}><BarChart size={36} color={C.muted} style={{marginBottom:12}}/><p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 5px"}}>No posted content yet</p><p style={{fontSize:13,color:C.muted,margin:0}}>Post some content first, then check back here for analytics.</p></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS — wired to backend
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPage({token, liStatus, onLiStatusChange, showToast, onLogout}) {
  const [settings,setSettings] = useState({openai_key_set:false,gemini_key_set:false,default_ai:"claude"});
  const [openaiKey,setOK]      = useState("");
  const [geminiKey,setGK]      = useState("");
  const [liLoading,setLL]      = useState(false);
  const [savingKeys,setSK]      = useState(false);

  useEffect(()=>{api("GET","/settings",null,token).then(setSettings).catch(()=>{});},[token]);

  const saveKeys = async () => {
    setSK(true);
    try {
      const body = {};
      if(openaiKey) body.openai_key = openaiKey;
      if(geminiKey) body.gemini_key = geminiKey;
      await api("PATCH","/settings/api-keys",body,token);
      setSettings(s=>({...s,openai_key_set:bool(openaiKey)||s.openai_key_set,gemini_key_set:bool(geminiKey)||s.gemini_key_set}));
      showToast("API keys saved!");
      setOK(""); setGK("");
    } catch(e){showToast(e.message,"error");}
    setSK(false);
  };

  const connectLinkedIn = async () => {
    setLL(true);
    try {
      const res = await api("GET","/linkedin/connect",null,token);
      window.open(res.auth_url,"_blank","width=600,height=700,scrollbars=yes");
      showToast("Complete the LinkedIn login in the popup window. Refresh this page after.");
      setTimeout(async ()=>{
        try {
          const status = await api("GET","/linkedin/status",null,token);
          onLiStatusChange(status);
          if(status.connected) showToast("LinkedIn connected!");
        } catch{}
      }, 5000);
    } catch(e){showToast(e.message,"error");}
    setLL(false);
  };

  const disconnectLinkedIn = async () => {
    try {
      await api("POST","/linkedin/disconnect",null,token);
      onLiStatusChange({connected:false});
      showToast("LinkedIn disconnected.");
    } catch(e){showToast(e.message,"error");}
  };

  const bool = v => Boolean(v);

  const Section=({title,children})=><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:20,marginBottom:12}}><h3 style={{margin:"0 0 15px",fontSize:15,fontWeight:700,color:C.text,paddingBottom:11,borderBottom:`1px solid ${C.border}`}}>{title}</h3>{children}</div>;

  return(
    <div style={{maxWidth:640}}>
      <h1 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Settings</h1>
      <p style={{color:C.sub,fontSize:14,marginBottom:18}}>Manage LinkedIn connection, AI keys, and account.</p>

      <Section title="🔗 LinkedIn Account">
        {liStatus?.connected ? (
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.greenLt,border:`1px solid ${C.green}33`,borderRadius:9}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:700}}>
              {liStatus.name?.[0]?.toUpperCase()||"Y"}
            </div>
            <div style={{flex:1}}>
              <p style={{margin:0,fontWeight:700,fontSize:14,color:C.text}}>{liStatus.name||"Your LinkedIn Profile"}</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:C.green,fontWeight:600}}><CheckCircle size={10} style={{verticalAlign:"middle",marginRight:3}}/>Connected & ready to post</p>
            </div>
            <Btn variant="danger" size="sm" icon={<LogOut size={11}/>} onClick={disconnectLinkedIn}>Disconnect</Btn>
          </div>
        ) : (
          <>
            <p style={{fontSize:13,color:C.sub,marginBottom:10}}>LinkedIn App must have these Products approved: <strong>Sign In with LinkedIn using OpenID Connect</strong> + <strong>Share on LinkedIn</strong>.</p>
            <div style={{background:C.blueLt,borderRadius:8,padding:"9px 12px",marginBottom:12,fontSize:12,color:C.blueDk}}>Redirect URL to add in your LinkedIn App: <code style={{background:"rgba(0,0,0,.07)",padding:"1px 5px",borderRadius:4}}>http://localhost:8000/api/linkedin/callback</code></div>
            <Btn onClick={connectLinkedIn} disabled={liLoading} icon={liLoading?<Spinner size={14}/>:<Linkedin size={13}/>}>Connect LinkedIn Account</Btn>
          </>
        )}
      </Section>

      <Section title="🤖 AI API Keys">
        <p style={{fontSize:13,color:C.sub,marginBottom:12}}>Claude works out-of-the-box (server key). Add OpenAI for GPT-4o text + DALL-E 3 images, or Gemini for Google AI.</p>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:C.greenLt,borderRadius:7,marginBottom:12,fontSize:12,color:C.green}}><CheckCircle size={12}/>Claude (Anthropic) — configured via server. Ready to use.</div>
        <Field label="🟢 OpenAI API Key" hint={settings.openai_key_set?"✅ Key is set — enter a new one to update it":"Get from platform.openai.com/api-keys"}>
          <TInput value={openaiKey} onChange={setOK} type="password" placeholder={settings.openai_key_set?"sk-proj-…(already set, enter to update)":"sk-proj-…"}/>
        </Field>
        <Field label="🔵 Gemini API Key" hint={settings.gemini_key_set?"✅ Key is set — enter a new one to update it":"Get from aistudio.google.com"}>
          <TInput value={geminiKey} onChange={setGK} type="password" placeholder={settings.gemini_key_set?"AIza…(already set, enter to update)":"AIza…"}/>
        </Field>
        <div style={{background:C.orangeLt,border:`1px solid ${C.orange}33`,borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:12,color:C.orange}}>🔒 Keys are stored securely on the server — not in the browser.</div>
        <Btn onClick={saveKeys} disabled={savingKeys||(!openaiKey&&!geminiKey)} icon={savingKeys?<Spinner size={13}/>:<Save size={12}/>}>Save API Keys</Btn>
      </Section>

      <Section title="👤 Account">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
          <div><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Sign Out</p><p style={{margin:"2px 0 0",fontSize:12,color:C.muted}}>You'll need to sign in again to use the app.</p></div>
          <Btn variant="ghost" icon={<LogOut size={13}/>} onClick={onLogout}>Sign Out</Btn>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════════
const NAV = [
  {icon:LayoutDashboard, label:"Dashboard",  id:"dashboard"},
  {icon:Flame,           label:"Automation", id:"automation"},
  {icon:PenLine,         label:"Create Post",id:"create"},
  {icon:BookOpen,        label:"Research",   id:"research"},
  {icon:Sparkles,        label:"Generate",   id:"generate"},
  {icon:FileText,        label:"Posts",      id:"posts"},
  {icon:BarChart2,       label:"Analytics",  id:"analytics"},
  {icon:Settings,        label:"Settings",   id:"settings"},
];

const PAGE_LABELS = {dashboard:"Dashboard",automation:"Automation Pipeline",create:"Create Post",research:"Research Hub",generate:"AI Generate",posts:"Posts & Approval",analytics:"Analytics",settings:"Settings"};

export default function App() {
  const [token,    setToken]    = useState(()=>sessionStorage.getItem("lp_token")||null);
  const [user,     setUser]     = useState(()=>{ try{ return JSON.parse(sessionStorage.getItem("lp_user")||"null"); }catch{return null;} });
  const [liStatus, setLiStatus] = useState({connected:false});
  const [page,     setPage]     = useState("dashboard");
  const [toast,    setToast]    = useState(null);
  const [pending,  setPending]  = useState(0);

  const showToast = useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3500); },[]);

  const handleLogin = (tok, usr) => {
    setToken(tok); setUser(usr);
    sessionStorage.setItem("lp_token",tok);
    sessionStorage.setItem("lp_user",JSON.stringify(usr));
  };

  const handleLogout = () => {
    setToken(null); setUser(null);
    sessionStorage.removeItem("lp_token");
    sessionStorage.removeItem("lp_user");
    setPage("dashboard");
  };

  // Load LinkedIn status + pending post count on login
  useEffect(()=>{
    if(!token) return;
    api("GET","/linkedin/status",null,token).then(setLiStatus).catch(()=>{});
    api("GET","/posts?status=pending",null,token).then(posts=>setPending(posts.length)).catch(()=>{});
  },[token,page]);

  if(!token) return <AuthScreen onLogin={handleLogin}/>;

  const pageProps = {token, liStatus, showToast, onNav:setPage};

  const pages = {
    dashboard:  <Dashboard  {...pageProps}/>,
    automation: <AutomationPipeline token={token} liStatus={liStatus} showToast={showToast}/>,
    create:     <ManualPost  token={token} liStatus={liStatus} showToast={showToast}/>,
    research:   <ResearchHub token={token} liStatus={liStatus} showToast={showToast}/>,
    generate:   <Generate    token={token} showToast={showToast} onNav={setPage}/>,
    posts:      <Posts       token={token} showToast={showToast} onNav={setPage}/>,
    analytics:  <Analytics   token={token}/>,
    settings:   <SettingsPage token={token} liStatus={liStatus} onLiStatusChange={setLiStatus} showToast={showToast} onLogout={handleLogout}/>,
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif"}}>
      {/* SIDEBAR */}
      <aside style={{width:215,background:C.white,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100}}>
        <div style={{padding:"15px 17px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:33,height:33,background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}><Linkedin size={17} color="#fff"/></div>
            <div><p style={{margin:0,fontSize:14,fontWeight:800,color:C.text,letterSpacing:-.4}}>LinkedPilot</p><p style={{margin:0,fontSize:9,color:C.blue,fontWeight:800,letterSpacing:1.5}}>AI AUTOPILOT</p></div>
          </div>
        </div>
        <div style={{margin:"8px 10px",padding:"7px 10px",borderRadius:7,background:liStatus.connected?C.greenLt:C.orangeLt,display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:liStatus.connected?C.green:C.orange}}/>
          <span style={{fontSize:11,fontWeight:600,color:liStatus.connected?C.green:C.orange}}>{liStatus.connected?`${liStatus.name||"LinkedIn"} Connected`:"Not Connected"}</span>
        </div>
        <nav style={{flex:1,padding:"3px 8px",overflowY:"auto"}}>
          {NAV.map(({icon:Icon,label,id})=>(
            <button key={id} onClick={()=>setPage(id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"none",textAlign:"left",cursor:"pointer",marginBottom:1,background:page===id?C.blueLt:"transparent",color:page===id?C.blue:C.sub,fontSize:13,fontWeight:page===id?700:500,transition:"background .15s"}}>
              <Icon size={15}/>{label}
              {id==="posts"&&pending>0&&<span style={{marginLeft:"auto",background:C.orange,color:"#fff",borderRadius:9,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{pending}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"11px 13px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.blue},${C.blueMd})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:700}}>
              {user?.name?.[0]?.toUpperCase()||"Y"}
            </div>
            <div style={{minWidth:0}}>
              <p style={{margin:0,fontSize:12,fontWeight:700,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name||"Your Name"}</p>
              <p style={{margin:0,fontSize:10,color:C.muted}}>{user?.email||""}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.muted,display:"flex",flexShrink:0}}><LogOut size={14}/></button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{marginLeft:215,flex:1,display:"flex",flexDirection:"column"}}>
        <header style={{background:C.white,borderBottom:`1px solid ${C.border}`,height:52,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:13}}>
            <span style={{color:C.muted}}>LinkedPilot</span><ChevronRight size={12} color={C.muted}/>
            <span style={{color:C.text,fontWeight:700}}>{PAGE_LABELS[page]||page}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button style={{position:"relative",background:C.blueLt,border:"none",borderRadius:7,padding:7,cursor:"pointer",display:"flex"}}>
              <Bell size={15} color={C.blue}/>
              {pending>0&&<span style={{position:"absolute",top:3,right:3,width:6,height:6,background:C.red,borderRadius:"50%",border:`2px solid ${C.white}`}}/>}
            </button>
            <Btn onClick={()=>setPage("automation")} variant="orange" icon={<Flame size={12}/>} size="sm">Auto-Pilot</Btn>
            <Btn onClick={()=>setPage("posts")} icon={<CheckSquare size={12}/>} size="sm">
              {pending>0?`Review ${pending} Post${pending!==1?"s":""}…`:"Posts"}
            </Btn>
          </div>
        </header>
        <main style={{flex:1,padding:24}}>{pages[page]}</main>
      </div>

      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
