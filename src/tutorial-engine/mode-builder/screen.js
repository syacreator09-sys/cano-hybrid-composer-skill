import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml, jsLiteral, replaceRequired } from './utils.js';
import { normalizeScreenContent } from './content.js';

function withClass(svg, className, ariaLabel='') {
  const aria = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : '';
  return svg.replace('<svg ', `<svg class="${className}"${aria} `, 1);
}

function applyLogos(html, n8nIconRaw, n8nTextRaw, whatsappRaw) {
  const n8nIcon = withClass(n8nIconRaw,'n8nLogoIcon','n8n');
  const n8nText = withClass(n8nTextRaw,'n8nLogoText');
  const whatsapp = withClass(whatsappRaw,'waLogo','WhatsApp');
  const oldCss='.address{margin-left:8px;height:30px;flex:1;border-radius:8px;background:#f1f2f4;display:flex;align-items:center;padding:0 12px;color:#8a929b;font-size:11px}.brand{font-size:13px;font-weight:900;color:#ff6d3b;letter-spacing:.04em}';
  const newCss='.address{margin-left:8px;height:30px;flex:1;border-radius:8px;background:#f1f2f4;display:flex;align-items:center;padding:0 12px;color:#8a929b;font-size:11px}.brand{display:flex;align-items:center;gap:2px;height:30px;padding:0 4px}.brand .n8nLogoIcon{width:23px;height:19px}.brand .n8nLogoText{width:22px;height:22px}.sidebarBrand{display:grid;place-items:center}.sidebarBrand .n8nLogoIcon{width:27px;height:22px}.nodeIcon.wa{background:#fff;padding:0;overflow:hidden}.waLogo{width:34px;height:34px;display:block}';
  html=replaceRequired(html,oldCss,newCss,'screen logo css');
  html=replaceRequired(html,'<div class="brand">n8n</div>',`<div class="brand">${n8nIcon}${n8nText}</div>`,'screen n8n header logo');
  html=replaceRequired(html,'<div class="sideIcon active">◆</div>',`<div class="sideIcon active sidebarBrand">${n8nIcon}</div>`,'screen n8n sidebar logo');
  html=replaceRequired(html,'<div class="nodeIcon wa">WA</div>',`<div class="nodeIcon wa">${whatsapp}</div>`,'screen WhatsApp logo');
  return html;
}

