import { escapeHtml, jsLiteral, replaceRegexRequired, replaceRequired } from './utils.js';

const DEFAULT_MOTION=Object.freeze({
  phaseBoundaries:[3.3,6.6,10.3],
  interactionEnds:[3.5,6.7,10.8],
  phaseVisible:[0.45,15.5], browserVisible:[1.15,15.5], cursorVisible:[2.0,13.3],
  camera:[
    {start:3.0,end:4.2,from:[0,0,1],to:[-65,-42,1.17],easing:'smooth'},
    {start:4.2,end:6.45,from:[-65,-42,1.17],to:[-70,-44,1.175],easing:'linear'},
    {start:6.45,end:8.0,from:[-70,-44,1.175],to:[-122,-18,1.21],easing:'smooth'},
    {start:8.0,end:10.45,from:[-122,-18,1.21],to:[-118,-20,1.205],easing:'linear'},
    {start:10.45,end:12.0,from:[-118,-20,1.205],to:[-12,-4,1.04],easing:'smooth'},
    {start:12.0,end:15.0,from:[-12,-4,1.04],to:[-8,-6,1.03],easing:'linear'}
  ],
  cursor:{
    open:{from:[530,880],to:[302,680],move:[2.0,3.2],click:[302,680,3.05],tip:[2.55,3.6,246,610]},
    select:{from:[302,680],to:[430,570],move:[3.5,4.1],resultFrom:[430,570],resultTo:[405,660],resultMove:[5.0,5.65],click:[405,660,5.58],searchVisible:[3.55,6.55],type:[4.05,5.05]},
    configure:{from:[405,660],to:[565,850],move:[6.8,8.2],click:[565,850,8.28],tip:[7.55,9.15,452,755],panelVisible:[6.55,10.75]},
    test:{from:[565,850],to:[555,480],move:[10.7,11.65],click:[555,480,11.65],successVisible:[11.45,15.5],tip:[11.9,13.3,442,420],settle:[12.0,14.8]}
  }
});

function finiteTuple(value,length,fallback){return Array.isArray(value)&&value.length===length&&value.every(Number.isFinite)?value:fallback}
function mergeMotion(input={}){
  const cursor=input.cursor??{};
  const d=DEFAULT_MOTION.cursor;
  const camera=Array.isArray(input.camera)&&input.camera.length>0&&input.camera.every(s=>Number.isFinite(s?.start)&&Number.isFinite(s?.end)&&s.end>s.start&&finiteTuple(s.from,3,null)&&finiteTuple(s.to,3,null))
    ? input.camera.map(s=>({start:s.start,end:s.end,from:s.from,to:s.to,easing:s.easing==='linear'?'linear':'smooth'}))
    : DEFAULT_MOTION.camera;
  const part=(id,keys)=>Object.fromEntries(keys.map(([k,n])=>[k,finiteTuple(cursor[id]?.[k],n,d[id][k])]));
  return {
    phaseBoundaries:finiteTuple(input.phaseBoundaries,3,DEFAULT_MOTION.phaseBoundaries),
    interactionEnds:finiteTuple(input.interactionEnds,3,DEFAULT_MOTION.interactionEnds),
    phaseVisible:finiteTuple(input.phaseVisible,2,DEFAULT_MOTION.phaseVisible),
    browserVisible:finiteTuple(input.browserVisible,2,DEFAULT_MOTION.browserVisible),
    cursorVisible:finiteTuple(input.cursorVisible,2,DEFAULT_MOTION.cursorVisible),
    camera,
    cursor:{
      open:part('open',[['from',2],['to',2],['move',2],['click',3],['tip',4]]),
      select:part('select',[['from',2],['to',2],['move',2],['resultFrom',2],['resultTo',2],['resultMove',2],['click',3],['searchVisible',2],['type',2]]),
      configure:part('configure',[['from',2],['to',2],['move',2],['click',3],['tip',4],['panelVisible',2]]),
      test:part('test',[['from',2],['to',2],['move',2],['click',3],['successVisible',2],['tip',4],['settle',2]])
    }
  };
}

export function prepareScreenManifest(manifest={}){
  const content={...(manifest.content??{})};
  if(content.title&&!content.titleLine1) content.titleLine1=content.title;
  if(Array.isArray(content.steps)&&content.steps.length===4){
    if(!Array.isArray(content.phases)) content.phases=content.steps.map((step,i)=>`${String(i+1).padStart(2,'0')} · ${String(step.action??'paso').toUpperCase()}`);
    if(!Array.isArray(content.captions)) content.captions=content.steps.map((step,i)=>`${i+1}. ${step.caption??step.action??'Paso'}`);
  }
  content.motion=mergeMotion(content.motion);
  content.config={...(content.config??{}),labels:{method:'HTTP METHOD',path:'PATH',response:'RESPONSE',...(content.config?.labels??{})}};
  return {...manifest,content};
}

