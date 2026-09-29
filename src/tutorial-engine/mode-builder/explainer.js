import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml, jsLiteral, replaceRequired, replaceRegexRequired } from './utils.js';
import { normalizeExplainerContent } from './content.js';

function applyV22(html, css, renderSource) {
  html=html.replaceAll('CANO Hybrid Tutorial V2.1','CANO Hybrid Tutorial V2.2');
  html=html.replaceAll('HYBRID TUTORIAL V2.1','HYBRID TUTORIAL V2.2');
  html=replaceRequired(html,'</style></head>',css+'\n</style></head>','explainer V2.2 css');
  const anchor='</svg>\n\n<div class="heroCard"';
  const inject='</svg>\n<div class="motionAura" id="auraAI"></div>\n<div class="motionAura" id="auraAction"></div>\n<div id="handoffDot"></div>\n<div id="aiOrbitDot"></div>\n<div id="actionPulseDot"></div>\n<div id="confirmPulseDot"></div>\n\n<div class="heroCard"';
  html=replaceRequired(html,anchor,inject,'explainer V2.2 motion nodes');

  const oldE='const $=id=>document.getElementById(id),E={kicker:$("kicker"),title:$("title"),sub:$("sub"),phase:$("phase"),hero:$("hero"),bubble:$("bubble"),pulse:$("pulse"),p1:$("p1"),ai:$("ai"),aiRing:$("aiRing"),aiTag:$("aiTag"),extract:$("extract"),hub:$("hub"),p2:$("p2"),p3:$("p3"),crm:$("crm"),cal:$("cal"),crmStatus:$("crmStatus"),selected:$("selected"),confirm:$("confirm"),caption:$("caption"),capText:$("capText"),prog:$("prog")};';
  const newE='const $=id=>document.getElementById(id),E={stage:$("stage"),kicker:$("kicker"),title:$("title"),sub:$("sub"),phase:$("phase"),hero:$("hero"),bubble:$("bubble"),pulse:$("pulse"),p1:$("p1"),ai:$("ai"),aiRing:$("aiRing"),aiTag:$("aiTag"),extract:$("extract"),hub:$("hub"),p2:$("p2"),p3:$("p3"),crm:$("crm"),cal:$("cal"),crmStatus:$("crmStatus"),selected:$("selected"),confirm:$("confirm"),caption:$("caption"),capText:$("capText"),prog:$("prog"),auraAI:$("auraAI"),auraAction:$("auraAction"),handoffDot:$("handoffDot"),aiOrbitDot:$("aiOrbitDot"),actionPulseDot:$("actionPulseDot"),confirmPulseDot:$("confirmPulseDot")};';
  html=replaceRequired(html,oldE,newE,'explainer V2.2 element map');

  const start=html.indexOf('function renderAt(frame){');
  const end=html.indexOf('window.renderAt=renderAt;',start);
  if(start<0||end<0) throw new Error('builder anchor not found: explainer renderAt');
  return html.slice(0,start)+renderSource.trimEnd()+'\n'+html.slice(end);
}

function replaceClassText(html,className,value,label) {
  const regex=new RegExp('(<div class="'+className+'">)([^<]*)(</div>)');
  return replaceRegexRequired(html,regex,'$1'+escapeHtml(value)+'$3',label);
}

function replaceInfoValue(html,label,value) {
  const regex=new RegExp('(<div class="info"><small>'+label+'</small><b>)([^<]*)(</b></div>)');
  return replaceRegexRequired(html,regex,'$1'+escapeHtml(value)+'$3','explainer result '+label);
}