function applyV12(html) {
  html=replaceRequired(
    html,
    '.phase{position:absolute;left:48px;top:285px;padding:10px 14px;border-radius:999px;background:#101820;color:#fff;font-size:13px;font-weight:850;letter-spacing:.12em;opacity:0}',
    '.phase{position:absolute;left:48px;top:285px;padding:10px 14px;border-radius:999px;background:#101820;color:#fff;font-size:13px;font-weight:850;letter-spacing:.12em;opacity:0;z-index:40}',
    'screen phase z-index'
  );
  html=replaceRequired(
    html,
    '#nStart{left:78px;top:202px}#nWebhook{left:280px;top:202px}#nAI{left:482px;top:202px}',
    '#nStart{left:78px;top:202px}#nWebhook{left:280px;top:202px}#nAI{left:426px;top:202px}',
    'screen AI node geometry'
  );
  html=replaceRequired(
    html,
    '<div class="flowLine" style="left:412px;top:246px;width:70px"></div>',
    '<div class="flowLine" style="left:412px;top:246px;width:14px"></div>',
    'screen AI edge geometry'
  );

  const oldCamera="op(E.phase,life(t,.45,14.8,.08,.03));if(t<3.3)E.phase.textContent='01 · ABRE EL FLUJO';else if(t<6.6)E.phase.textContent='02 · AÑADE WEBHOOK';else if(t<10.3)E.phase.textContent='03 · CONFIGURA';else E.phase.textContent='04 · PRUEBA';\n const bw=life(t,1.15,15.01,.12,.02);op(E.browserWrap,bw);let camX=0,camY=0,camS=1;if(t>3.0&&t<6.9){const q=sm(pr(t,3.0,4.2));camX=-65*q;camY=-42*q;camS=1+.17*q}else if(t>=6.9&&t<10.8){const q=sm(pr(t,6.9,8.0));camX=-122*q;camY=-18*q;camS=1+.21*q}else if(t>=10.8){const q=sm(pr(t,10.8,12.0));camX=-32*(1-q);camY=-10*(1-q);camS=1.16-.16*q}tf(E.browserWrap,camX,camY,camS);";
  const newCamera="op(E.phase,life(t,.45,15.5,.08,.02));if(t<3.3)E.phase.textContent='01 · ABRE EL FLUJO';else if(t<6.6)E.phase.textContent='02 · AÑADE WEBHOOK';else if(t<10.3)E.phase.textContent='03 · CONFIGURA';else E.phase.textContent='04 · PRUEBA';\n const bw=life(t,1.15,15.5,.12,.02);op(E.browserWrap,bw);\n let camX=0,camY=0,camS=1;\n if(t>=3.0&&t<4.2){const q=sm(pr(t,3.0,4.2));camX=-65*q;camY=-42*q;camS=1+.17*q}\n else if(t>=4.2&&t<6.45){const q=pr(t,4.2,6.45);camX=-65-5*q;camY=-42-2*q;camS=1.17+.005*q}\n else if(t>=6.45&&t<8.0){const q=sm(pr(t,6.45,8.0));camX=-70+(-52*q);camY=-44+(26*q);camS=1.175+(.035*q)}\n else if(t>=8.0&&t<10.45){const q=pr(t,8.0,10.45);camX=-122+4*q;camY=-18-2*q;camS=1.21-.005*q}\n else if(t>=10.45&&t<12.0){const q=sm(pr(t,10.45,12.0));camX=-118+(106*q);camY=-20+(16*q);camS=1.205-(.165*q)}\n else if(t>=12.0){const q=pr(t,12.0,15.0);camX=-12+4*q;camY=-4-2*q;camS=1.04-(.01*q)}\n tf(E.browserWrap,camX,camY,camS);";
  html=replaceRequired(html,oldCamera,newCamera,'screen V1.2 camera');

  const oldSuccess="else {cursorAt(t,565,850,555,480,10.7,11.65);clickAt(t,555,480,11.65);const sb=life(t,11.45,15.01,.08,.01);op(E.successBox,sb);tf(E.successBox,0,16*(1-ease(sb))-4*pr(t,11.45,15.01),.97+.03*ease(sb));E.nWebhook.classList.toggle('success',t>11.65);op(E.tip,life(t,11.9,13.3,.08,.2));E.tip.style.left='442px';E.tip.style.top='420px';E.tip.textContent='Test recibido ✓'}";
  const newSuccess="else {cursorAt(t,565,850,555,480,10.7,11.65);clickAt(t,555,480,11.65);const sb=life(t,11.45,15.5,.08,.01);op(E.successBox,sb);const settle=sm(pr(t,12.0,14.8));tf(E.successBox,0,16*(1-ease(sb))-4*pr(t,11.45,15.5)-5*settle,.97+.03*ease(sb)+.008*settle);E.nWebhook.classList.toggle('success',t>11.65);op(E.tip,life(t,11.9,13.3,.08,.2));E.tip.style.left='442px';E.tip.style.top='420px';E.tip.textContent='Test recibido ✓'}";
  return replaceRequired(html,oldSuccess,newSuccess,'screen V1.2 success settle');
}

