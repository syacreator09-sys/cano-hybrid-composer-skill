import { escapeHtml, jsLiteral } from './utils.js';
import { normalizeWorkflowContent } from './content.js';

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).map((part)=>part[0]).join('').slice(0,3).toUpperCase();
}

function nodeHtml(node,index,count) {
  const width=112;
  const left=count===1?256:24+index*((576-width)/(count-1));
  const brand=node.brand?String(node.brand):'';
  const icon=brand.toLowerCase()==='whatsapp'?'WA':brand.toLowerCase()==='n8n'?'n8n':initials(node.name);
  return `<div class="node" id="node${index}" style="left:${left.toFixed(1)}px"><div class="ico">${escapeHtml(icon)}</div><div class="name">${escapeHtml(node.name)}</div><div class="meta">${escapeHtml(node.meta??'')}</div></div>`;
}

function edgeHtml(index,count) {
  if(index>=count-1) return '';
  const width=112;
  const x1=24+index*((576-width)/(count-1))+width;
  const x2=24+(index+1)*((576-width)/(count-1));
  return `<div class="edge" id="edge${index}" style="left:${x1.toFixed(1)}px;width:${Math.max(10,x2-x1).toFixed(1)}px"></div>`;
}

export function buildWorkflowHtml({plan,manifest}) {
  const c=normalizeWorkflowContent(manifest);
  const nodes=c.nodes.map((node,i)=>nodeHtml(node,i,c.nodes.length)).join('');
  const edges=c.nodes.map((_,i)=>edgeHtml(i,c.nodes.length)).join('');
  const phases=c.phases.map(jsLiteral).join(',');
  const captions=c.captions.map(jsLiteral).join(',');
  const nodeCount=c.nodes.length;
  const html=`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(plan.projectId)} · CANO Workflow</title>
<style>
:root{--ink:#101820;--muted:#69757e;--gold:#d3a13b;--orange:#ff6d3b;--teal:#17a589;--green:#25b67a}
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#111;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Arial,sans-serif}
#stage{position:relative;width:720px;height:1280px;overflow:hidden;color:var(--ink);background:radial-gradient(circle at 80% 12%,rgba(240,201,108,.2),transparent 23%),linear-gradient(180deg,#fbf8f1,#f4efe5)}
.safe{position:absolute;left:48px;right:48px}.kicker{top:68px;font-size:15px;font-weight:850;letter-spacing:.17em;color:#8b6a25}.title{top:104px;font-size:57px;line-height:.97;letter-spacing:-.05em;font-weight:860}.accent{color:var(--orange)}.sub{top:230px;font-size:21px;color:var(--muted);max-width:590px;line-height:1.3}.phase{position:absolute;left:48px;top:287px;background:#101820;color:#fff;border-radius:99px;padding:10px 14px;font-size:13px;font-weight:850;letter-spacing:.11em;z-index:20}
.flow{position:absolute;left:48px;top:360px;width:624px;height:390px;border-radius:32px;background:rgba(255,255,255,.93);border:1px solid rgba(20,28,35,.07);box-shadow:0 24px 64px rgba(35,40,42,.1);overflow:hidden}
.flowLabel{position:absolute;left:24px;top:24px;font-size:12px;letter-spacing:.13em;font-weight:850;color:#8b6a25}.node{position:absolute;top:126px;width:112px;height:118px;border-radius:18px;background:#fff;border:1px solid #e2e5e8;box-shadow:0 10px 25px rgba(25,33,38,.08);padding:13px;text-align:center;opacity:0}.ico{width:38px;height:38px;border-radius:12px;background:#f7efe1;margin:0 auto 8px;display:grid;place-items:center;font-size:12px;font-weight:900;color:#9a6422}.name{font-size:13px;font-weight:850}.meta{font-size:10px;color:#89929a;margin-top:5px}.edge{position:absolute;top:184px;height:4px;background:#d8d3ca;border-radius:99px;opacity:0}
.extract{position:absolute;left:70px;right:70px;top:790px;display:grid;grid-template-columns:1fr 1fr;gap:12px;opacity:0}.pill{background:#fff;border:1px solid #e7e1d7;border-radius:16px;padding:14px 15px;box-shadow:0 10px 24px rgba(30,35,38,.05)}.pill b{display:block;font-size:10px;letter-spacing:.1em;color:#0f766e;margin-bottom:4px}.pill span{font-size:15px;font-weight:800}
.result{position:absolute;left:60px;top:380px;width:600px;padding:34px;border-radius:30px;background:#fff;border:1px solid #e3e5e7;box-shadow:0 26px 64px rgba(38,42,44,.13);opacity:0}.check{width:66px;height:66px;border-radius:50%;background:#25b67a;color:#fff;display:grid;place-items:center;font-size:36px;font-weight:900;margin-bottom:18px}.result h2{margin:0;font-size:42px;letter-spacing:-.04em}.status{margin-top:12px;display:inline-block;padding:9px 12px;border-radius:99px;background:#eaf8f3;color:#0f766e;font-weight:850;font-size:12px;letter-spacing:.08em}.next{margin-top:24px;padding-top:18px;border-top:1px solid #ece7de;display:flex;justify-content:space-between;font-size:14px}.next b{color:#0f766e}
.caption{position:absolute;left:48px;right:48px;bottom:58px}.capRow{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:13px}.capText{font-size:20px;font-weight:820}.metaCap{font-size:11px;letter-spacing:.12em;color:#8b6a25;font-weight:800}.progress{height:6px;background:#ddd5c7;border-radius:99px;overflow:hidden}.progress span{display:block;height:100%;background:var(--orange);width:0}
</style></head><body><div id="stage">
<div class="safe kicker">${escapeHtml(c.kicker)}</div>
<div class="safe title">${escapeHtml(c.titleLine1)}<br><span class="accent">${escapeHtml(c.titleAccent)}</span></div>
<div class="safe sub">${escapeHtml(c.subtitle)}</div>
<div class="phase" id="phase">${escapeHtml(c.phases[0])}</div>
<div class="flow" id="flow"><div class="flowLabel">FLUJO AUTOMÁTICO</div>${edges}${nodes}</div>
<div class="extract" id="extract"><div class="pill"><b>NOMBRE</b><span>${escapeHtml(c.extraction.name)}</span></div><div class="pill"><b>INTERÉS</b><span>${escapeHtml(c.extraction.interest)}</span></div><div class="pill"><b>PLAZO</b><span>${escapeHtml(c.extraction.timeline)}</span></div><div class="pill"><b>TEMPERATURA</b><span>${escapeHtml(c.extraction.temperature)}</span></div></div>
<div class="result" id="result"><div class="check">✓</div><h2>${escapeHtml(c.result.title)}</h2><div class="status">${escapeHtml(c.result.status)}</div><div class="next"><span>Próxima acción</span><b>${escapeHtml(c.result.nextAction)}</b></div></div>
<div class="caption"><div class="capRow"><div class="capText" id="capText">${escapeHtml(c.captions[0])}</div><div class="metaCap">WORKFLOW · MODE BUILDER V1</div></div><div class="progress"><span id="prog"></span></div></div>
</div>
<script>
const FPS=${Number(plan.fps)},DUR=${Number(plan.durationSeconds)},BASE_DUR=12;
const phases=[${phases}],captions=[${captions}],N=${nodeCount};
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),sm=x=>x<=0?0:x>=1?1:x*x*(3-2*x),pr=(t,a,b)=>clamp((t-a)/(b-a));
function life(t,a,b,fi=.14,fo=.14){const x=pr(t,a,b);if(x<=0||x>=1)return 0;let v=1;if(x<fi)v=sm(x/fi);if(x>1-fo)v=Math.min(v,sm((1-x)/fo));return v}
function renderAt(frame){const rt=frame/FPS,t=rt*(BASE_DUR/DUR),g=clamp(rt/DUR),phase=t<3?0:t<6?1:t<9?2:3;
 $('phase').textContent=phases[phase];$('capText').textContent=captions[phase];$('prog').style.width=(100*g)+'%';
 const flow=life(t,.7,9.2,.12,.16);$('flow').style.opacity=flow.toFixed(3);$('flow').style.transform='translateY('+(14*(1-flow)-3*pr(t,.7,9.2))+'px) scale('+(0.98+0.02*flow)+')';
 for(let i=0;i<N;i++){const q=sm(pr(t,2.8+i*.42,3.8+i*.42));const el=$('node'+i);el.style.opacity=(flow*q).toFixed(3);el.style.transform='translateY('+(10*(1-q))+'px) scale('+(.94+.06*q)+')';if(i<N-1){const e=$('edge'+i);e.style.opacity=sm(pr(t,3.2+i*.42,4.1+i*.42)).toFixed(3)}}
 const ex=life(t,6.0,9.15,.12,.15);$('extract').style.opacity=ex.toFixed(3);$('extract').style.transform='translateY('+(18*(1-ex)-4*pr(t,6,9.15))+'px)';
 const r=life(t,8.85,12.2,.12,.02);$('result').style.opacity=r.toFixed(3);$('result').style.transform='translateY('+(28*(1-r)-8*pr(t,8.85,12.2))+'px) scale('+(0.95+0.05*r)+')';
 return true}
window.renderAt=renderAt;window.audit=()=>['phase','flow','extract','result','caption'].map(id=>{const e=$(id)||document.querySelector('.'+id),r=e.getBoundingClientRect(),o=parseFloat(getComputedStyle(e).opacity)||0;return{id,opacity:o,x:r.x,y:r.y,w:r.width,h:r.height}});renderAt(0);
</script></body></html>`;
  return {html,content:c,report:{mode:'workflow',baseline:'hybrid-tutorial-v2.2 architecture',reusedGeneratedVisuals:0,nodeCount}};
}