export function applyScreenProjectContract(html,{content,manifest}){
  const motion=manifest.content.motion;
  const phases=content.phases.map(jsLiteral).join(',');
  const search=jsLiteral(content.targetNode.searchTerm);
  const tips={add:jsLiteral(content.tips.add),configure:jsLiteral(content.tips.configure),success:jsLiteral(content.tips.success)};
  const constants=`const PROJECT_PHASES=[${phases}],PROJECT_SEARCH_TERM=${search},PROJECT_TIPS={add:${tips.add},configure:${tips.configure},success:${tips.success}},PROJECT_MOTION=${JSON.stringify(motion)};
function cameraFor(t){let hold={x:0,y:0,scale:1};for(const s of PROJECT_MOTION.camera){if(t<s.start)return hold;if(t<=s.end){const raw=pr(t,s.start,s.end),q=s.easing==='linear'?raw:sm(raw);return{x:s.from[0]+(s.to[0]-s.from[0])*q,y:s.from[1]+(s.to[1]-s.from[1])*q,scale:s.from[2]+(s.to[2]-s.from[2])*q}}hold={x:s.to[0],y:s.to[1],scale:s.to[2]}}return hold}
`;
  html=replaceRequired(html,'function renderAt(frame){',constants+'function renderAt(frame){','screen project motion constants');

  const camera=/op\(E\.phase,life\(t,[\s\S]*?tf\(E\.browserWrap,camX,camY,camS\);/;
  const dynamicCamera="op(E.phase,life(t,PROJECT_MOTION.phaseVisible[0],PROJECT_MOTION.phaseVisible[1],.08,.02));const pb=PROJECT_MOTION.phaseBoundaries;E.phase.textContent=t<pb[0]?PROJECT_PHASES[0]:t<pb[1]?PROJECT_PHASES[1]:t<pb[2]?PROJECT_PHASES[2]:PROJECT_PHASES[3];\n const bv=PROJECT_MOTION.browserVisible,bw=life(t,bv[0],bv[1],.12,.02);op(E.browserWrap,bw);const cam=cameraFor(t);tf(E.browserWrap,cam.x,cam.y,cam.scale);";
  html=replaceRegexRequired(html,camera,dynamicCamera,'screen project camera contract');

  const cursor=/op\(E\.cursor,life\(t,2\.0,13\.3,[\s\S]*?(?=\n? op\(E\.caption,1\);)/;
  const dynamicCursor=`const cv=PROJECT_MOTION.cursorVisible,C=PROJECT_MOTION.cursor;op(E.cursor,life(t,cv[0],cv[1],.05,.04));
 if(t<PROJECT_MOTION.interactionEnds[0]){cursorAt(t,C.open.from[0],C.open.from[1],C.open.to[0],C.open.to[1],C.open.move[0],C.open.move[1]);op(E.tip,life(t,C.open.tip[0],C.open.tip[1],.1,.2));E.tip.style.left=C.open.tip[2]+'px';E.tip.style.top=C.open.tip[3]+'px';E.tip.textContent=PROJECT_TIPS.add;clickAt(t,C.open.click[0],C.open.click[1],C.open.click[2])}
 else if(t<PROJECT_MOTION.interactionEnds[1]){cursorAt(t,C.select.from[0],C.select.from[1],C.select.to[0],C.select.to[1],C.select.move[0],C.select.move[1]);const sp=life(t,C.select.searchVisible[0],C.select.searchVisible[1],.08,.12);op(E.searchPanel,sp);tf(E.searchPanel,0,12*(1-ease(sp)),.97+.03*ease(sp));const typeP=pr(t,C.select.type[0],C.select.type[1]);E.searchValue.textContent=PROJECT_SEARCH_TERM.slice(0,Math.floor(PROJECT_SEARCH_TERM.length*typeP));cursorAt(t,C.select.resultFrom[0],C.select.resultFrom[1],C.select.resultTo[0],C.select.resultTo[1],C.select.resultMove[0],C.select.resultMove[1]);clickAt(t,C.select.click[0],C.select.click[1],C.select.click[2]);E.nWebhook.classList.toggle('selected',t>C.select.resultMove[1]&&t<PROJECT_MOTION.interactionEnds[1]+.3)}
 else if(t<PROJECT_MOTION.interactionEnds[2]){const cf=life(t,C.configure.panelVisible[0],C.configure.panelVisible[1],.08,.08);op(E.config,cf);tf(E.config,20*(1-ease(cf)),0,1);cursorAt(t,C.configure.from[0],C.configure.from[1],C.configure.to[0],C.configure.to[1],C.configure.move[0],C.configure.move[1]);op(E.tip,life(t,C.configure.tip[0],C.configure.tip[1],.08,.2));E.tip.style.left=C.configure.tip[2]+'px';E.tip.style.top=C.configure.tip[3]+'px';E.tip.textContent=PROJECT_TIPS.configure;clickAt(t,C.configure.click[0],C.configure.click[1],C.configure.click[2]);E.testBtn.style.background=t>C.configure.click[2]?'#ff6d3b':'#101820'}
 else {cursorAt(t,C.test.from[0],C.test.from[1],C.test.to[0],C.test.to[1],C.test.move[0],C.test.move[1]);clickAt(t,C.test.click[0],C.test.click[1],C.test.click[2]);const sb=life(t,C.test.successVisible[0],C.test.successVisible[1],.08,.01);op(E.successBox,sb);const settle=sm(pr(t,C.test.settle[0],C.test.settle[1]));tf(E.successBox,0,16*(1-ease(sb))-4*pr(t,C.test.successVisible[0],C.test.successVisible[1])-5*settle,.97+.03*ease(sb)+.008*settle);E.nWebhook.classList.toggle('success',t>C.test.click[2]);op(E.tip,life(t,C.test.tip[0],C.test.tip[1],.08,.2));E.tip.style.left=C.test.tip[2]+'px';E.tip.style.top=C.test.tip[3]+'px';E.tip.textContent=PROJECT_TIPS.success}`;
  html=replaceRegexRequired(html,cursor,dynamicCursor,'screen project cursor contract');

  const labels=manifest.content.config?.labels??{};
  html=replaceRequired(html,'<label>HTTP METHOD</label>',`<label>${escapeHtml(String(labels.method??'HTTP METHOD'))}</label>`,'screen method label');
  html=replaceRequired(html,'<label>PATH</label>',`<label>${escapeHtml(String(labels.path??'PATH'))}</label>`,'screen path label');
  html=replaceRequired(html,'<label>RESPONSE</label>',`<label>${escapeHtml(String(labels.response??'RESPONSE'))}</label>`,'screen response label');
  return html;
}