function applyContent(html,content,plan) {
  html=replaceRequired(html,'<title>CANO Hybrid Tutorial V2.2</title>',`<title>${escapeHtml(plan.projectId)} · CANO Explainer</title>`,'explainer title tag');
  html=replaceRequired(html,'CANO DIGITAL · AUTOMATIZACIÓN',escapeHtml(content.kicker),'explainer kicker');
  html=replaceRequired(html,'De un mensaje a una<br><span class="accent">cita confirmada</span>',`${escapeHtml(content.titleLine1)}<br><span class="accent">${escapeHtml(content.titleAccent)}</span>`,'explainer headline');
  html=replaceRequired(html,'Un agente de IA convierte conversación en una acción real.',escapeHtml(content.subtitle),'explainer subtitle');

  html=replaceClassText(html,'eyebrow',content.message.eyebrow,'explainer message eyebrow');
  html=replaceClassText(html,'copy',content.message.copy,'explainer message copy');
  html=replaceClassText(html,'meta',content.message.meta,'explainer message meta');

  html=replaceRequired(html,'<b>INTENCIÓN</b>Reservar',`<b>INTENCIÓN</b>${escapeHtml(content.extraction.intent)}`,'explainer extraction intent');
  html=replaceRequired(html,'<b>FECHA</b>Mañana',`<b>FECHA</b>${escapeHtml(content.extraction.date)}`,'explainer extraction date');
  html=replaceRequired(html,'<b>HORA</b>11:00',`<b>HORA</b>${escapeHtml(content.extraction.time)}`,'explainer extraction time');

  html=replaceRegexRequired(html,/<div class="confirm" id="confirm"><div class="check">✓<\/div><h2>[^<]*<\/h2>/,`<div class="confirm" id="confirm"><div class="check">✓</div><h2>${escapeHtml(content.result.title)}</h2>`,'explainer result title');
  html=replaceRegexRequired(html,/(<div class="confirm" id="confirm">[\s\S]*?<p>)([^<]*)(<\/p>)/,'$1'+escapeHtml(content.result.body)+'$3','explainer result body');
  html=replaceInfoValue(html,'FECHA',content.result.date);
  html=replaceInfoValue(html,'HORA',content.result.time);
  html=replaceInfoValue(html,'CANAL',content.result.channel);
  html=replaceInfoValue(html,'ESTADO',content.result.status);
  html=replaceRequired(html,'CRM + Calendar sincronizados',escapeHtml(content.result.footer),'explainer result footer');

  html=replaceRequired(html,'const FPS=24,DUR=12;','const FPS='+Number(plan.fps)+',DUR='+Number(plan.durationSeconds)+',BASE_DUR=12;','explainer fps duration');
  html=replaceRequired(html,'function renderAt(frame){const t=frame/FPS;','function renderAt(frame){const rt=frame/FPS,t=rt*(BASE_DUR/DUR);','explainer time scaling');
  html=replaceRequired(html,'const globalP=clamp(t/DUR);','const globalP=clamp(rt/DUR);','explainer progress scaling');

  const phases=['"01 · MENSAJE"','"02 · COMPRENDE"','"03 · DECIDE Y ACTÚA"','"04 · CONFIRMA"'];
  const caps=['"1. El cliente escribe"','"2. La IA entiende el mensaje"','"3. Consulta CRM y agenda"','"4. Confirma y sincroniza"'];
  phases.forEach((old,i)=>{html=replaceRequired(html,old,jsLiteral(content.phases[i]),`explainer phase ${i+1}`);});
  caps.forEach((old,i)=>{html=replaceRequired(html,old,jsLiteral(content.captions[i]),`explainer caption ${i+1}`);});
  html=html.replaceAll('HYBRID TUTORIAL V2.2','EXPLAINER · MODE BUILDER V1');
  return html;
}

export async function buildExplainerHtml({workspace,plan,manifest}) {
  const baseDir=path.join(workspace,'source','baseline');
  const base=await readFile(path.join(baseDir,'examples','hybrid-tutorial-v2.1','index.html'),'utf8');
  const css=await readFile(path.join(baseDir,'examples','hybrid-tutorial-v2.2','motion_v22.css'),'utf8');
  const render=await readFile(path.join(baseDir,'examples','hybrid-tutorial-v2.2','renderAt_v22.js'),'utf8');
  const content=normalizeExplainerContent(manifest);
  let html=applyV22(base,css,render);
  html=applyContent(html,content,plan);
  return {
    html,
    content,
    report:{
      mode:'explainer',
      baseline:'hybrid-tutorial-v2.2',
      reusedGeneratedVisuals:2,
      note:'Mode Builder V1 keeps the approved embedded V2.1 visual assets unless a later asset-replacement stage supplies project-specific visuals.'
    }
  };
}
