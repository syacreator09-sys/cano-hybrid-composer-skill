function merge(base, input = {}) {
  return { ...base, ...(input ?? {}) };
}

export function normalizeScreenContent(manifest = {}) {
  const c = manifest.content ?? {};
  return {
    kicker: c.kicker ?? 'CANO DIGITAL · SCREEN TUTORIAL',
    titleLine1: c.titleLine1 ?? 'WhatsApp → n8n',
    titleAccent: c.titleAccent ?? 'paso a paso',
    subtitle: c.subtitle ?? 'Cursor, zoom, clicks y feedback programados cuadro a cuadro.',
    browserUrl: c.browserUrl ?? 'https://app.n8n.io/workflow/ventas',
    workflowName: c.workflowName ?? 'Workflows / Leads WhatsApp',
    runButton: c.runButton ?? 'Test workflow',
    startNode: merge({name:'WhatsApp',meta:'Trigger'},c.startNode),
    targetNode: merge({name:'Webhook',meta:'POST /lead',searchTerm:'Webhook'},c.targetNode),
    nextNode: merge({name:'Agente IA',meta:'Extrae datos'},c.nextNode),
    config: merge({
      title:'Webhook',
      method:'POST',
      path:'lead-whatsapp',
      response:'Immediately',
      testButton:'Listen for test event'
    },c.config),
    success: merge({
      title:'Mensaje recibido',
      body:'Payload capturado y enviado al flujo.'
    },c.success),
    phases: Array.isArray(c.phases) && c.phases.length === 4 ? c.phases : [
      '01 · ABRE EL FLUJO','02 · AÑADE WEBHOOK','03 · CONFIGURA','04 · PRUEBA'
    ],
    captions: Array.isArray(c.captions) && c.captions.length === 4 ? c.captions : [
      '1. Abre tu workflow','2. Añade un Webhook','3. Configura el endpoint','4. Envía un mensaje de prueba'
    ],
    tips: merge({
      add:'Añade un nodo',
      configure:'Configura método y path',
      success:'Test recibido ✓'
    },c.tips),
    logos: Array.isArray(c.logos) ? c.logos : ['n8n','WhatsApp']
  };
}

export function normalizeExplainerContent(manifest = {}) {
  const c = manifest.content ?? {};
  return {
    kicker:c.kicker ?? 'CANO DIGITAL · AUTOMATIZACIÓN',
    titleLine1:c.titleLine1 ?? 'De un mensaje a una',
    titleAccent:c.titleAccent ?? 'cita confirmada',
    subtitle:c.subtitle ?? 'Un agente de IA convierte conversación en una acción real.',
    message:merge({
      eyebrow:'MENSAJE',
      copy:'Hola, quiero agendar una cita mañana a las 11.',
      meta:'Nuevo mensaje'
    },c.message),
    extraction:merge({intent:'Reservar',date:'Mañana',time:'11:00'},c.extraction),
    result:merge({
      title:'Cita confirmada',
      body:'La IA reservó el horario, actualizó el CRM y preparó la confirmación para el cliente.',
      date:'Mañana',
      time:'11:00 AM',
      channel:'Videollamada',
      status:'Agendada ✓',
      footer:'CRM + Calendar sincronizados'
    },c.result),
    phases:Array.isArray(c.phases)&&c.phases.length===4?c.phases:[
      '01 · MENSAJE','02 · COMPRENDE','03 · DECIDE Y ACTÚA','04 · CONFIRMA'
    ],
    captions:Array.isArray(c.captions)&&c.captions.length===4?c.captions:[
      '1. El cliente escribe','2. La IA entiende el mensaje','3. Consulta CRM y agenda','4. Confirma y sincroniza'
    ]
  };
}

export function normalizeWorkflowContent(manifest = {}) {
  const c = manifest.content ?? {};
  const nodes = Array.isArray(c.nodes) && c.nodes.length >= 2 ? c.nodes.slice(0,6) : [
    {name:'WhatsApp',meta:'Entrada',brand:'WhatsApp'},
    {name:'Webhook',meta:'Captura'},
    {name:'n8n',meta:'Orquesta',brand:'n8n'},
    {name:'Agente IA',meta:'Califica'},
    {name:'CRM',meta:'Registra'}
  ];
  return {
    kicker:c.kicker ?? 'CANO DIGITAL · AUTOMATIZACIÓN',
    titleLine1:c.titleLine1 ?? 'De WhatsApp a un',
    titleAccent:c.titleAccent ?? 'lead calificado',
    subtitle:c.subtitle ?? 'El mensaje entra, se procesa, se califica y termina listo para seguimiento.',
    nodes,
    extraction:merge({
      name:'Ana',
      interest:'Automatización de ventas',
      timeline:'30 días',
      temperature:'TIBIO'
    },c.extraction),
    result:merge({
      title:'Lead registrado',
      status:'CRM ACTUALIZADO',
      nextAction:'Seguimiento automático · 24 h'
    },c.result),
    phases:Array.isArray(c.phases)&&c.phases.length===4?c.phases:[
      '01 · MENSAJE','02 · ORQUESTA','03 · IA CALIFICA','04 · CRM REGISTRA'
    ],
    captions:Array.isArray(c.captions)&&c.captions.length===4?c.captions:[
      '1. El lead escribe','2. El flujo mueve el mensaje','3. La IA extrae y califica','4. El CRM registra y da seguimiento'
    ],
    logos:Array.isArray(c.logos)?c.logos:['n8n','WhatsApp']
  };
}
