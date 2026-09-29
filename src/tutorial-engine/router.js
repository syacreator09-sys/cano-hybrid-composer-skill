import { MODE_IDS, getTutorialMode } from './modes.js';

const TOOL_TERMS = ['whatsapp','n8n','crm','openai','hubspot','salesforce','api','webhook','supabase','cal.com','chatwoot'];
const SCREEN_ACTION_TERMS = ['click','clic','selecciona','seleccionar','configura','configurar','instala','instalar','abre','abrir','activa','activar','copia','copiar','pega','pegar','escribe','probar','prueba','testea','crea','crear'];
const SCREEN_OBJECT_TERMS = ['pantalla','interfaz','boton','campo','menu','panel','sidebar','editor','nodo','credencial','url','ajuste','settings'];
const WORKFLOW_TERMS = ['flujo','workflow','pipeline','orquesta','automatiza','automatizacion','integracion','webhook','api','crm','lead','agente','trigger','router','enruta','sincroniza'];

function normalizeText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function countTerms(text, terms) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

export function routeTutorialBrief(brief, options = {}) {
  const text = normalizeText(brief);
  if (!text.trim()) throw new Error('brief is required');

  const modeHint = options.modeHint && options.modeHint !== 'auto' ? options.modeHint : null;
  if (modeHint) {
    if (!MODE_IDS.includes(modeHint)) throw new Error(`unsupported tutorial mode: ${modeHint}`);
    return { mode: modeHint, baseline: getTutorialMode(modeHint).baseline, reason: 'explicit mode hint', signals: { explicit: true } };
  }

  const toolCount = countTerms(text, TOOL_TERMS);
  const screenActionCount = countTerms(text, SCREEN_ACTION_TERMS);
  const screenObjectCount = countTerms(text, SCREEN_OBJECT_TERMS);
  const workflowCount = countTerms(text, WORKFLOW_TERMS);
  const arrowCount = (text.match(/(?:->|→|=>)/g) ?? []).length;
  const stepByStep = text.includes('paso a paso') || text.includes('tutorial') || text.includes('como conectar') || text.includes('como configurar');

  if ((screenActionCount >= 1 && screenObjectCount >= 1) || (stepByStep && toolCount >= 1)) {
    return {
      mode: 'screen_tutorial',
      baseline: getTutorialMode('screen_tutorial').baseline,
      reason: 'operational software actions detected',
      signals: { toolCount, screenActionCount, screenObjectCount, workflowCount, arrowCount, stepByStep }
    };
  }

  if (arrowCount >= 1 || toolCount >= 2 || workflowCount >= 2) {
    return {
      mode: 'workflow',
      baseline: getTutorialMode('workflow').baseline,
      reason: 'multi-step tool/integration flow detected',
      signals: { toolCount, screenActionCount, screenObjectCount, workflowCount, arrowCount, stepByStep }
    };
  }

  return {
    mode: 'explainer',
    baseline: getTutorialMode('explainer').baseline,
    reason: 'conceptual explanation is the safest default',
    signals: { toolCount, screenActionCount, screenObjectCount, workflowCount, arrowCount, stepByStep }
  };
}