function applyContent(html, content, plan) {
  html=replaceRequired(html,'<title>CANO Screen Tutorial Test 3</title>',`<title>${escapeHtml(plan.projectId)} · CANO Screen Tutorial</title>`,'screen document title');
  html=replaceRequired(html,'CANO DIGITAL · SCREEN TUTORIAL',escapeHtml(content.kicker),'screen kicker');
  html=replaceRequired(html,'WhatsApp → n8n<br><span class="accent">paso a paso</span>',`${escapeHtml(content.titleLine1)}<br><span class="accent">${escapeHtml(content.titleAccent)}</span>`,'screen title');
  html=replaceRequired(html,'Cursor, zoom, clicks y feedback programados cuadro a cuadro.',escapeHtml(content.subtitle),'screen subtitle');
  html=replaceRequired(html,'https://app.n8n.io/workflow/ventas',escapeHtml(content.browserUrl),'screen browser URL');
  html=replaceRequired(html,'Workflows / Leads WhatsApp',escapeHtml(content.workflowName),'screen workflow name');
  html=replaceRequired(html,'Test workflow',escapeHtml(content.runButton),'screen run button');
  html=replaceRequired(html,'<div class="nodeName">WhatsApp</div>',`<div class="nodeName">${escapeHtml(content.startNode.name)}</div>`,'screen start node');
  html=replaceRequired(html,'<div class="nodeMeta">Trigger</div>',`<div class="nodeMeta">${escapeHtml(content.startNode.meta)}</div>`,'screen start meta');
  html=replaceRequired(html,'<div class="nodeName">Webhook</div>',`<div class="nodeName">${escapeHtml(content.targetNode.name)}</div>`,'screen target node');
  html=replaceRequired(html,'<div class="nodeMeta">POST /lead</div>',`<div class="nodeMeta">${escapeHtml(content.targetNode.meta)}</div>`,'screen target meta');
  html=replaceRequired(html,'<div class="nodeName">Agente IA</div>',`<div class="nodeName">${escapeHtml(content.nextNode.name)}</div>`,'screen next node');
  html=replaceRequired(html,'<div class="nodeMeta">Extrae datos</div>',`<div class="nodeMeta">${escapeHtml(content.nextNode.meta)}</div>`,'screen next meta');
  html=replaceRequired(html,'<div class="config" id="config"><h3>Webhook</h3>',`<div class="config" id="config"><h3>${escapeHtml(content.config.title)}</h3>`,'screen config title');
  html=replaceRequired(html,'<div class="input">POST</div>',`<div class="input">${escapeHtml(content.config.method)}</div>`,'screen method');
  html=replaceRequired(html,'<div class="input">lead-whatsapp</div>',`<div class="input">${escapeHtml(content.config.path)}</div>`,'screen path');
  html=replaceRequired(html,'<div class="input">Immediately</div>',`<div class="input">${escapeHtml(content.config.response)}</div>`,'screen response');
  html=replaceRequired(html,'Listen for test event',escapeHtml(content.config.testButton),'screen test button');
  html=replaceRequired(html,'<b>Mensaje recibido</b>',`<b>${escapeHtml(content.success.title)}</b>`,'screen success title');
  html=replaceRequired(html,'<small>Payload capturado y enviado al flujo.</small>',`<small>${escapeHtml(content.success.body)}</small>`,'screen success body');

  html=replaceRequired(html,'const FPS=24,DUR=15;','const FPS='+Number(plan.fps)+',DUR='+Number(plan.durationSeconds)+',BASE_DUR=15;','screen fps duration');
  html=replaceRequired(html,'function renderAt(frame){const t=frame/FPS,g=clamp(t/DUR);','function renderAt(frame){const rt=frame/FPS,t=rt*(BASE_DUR/DUR),g=clamp(rt/DUR);','screen time scaling');

  const phaseOld=["'01 · ABRE EL FLUJO'","'02 · AÑADE WEBHOOK'","'03 · CONFIGURA'","'04 · PRUEBA'"];
  const capOld=["'1. Abre tu workflow'","'2. Añade un Webhook'","'3. Configura el endpoint'","'4. Envía un mensaje de prueba'"];
  phaseOld.forEach((old,i)=>{html=replaceRequired(html,old,jsLiteral(content.phases[i]),`screen phase ${i+1}`);});
  capOld.forEach((old,i)=>{html=replaceRequired(html,old,jsLiteral(content.captions[i]),`screen caption ${i+1}`);});
  html=replaceRequired(html,"E.tip.textContent='Añade un nodo'","E.tip.textContent="+jsLiteral(content.tips.add),'screen add tip');
  html=replaceRequired(html,"E.tip.textContent='Configura método y path'","E.tip.textContent="+jsLiteral(content.tips.configure),'screen configure tip');
  html=replaceRequired(html,"E.tip.textContent='Test recibido ✓'","E.tip.textContent="+jsLiteral(content.tips.success),'screen success tip');
  html=replaceRequired(html,"'Webhook'.slice(0,Math.floor(7*typeP))",jsLiteral(content.targetNode.searchTerm)+".slice(0,Math.floor("+String(content.targetNode.searchTerm).length+"*typeP))",'screen search term');
  return html;
}

export async function buildScreenTutorialHtml({workspace,plan,manifest}) {
  const baseDir=path.join(workspace,'source','baseline');
  const base=await readFile(path.join(baseDir,'examples','screen-tutorial-test3','index.html'),'utf8');
  const n8nIcon=await readFile(path.join(baseDir,'examples','screen-tutorial-logos-v1.1','assets','n8n-logo-icon.svg'),'utf8');
  const n8nText=await readFile(path.join(baseDir,'examples','screen-tutorial-logos-v1.1','assets','n8n-logo-text.svg'),'utf8');
  const whatsapp=await readFile(path.join(baseDir,'examples','screen-tutorial-logos-v1.1','assets','whatsapp.svg'),'utf8');
  const content=normalizeScreenContent(manifest);
  let html=applyLogos(base,n8nIcon,n8nText,whatsapp);
  html=applyV12(html);
  html=applyContent(html,content,plan);
  html=html.replace('SCREEN TUTORIAL · TEST 3','SCREEN TUTORIAL · MODE BUILDER V1');
  return {html,content,report:{mode:'screen_tutorial',baseline:'screen-tutorial-v1.2',realLogos:['n8n','WhatsApp'],reusedGeneratedVisuals:0}};
}
