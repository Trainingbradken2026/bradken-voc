import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

// ── Portal design tokens (from Bradken Training Portal) ─────────────────
const BRAND='#1B5CA8',BRANDH='#154D90',BRANDL='#E8F0FB';
const PGBG='#F4F6FA',SF='#FFF',S2='#F0F2F7';
const TX='#1A1A2E',T2='#6B7280',T3='#B0B7C3',BD='#E4E7EF';
const SH='0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.05)';
const G='#10B981',GBKG='#ECFDF5',GBD='#A7F3D0';
const R='#EF4444',RBKG='#FEF2F2',RBD='#FCA5A5';
const AM='#F59E0B',ABKG='#FFFBEB',ABD='#FDE68A';

// Kept for permit-type colors and print format header accents
const BK='#C0272D';
const DARK='#1C1C1C';

const TYPES = [
  // ── Permisos de trabajo de alto riesgo ──────────────────────────────
  { id:'alturas',  label:'Trabajo en Alturas',         sub:'Caídas · EPP · Andamios',        icon:'↑',   code:'TRG-F-008', color:BK,        mode:'permiso', xfields:['area','turno']},
  { id:'espacios', label:'Espacios Confinados',         sub:'Atmósfera · Rescate · LOTOTO',   icon:'⬡',   code:'TRG-F-009', color:'#5B2C6F', mode:'permiso', xfields:['area','turno']},
  { id:'caliente', label:'Trabajos en Caliente',        sub:'Incendio · Soldadura · Vigía',   icon:'◈',   code:'TRG-F-010', color:'#BA4A00', mode:'permiso', xfields:['area','turno']},
  { id:'lototo',   label:'LOTO / Bloqueo',             sub:'Energías · Candados · Tryout',   icon:'⊟',   code:'TRG-F-011', color:'#1A5276', mode:'permiso', xfields:['area','turno']},
  // ── Licencias de equipo / vehículo ──────────────────────────────────
  { id:'bc1',        label:'Grúa Puente BC1',            sub:'Licencia básica de operación',   icon:'BC1', code:'C09785-BC1', color:'#0F766E', xfields:['logbook','equipo','turno','supervisor'], mode:'licencia' },
  { id:'bc3',        label:'Grúa Puente BC3',            sub:'Metal líquido · Req: BC1 vigente', icon:'BC3', code:'C09785-BC3', color:'#0E7490', xfields:['logbook','equipo','turno','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BC1 vigente? (Obligatorio)' },
  { id:'montacargas',label:'Montacargas Combustión (5T)', sub:'Oral + Evaluación práctica',     icon:'5T',  code:'TRG-F-005C', color:'#7C3AED', xfields:['equipo','turno'], mode:'licencia' },
  { id:'montacargas_e',label:'Montacargas Eléctrico (16T)',  sub:'Inspección · Operación · Maniobras', icon:'16T', code:'TRG-F-005E', color:'#0891B2', xfields:['equipo','turno'], mode:'licencia' },
  { id:'manlift3b',  label:'Manlift Brazo Móvil (3b)',   sub:'Brazo articulado · 17.80 m',     icon:'3b',  code:'TRG-F-012', color:'#0369A1', xfields:['equipo','turno'], mode:'licencia' },
  { id:'tijera3a',   label:'Elevador Vertical Tijera (3a)', sub:'Plataforma de tijera vertical', icon:'3a', code:'TRG-F-013', color:'#059669', xfields:['equipo','turno'], mode:'licencia' },
  // ── Licencias de Fundición – Horno de Inducción ─────────────────────
  { id:'bm1', label:'BM1 – Preparación de Carga', sub:'Horno de inducción · Req: BC1', icon:'BM1', code:'BM-LTM-001', color:'#D97706', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BC1 vigente? (Obligatorio)' },
  { id:'bm2', label:'BM2 – Operaciones de Horno', sub:'Fusión · ELD · Sangrado · Req: BM1', icon:'BM2', code:'BM-LTM-002', color:'#B45309', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BM1 vigente? (Obligatorio)' },
  { id:'bm3', label:'BM3 – Trabajo con Refractarios', sub:'Horno de inducción · Req: MATPEL', icon:'BM3', code:'BM-LTM-003', color:'#92400E', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia MATPEL vigente? (Obligatorio)' },
  { id:'bm4', label:'BM4 – Vaciado', sub:'Operación de vaciado · Req: BC3', icon:'BM4', code:'BM-LTM-004', color:'#C2410C', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BC3 vigente? (Obligatorio)' },
  { id:'bm5', label:'BM5 – Controlador de Vaciado', sub:'Control de calidad · Req: BC3', icon:'BM5', code:'BM-LTM-005', color:'#9A3412', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BC3 vigente? (Obligatorio)' },
  { id:'bm6', label:'BM6 – Operar Espectrómetro', sub:'Análisis químico · Argón · Calibración', icon:'BM6', code:'BM-LTM-006', color:'#7C3AED', xfields:['colada','turno','logbook','supervisor'], mode:'licencia' },
  { id:'bm7', label:'BM7 – Fundidor (Horno de Inducción)', sub:'Licencia máxima · Req: BM2 + 6 meses', icon:'BM7', code:'BM-LTM-007', color:'#1E40AF', xfields:['colada','turno','logbook','supervisor'], mode:'licencia', prereq:'¿Posee Licencia BM2 vigente y mínimo 6 meses de experiencia como operador de horno? (Obligatorio)' },
];

const DOM = [
  { k:'s',  label:'SABER',          sub:'Conocimiento' },
  { k:'sh', label:'SABER HACER',    sub:'Aplicación práctica' },
  { k:'ss', label:'SABER SER',      sub:'Actitud y responsabilidad' },
  { k:'sc', label:'SABER CONVIVIR', sub:'Trabajo en equipo' },
];

const COMP = {
  alturas:{
    emisor:[
      ['Identifica los requisitos legales (Ley 29783, DS 005-2012-TR, DS 024-2016-EM) como fundamento para la emisión válida del permiso de trabajo en altura.',
       'Reconoce los componentes del EPP (arnés, líneas de vida, anclajes) conforme a ANSI/OSHA para verificar su correcta selección antes de autorizar.',
       'Describe los riesgos del trabajo en altura (caídas, condiciones climáticas, superficies frágiles) y las medidas de control previas a la emisión.',
       'Conoce los procedimientos de rescate y emergencia conforme al plan de la empresa y comprende su rol de coordinación como emisor.',
       'Sabe identificar las condiciones mínimas (área, equipo, aptitud del ejecutor) para autorizar el permiso de trabajo en altura.',
       'Comprende las especificaciones técnicas de andamios, plataformas y puntos de anclaje, incluyendo capacidades de carga y límites de uso.'],
      ['Evalúa y verifica las condiciones del área (entorno, accesos, condiciones climáticas) antes de emitir el permiso de trabajo en altura.',
       'Confirma que el ejecutor tiene EPP completo y en buen estado (arnés, líneas de vida, ganchos) conforme al checklist PTW-Altura antes de autorizar.',
       'Verifica la correcta nivelación, estabilidad y capacidad de carga del andamio u otros equipos de acceso antes de emitir la autorización.',
       'Confirma la instalación de barreras y señalización, y verifica que el ejecutor cumplió las pruebas de aptitud física antes de autorizar.',
       'Gestiona la vigencia del permiso supervisando la duración máxima (6 horas) y procediendo al cierre o renovación según corresponda.'],
      ['Mantiene actitud preventiva y de autoridad responsable, rechazando la emisión ante condiciones inseguras (viento, lluvia, EPP defectuoso).',
       'Notifica de inmediato a la supervisión cualquier desviación o condición insegura detectada durante la vigencia del permiso.',
       'Respeta y hace respetar la duración máxima del permiso (6 horas), gestionando renovación o cierre sin ceder ante presiones de producción.',
       'Ejerce criterio técnico independiente, sin autorizar trabajos que no cumplan los requisitos, independientemente de la urgencia operativa.',
       'Cumple normativas del rol de emisor sin supervisión constante, siendo referente de cumplimiento para el equipo.'],
      ['Comunica al ejecutor y vigía los riesgos identificados, medidas de control y condiciones específicas del permiso antes del inicio.',
       'Coordina con el dueño del área y supervisor la activación del plan de rescate, asegurando que todos conocen su rol antes del inicio.',
       'Acepta retroalimentación del HSEE o supervisor respecto a la emisión y gestión del permiso, incorporando correcciones.',
       'Fomenta cultura de seguridad verificando que todos comprenden y aceptan las condiciones del permiso antes del inicio del trabajo.'],
    ],
    ejecutor:[
      ['Identifica los requisitos legales (Ley 29783, DS 005-2012-TR, DS 024-2016-EM) y comprende sus obligaciones como trabajador en altura.',
       'Reconoce los componentes del EPP (arnés, líneas de vida, anclajes) incluyendo identificación de defectos, daños o condiciones de descarte.',
       'Describe los riesgos del trabajo en altura y las medidas de control que debe aplicar desde su posición como ejecutor.',
       'Comprende las condiciones del permiso emitido: restricciones de la tarea, duración máxima (6 horas) y medidas de control establecidas.',
       'Comprende las especificaciones técnicas del andamio y puntos de anclaje en los que trabajará, incluyendo límites de carga y uso seguro.'],
      ['Realiza la inspección previa del EPP (arnés, líneas de vida, ganchos) siguiendo el checklist PTW-Altura antes de iniciar el trabajo en altura.',
       'Aplica correctamente técnicas de colocación, ajuste y anclaje del arnés, verificando la distancia libre de caída (DCL ≤ 1,8 m) antes de ascender.',
       'Instala o verifica barreras y señalización en el área de trabajo para prevenir el acceso no autorizado durante la ejecución.',
       'Cumple con las pruebas de aptitud física (frecuencia cardíaca, presión arterial, aliento alcohólico) según el protocolo antes de ascender.',
       'Verifica la nivelación y estabilidad del andamio antes del ascenso y aplica bloqueo de ruedas y sistemas de seguridad durante la tarea.'],
      ['Rechaza el inicio si el permiso no fue emitido o si detecta condiciones inseguras (viento, lluvia, EPP defectuoso, andamio inestable).',
       'Notifica de inmediato al emisor o supervisor cualquier fallo de equipos, cambio en condiciones o desviación respecto al permiso.',
       'Respeta la duración máxima del permiso (6 horas) y solicita renovación al emisor si la tarea no concluyó al vencimiento.',
       'Demuestra autocuidado permanente, evitando sobrepasar alturas no autorizadas, omitir anclajes o trabajar en condiciones de riesgo.'],
      ['Comunica al emisor y vigía cualquier cambio en las condiciones del área, equipo o tarea que pueda afectar la seguridad.',
       'Coordina permanentemente con el vigía, manteniéndose en contacto visual o auditivo y siguiendo sus indicaciones en emergencias.',
       'Acepta retroalimentación del HSEE, supervisor o emisor durante la ejecución y aplica correcciones de inmediato.',
       'Fomenta buenas prácticas entre pares, aplicando los protocolos del permiso y rechazando atajos en los procedimientos de seguridad.'],
    ],
  },
  espacios:{
    emisor:[
      ['Conoce la clasificación de espacios confinados (permitidos y no permitidos) conforme a DS 005-2012-TR y OSHA 1910.146 como base para emitir el permiso.',
       'Identifica los riesgos atmosféricos (deficiencia de O₂, gases tóxicos, atmósferas inflamables) y los límites permisibles (O₂: 19,5%-23,5%; LEL < 10%).',
       'Comprende los requisitos de monitoreo atmosférico continuo (O₂, CO, H₂S, LEL), ventilación forzada y los procedimientos del vigía.',
       'Conoce el plan de rescate no-entrada y la responsabilidad del vigía como primer respondedor ante emergencias.',
       'Sabe verificar el aislamiento de todas las fuentes de energía (LOTOTO) como prerequisito para la emisión del permiso de entrada.'],
      ['Verifica el cumplimiento del LOTOTO y confirma que el monitoreo atmosférico inicial está dentro de límites antes de emitir el permiso.',
       'Confirma que el plan de ventilación está activo y funcionando según el caudal mínimo requerido antes de autorizar la entrada.',
       'Verifica que el entrante tiene EPP adecuado (arnés con punto de rescate, comunicación, iluminación antiexplosiva) antes de autorizar.',
       'Establece y comunica los procedimientos de comunicación y vigilancia con el vigía antes del inicio de la entrada.',
       'Gestiona la vigencia del permiso, supervisando intervalos de monitoreo y procediendo al cierre o renovación.'],
      ['Rechaza la emisión si algún parámetro de seguridad (atmosférico, energético, EPP) no cumple los requisitos establecidos.',
       'Activa inmediatamente el plan de rescate ante señales de alerta (cambio en lecturas del detector, pérdida de comunicación).',
       'Ejerce autoridad responsable sin ceder ante presiones operativas para emitir permisos con condiciones no conformes.',
       'Respeta y hace respetar el número máximo de personas autorizadas en el espacio confinado según el permiso.'],
      ['Comunica al entrante y vigía los riesgos, condiciones del permiso y procedimientos de emergencia antes del inicio.',
       'Coordina con el dueño del área, supervisor y equipo de rescate para asegurar que todos conocen su rol antes de autorizar.',
       'Mantiene comunicación continua con el vigía durante toda la vigencia del permiso, recibiendo actualizaciones del estado del entrante.',
       'Fomenta la cultura de "parar si hay duda", asegurando que la seguridad prevalece sobre la productividad.'],
    ],
    ejecutor:[
      ['Identifica los riesgos atmosféricos del espacio confinado (O₂, CO, H₂S, vapores inflamables) y sus efectos en la salud.',
       'Conoce los límites permisibles (O₂: 19,5%-23,5%; LEL < 10%; CO < 35 ppm; H₂S < 1 ppm) y sabe interpretar lecturas del detector multi-gas.',
       'Comprende el plan de rescate y su rol como persona rescatada o asistente ante emergencias en el espacio confinado.',
       'Conoce las condiciones del permiso: número de personas autorizadas, duración máxima y medidas de control establecidas.',
       'Comprende que el LOTOTO debe estar activo antes de su ingreso y sabe verificar su cumplimiento.'],
      ['Verifica el EPP asignado (arnés, trípode, línea de rescate, comunicación) y el funcionamiento del detector multi-gas antes del ingreso.',
       'Establece contacto con el vigía antes del ingreso y mantiene los intervalos de comunicación establecidos durante el trabajo.',
       'Evacúa inmediatamente ante cualquier alarma del detector, señal del vigía o cambio en las condiciones atmosféricas.',
       'Trabaja exclusivamente dentro del área y condiciones autorizadas, sin tareas adicionales no contempladas en el permiso.',
       'Verifica que los sistemas de aislamiento de energías están activos y visibles antes de iniciar el trabajo.'],
      ['Mantiene alerta constante ante síntomas de exposición (mareo, náuseas, dificultad respiratoria) y evacúa de inmediato ante señales.',
       'Rechaza el ingreso si las condiciones del permiso no están completas o si el vigía no está presente y posicionado.',
       'Notifica al vigía de inmediato cualquier cambio en las condiciones del espacio o en su estado físico durante la ejecución.',
       'Demuestra autocuidado, respetando tiempos máximos de permanencia y sin sobreestimar su resistencia a los riesgos atmosféricos.'],
      ['Mantiene comunicación permanente con el vigía, reportando estado y condiciones del espacio según los intervalos acordados.',
       'Coordina con el vigía la señal de alarma y el protocolo de respuesta antes de ingresar, asegurando comprensión mutua del plan.',
       'Colabora con compañeros en la verificación mutua del EPP antes del ingreso al espacio confinado.',
       'Fomenta buenas prácticas entre pares, rechazando el ingreso sin permiso o sin vigía asignado.'],
    ],
  },
  caliente:{
    emisor:[
      ['Identifica los tipos de trabajo en caliente (soldadura, corte, esmerilado, llama abierta) y los riesgos de incendio en el entorno de la fundición.',
       'Conoce los requisitos de distancia mínima de seguridad (≥ 10 m) para materiales combustibles conforme a NFPA 51B y el procedimiento interno.',
       'Comprende los requisitos del vigía contra incendios (fire watch): posicionamiento, extintores disponibles y período post-trabajo (mín. 30 min).',
       'Sabe verificar las condiciones mínimas para autorizar el trabajo en caliente, incluyendo eliminación de combustibles y verificación del área.',
       'Comprende las incompatibilidades del entorno de Bradken Chilca (hornos de inducción, metal líquido, polvo metálico) con trabajos en caliente.'],
      ['Evalúa y verifica la eliminación o protección de todos los materiales combustibles en radio mínimo de 10 m antes de emitir el permiso.',
       'Verifica la disponibilidad y buen estado de los extintores requeridos (tipo y capacidad adecuados) antes de autorizar el inicio.',
       'Confirma que el vigía contra incendios está designado, posicionado y tiene equipo de extinción antes de emitir la autorización.',
       'Verifica que el ejecutor dispone del EPP adecuado (careta de soldador, guantes de cuero, polainas, mandil) antes de autorizar.',
       'Gestiona el período de vigilancia post-trabajo, asegurando que el vigía continúa en el área mínimo 30 minutos tras el cese.'],
      ['Rechaza la emisión si hay materiales combustibles que no pueden ser eliminados o protegidos dentro del radio de seguridad.',
       'Notifica inmediatamente a la brigada de emergencia ante cualquier inicio de fuego o condición de riesgo durante la vigencia.',
       'Suspende el permiso si durante la ejecución surgen condiciones no previstas que aumentan el riesgo de incendio.',
       'Cumple con NFPA 51B y Ley 29783 sin ceder ante presiones para autorizar trabajos en condiciones no conformes.'],
      ['Comunica al ejecutor y vigía los riesgos específicos del área y las condiciones particulares del permiso antes del inicio.',
       'Coordina con el dueño del área la delimitación del perímetro de trabajo en caliente para prevenir accesos no autorizados.',
       'Coordina con la brigada de emergencia para asegurar su disponibilidad durante trabajos en caliente de alto riesgo.',
       'Fomenta la cultura de prevención de incendios, asegurando que todos comprenden la gravedad en un entorno de fundición.'],
    ],
    ejecutor:[
      ['Identifica los riesgos del tipo de trabajo en caliente que ejecutará (soldadura MIG/TIG/SMAW, corte, esmerilado) y las medidas de control.',
       'Reconoce los materiales combustibles comunes (aceites, pinturas, aislamientos, polvo metálico) y comprende su potencial de ignición.',
       'Conoce el EPP requerido (careta de soldador, guantes de cuero, polainas, mandil, protección auditiva) y los límites de exposición a humos.',
       'Comprende las condiciones del permiso de trabajo en caliente: área autorizada, medidas de control y restricciones de la tarea.',
       'Conoce los procedimientos de emergencia ante inicio de fuego (activación de alarma, uso de extintor, evacuación) y ubicación de extintores.'],
      ['Realiza la inspección previa de equipos de soldadura o corte (manómetros, mangueras, conexiones) y del EPP asignado antes de iniciar.',
       'Verifica que el área está libre de combustibles en radio mínimo de 10 m o que están protegidos con mantas ignífugas.',
       'Instala biombos y pantallas de protección para prevenir la proyección de chispas y escoria hacia áreas adyacentes.',
       'Mantiene el extintor asignado al alcance inmediato durante toda la ejecución, verificando que está accesible y operativo.',
       'Al concluir, señaliza superficies calientes y confirma con el vigía el inicio del período de vigilancia post-trabajo.'],
      ['Rechaza el inicio si el permiso no fue emitido, si hay combustibles sin proteger, falta el extintor o el vigía no está posicionado.',
       'Detiene el trabajo y activa la alarma ante cualquier inicio de fuego o condición de riesgo no controlada.',
       'Notifica al emisor cualquier cambio en las condiciones del área o de la tarea que pueda afectar la seguridad.',
       'Demuestra autocuidado evitando prácticas inseguras como cortar sin protección de superficies o trabajar con EPP defectuoso.'],
      ['Coordina permanentemente con el vigía durante la ejecución, informando proyecciones esperadas y puntos de mayor riesgo.',
       'Comunica al emisor y vigía cualquier cambio en el material a soldar o en las condiciones del área no previsto en el permiso.',
       'Colabora con el vigía en la verificación del área al finalizar, asegurando que no quedan materiales encendidos o superficies peligrosas.',
       'Fomenta buenas prácticas entre pares, rechazando trabajo en caliente sin permiso válido y vigía posicionado.'],
    ],
  },
  lototo:{
    emisor:[
      ['Identifica todos los tipos de energía peligrosa (eléctrica, mecánica, hidráulica, neumática, térmica, gravitacional) en los equipos de Bradken Chilca.',
       'Conoce el procedimiento LOTOTO (Lockout/Tagout/Tryout) conforme a OSHA 1910.147 y DS 005-2012-TR, y los requisitos de cada etapa.',
       'Comprende los requisitos del LOTOTO grupal: candados individuales por trabajador, caja de bloqueo grupal y sistema de administración de llaves.',
       'Conoce los puntos de aislamiento de los equipos de la fundición (tableros, válvulas, acumuladores, frenos) en su área de autorización.',
       'Sabe verificar el "estado cero de energía" (Zero Energy State) y los pasos de re-energización al concluir el trabajo.'],
      ['Verifica e identifica físicamente todos los puntos de aislamiento del equipo antes de autorizar la aplicación del LOTOTO.',
       'Confirma la aplicación correcta de dispositivos de bloqueo en todos los puntos de aislamiento antes de autorizar el inicio.',
       'Verifica el estado cero de energía mediante prueba funcional (intento de arranque, verificación de presión/temperatura) antes que el ejecutor intervenga.',
       'Confirma que cada trabajador colocó su candado personal en la caja de bloqueo grupal antes de autorizar el inicio.',
       'Supervisa la remoción del LOTOTO al concluir, verificando que el área está despejada y el equipo en condiciones seguras antes de re-energizar.'],
      ['Rechaza la autorización si algún punto no está bloqueado, falta algún candado o la verificación de estado cero no fue exitosa.',
       'Paraliza el trabajo de inmediato si detecta que algún bloqueo fue removido o alterado durante la ejecución.',
       'Ejerce autoridad responsable sin ceder ante presiones para omitir pasos del LOTOTO por razones de tiempo u operativa.',
       'Cumple la regla "un trabajador, un candado" sin excepciones bajo ninguna circunstancia.'],
      ['Comunica al equipo de ejecutores todos los puntos de aislamiento, el tipo de energía aislada y los procedimientos específicos del equipo.',
       'Coordina con el dueño del área la secuencia de aislamiento para equipos interconectados o parte de un sistema más amplio.',
       'Coordina el LOTOTO grupal, asegurando que todos comprenden el sistema de bloqueo y han colocado su candado personal.',
       'Fomenta la cultura "nadie mueve lo que otro bloqueó", asegurando que el candado personal es intransferible.'],
    ],
    ejecutor:[
      ['Identifica los tipos de energía peligrosa en el equipo en el que trabajará y comprende los riesgos de exposición accidental durante la intervención.',
       'Conoce el procedimiento LOTOTO (Lockout/Tagout/Tryout) conforme a OSHA 1910.147 y DS 005-2012-TR y sus obligaciones como ejecutor.',
       'Comprende el sistema de bloqueo grupal: su candado personal, la caja de bloqueo y la regla "un trabajador, un candado, una llave".',
       'Conoce los puntos de aislamiento del equipo en el que trabajará, su ubicación física y el método de bloqueo requerido para cada uno.',
       'Comprende el procedimiento de verificación de estado cero de energía y sabe ejecutar las pruebas funcionales antes de intervenir.'],
      ['Coloca su candado personal en la caja de bloqueo grupal antes de intervenir, verificando que nadie más puede removerlo.',
       'Verifica físicamente que todos los puntos de aislamiento están bloqueados y etiquetados antes de comenzar el trabajo.',
       'Ejecuta la prueba de verificación de estado cero de energía (intento de arranque, verificación de presión/temperatura) antes de intervenir.',
       'Verifica que el área está despejada y sin herramientas en el interior antes de notificar la conclusión del trabajo.',
       'Remueve únicamente su propio candado del sistema de bloqueo grupal al concluir, siguiendo el procedimiento establecido.'],
      ['Rechaza el inicio si su candado no está colocado o si algún punto de aislamiento no está debidamente bloqueado.',
       'Notifica de inmediato al emisor si detecta un bloqueo removido o ausente y suspende la actividad hasta restablecer la condición.',
       'Nunca remueve el candado de otro trabajador bajo ninguna circunstancia, incluso si ese trabajador ya concluyó su trabajo.',
       'Verifica el estado de los bloqueos cada vez que regresa al equipo tras una interrupción, sin asumir condiciones inalteradas.'],
      ['Coordina con los demás trabajadores la correcta colocación de todos los candados personales antes de iniciar el trabajo.',
       'Comunica al emisor cualquier condición inesperada (energía residual, fuente no identificada) durante la intervención del equipo.',
       'Acepta retroalimentación del HSEE, supervisor o emisor sobre la aplicación del LOTOTO y aplica correcciones de inmediato.',
       'Fomenta el respeto al LOTOTO entre pares, rechazando prácticas de "confianza" o "atajo" como sustitutos del bloqueo físico.'],
    ],
  },
};

function genCode(){
  return Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
}
function today(){
  return new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function initEval(type,role){
  const t=TYPES.find(x=>x.id===type);
  const mode=t?.mode||'permiso';
  const effectiveRole=mode==='licencia'?'operador':role;
  let domains;
  if(mode==='licencia'){
    const secs=COMP_LIC[type]?.operador||[];
    domains=secs.map(sec=>({
      k:sec.k, label:sec.label, sub:sec.sub||'',
      items:sec.items.map(text=>({text,result:null})),
      domainResult:null, obs:''
    }));
  } else {
    domains=DOM.map((d,i)=>({
      ...d,
      items:(COMP[type]?.[effectiveRole]?.[i]||[]).map(text=>({text,result:null})),
      domainResult:null, obs:''
    }));
  }
  return{
    id:genCode(), type, role:effectiveRole, mode:mode, status:'draft',
    docCode:t.code, color:t.color,
    participant:{nombres:'',apellidos:'',cargo:'',fechaCurso:'',
      prereqCheck:null,logbook:null,colada:'',turno:'',equipo:'',area:'',
      operacionObservada:'',supNombre:'',supFecha:'',telefono:'',
    },
    evaluator:{nombre:'',fecha:today()},
    domains, overallResult:null, comments:'',
    approval:null, aiRec:'', createdAt:new Date().toISOString()
  };
}
function flatEval(d){return{id:d.id,type:d.type,role:d.role,mode:d.mode||'permiso',status:d.status||'draft',doc_code:d.docCode||'',color:d.color||'#005596',participant:d.participant||{},evaluator:d.evaluator||{},domains:d.domains||[],overall_result:d.overallResult||null,comments:d.comments||'',approval:d.approval||null,ai_rec:d.aiRec||'',evaluator_signed_at:d.evaluatorSignedAt||null,site:'chilca'};}
function normalizeEval(row){return{id:row.id,type:row.type,role:row.role,mode:row.mode||'permiso',status:row.status||'draft',docCode:row.doc_code||'',color:row.color||'#005596',participant:row.participant||{nombres:'',apellidos:'',cargo:'',fechaCurso:'',prereqCheck:null,logbook:null,colada:'',turno:'',equipo:'',operacionObservada:'',supNombre:'',supFecha:'',telefono:'',area:''},evaluator:row.evaluator||{nombre:'',fecha:''},domains:row.domains||[],overallResult:row.overall_result||null,comments:row.comments||'',approval:row.approval||null,aiRec:row.ai_rec||'',evaluatorSignedAt:row.evaluator_signed_at||null,createdAt:row.created_at||new Date().toISOString(),plan:row.plan||null};}
async function saveEval(d){try{const{error}=await supabase.from('evaluaciones').upsert(flatEval(d));return!error;}catch(e){return false;}}
async function loadEval(code){try{const{data,error}=await supabase.from('evaluaciones').select('*').eq('id',code.toUpperCase().trim()).single();if(error||!data)return null;return normalizeEval(data);}catch(e){return null;}}
async function loadAllEvals(){try{const{data,error}=await supabase.from('evaluaciones').select('*').order('created_at',{ascending:false});if(error||!data)return[];return data.map(normalizeEval);}catch(e){return[];}}
const PIN_DEFAULTS={training_pin:'2025',evaluator_pin:'2723'};
async function loadPin(key){try{const{data}=await supabase.from('config').select('value').eq('key',key).single();return data?.value||PIN_DEFAULTS[key]||'2025';}catch(e){return PIN_DEFAULTS[key]||'2025';}}
async function savePin(key,pin){try{const{error}=await supabase.from('config').upsert({key,value:pin,site:'global'});return!error;}catch(e){return false;}}

// ── Licencias de equipo: datos de competencia ─────────────────────────────
// COMP_LIC[type].operador = [{k, label, sub, items:[...strings]}]
const COMP_LIC = {
  bc1: { operador: [
    { k:'preop', label:'1. Preparación e Inspección Preoperacional', sub:'EPP · Zona de exclusión · Estado del equipo', items:[
      'Selecciona y utiliza correctamente el EPP requerido para la tarea (casco, guantes, lentes, calzado de seguridad).',
      'Establece adecuadamente la zona de exclusión antes de iniciar la operación.',
      'Verifica ausencia de obstrucciones entre ruedas y rieles del pórtico.',
      'Confirma que los topes de rueda están instalados al final del riel.',
      'Inspecciona la estructura de la grúa y reporta cualquier daño visible.',
      'Verifica que la señalización de la Carga Máxima de Trabajo (SWL/CMT) sea visible y legible.',
      'Inspecciona cables o cadenas, poleas, tambores del malacate y sistema de izaje, identificando defectos.',
      'Inspecciona el gancho de izaje incluyendo el pestillo de seguridad.',
      'Inspecciona barra separadora y grilletes tipo D, si aplica.',
      'Verifica los puntos de izaje de la carga.',
      'Inspecciona eslingas y/o cadenas cuando corresponda a su rol.',
      'Verifica que la trayectoria del izaje esté libre de personas y obstáculos.',
    ]},
    { k:'controles', label:'2. Verificación de Controles y Arranque', sub:'Funciones del control · Procedimiento de arranque', items:[
      'Identifica y explica correctamente las funciones del control (pendant o radiocontrol).',
      'Ejecuta el procedimiento de arranque de acuerdo con el estándar operativo.',
      'Verifica el funcionamiento del sistema de izaje (gancho, cable o cadena).',
      'Comprueba que los controles sean de tipo "fail-safe" (al soltar, el movimiento se detiene).',
    ]},
    { k:'izaje', label:'3. Maniobra de Izaje', sub:'Posicionamiento · Traslado · Descenso', items:[
      'Posiciona el gancho correctamente sobre el centro de gravedad de la carga.',
      'Asegura la carga conforme a buenas prácticas de izaje (eslingas/cadenas por personal calificado cuando aplique).',
      'Realiza un izaje de prueba controlado para verificar estabilidad y cumplimiento de SWL/WLL.',
      'Eleva la carga de manera controlada y sin movimientos bruscos.',
      'Desplaza la carga a velocidad segura y bajo control total.',
      'Mantiene la carga fuera de zonas con personal durante el traslado.',
      'Posiciona la carga con precisión en el punto definido.',
      'Desciende la carga de forma controlada, sin impacto.',
      'Desengancha la carga de manera segura.',
    ]},
    { k:'cierre', label:'4. Cierre de Operación', sub:'Parqueo seguro · Zona de exclusión', items:[
      'Eleva el gancho a una altura segura al concluir la operación.',
      'Posiciona la grúa en el área designada de estacionamiento.',
      'Asegura que el bloque del gancho quede libre de obstrucciones.',
      'Retira la zona de exclusión de forma segura al concluir.',
    ]},
  ]},
  bc3: { operador: [
    { k:'plan', label:'Planificación del Izaje (Plan the Lift)', sub:'Heat Plan · Metal · Equipo', items:[
      'Comprende y revisa el Heat Plan antes de iniciar la operación.',
      'Verifica especificaciones del metal (tipo, cantidad y temperatura estimada).',
      'Confirma disponibilidad y buen estado de equipos y accesorios (cuchara, bridle, grúa).',
      'Identifica zonas de acceso y restricciones del área de fundición.',
      'Define y comunica las zonas de exclusión al equipo de piso.',
      'Evalúa el housekeeping del área antes de autorizar el inicio del izaje.',
    ]},
    { k:'riesgos', label:'Identificación y Control de Riesgos', sub:'Metal fundido · Zonas térmicas · Personal autorizado', items:[
      'Identifica riesgos asociados al metal fundido (salpicadura, fuga de cuchara, desbordamiento).',
      'Reconoce fallas críticas del sistema (ladle, stopper rod, mecanismo de inclinación).',
      'Identifica zonas de radiación térmica y aplica distancias seguras.',
      'Aplica controles operativos (zonas de exclusión, accesos, housekeeping, EPP térmico).',
      'Verifica que solo personal autorizado y con EPP adecuado esté presente durante el izaje.',
    ]},
    { k:'inspeccion', label:'Inspección Pre-Operacional', sub:'Grúa · Cuchara · Conexión bridle', items:[
      'Realiza el pre-start check completo de la grúa (controles, frenos, limitadores de carrera).',
      'Verifica el correcto funcionamiento de los frenos y la parada de emergencia.',
      'Inspecciona cables, cadenas y ganchos identificando desgaste o daños.',
      'Verifica ausencia de obstrucciones en el recorrido planificado de la grúa.',
      'Realiza inspección visual de la cuchara (estado del refractario, fisuras, deformaciones).',
      'Verifica el correcto funcionamiento de los mecanismos de inclinación y bloqueo de la cuchara.',
      'Confirma la correcta conexión del sistema bridle–cuchara–gancho de grúa.',
    ]},
    { k:'ejecucion', label:'Ejecución del Izaje y Transferencia', sub:'Test lift · Visión · Zonas de exclusión', items:[
      'Ubica la grúa directamente sobre el centro de gravedad de la carga antes de izar.',
      'Realiza test lift (izaje de prueba a 150–300 mm) antes del traslado definitivo.',
      'Mantiene control total del movimiento durante todo el traslado, sin movimientos bruscos.',
      'Mantiene línea de visión constante sobre la carga durante el traslado.',
      'Asegura que no haya personal bajo la carga ni en la trayectoria de traslado.',
      'Respeta estrictamente las zonas de exclusión definidas en el plan.',
      'Mantiene distancia segura del cuerpo respecto a la carga durante toda la operación.',
    ]},
    { k:'vertido', label:'Operación de Vertido (Pouring)', sub:'Control · Coordinación · Salpicaduras', items:[
      'Mantiene concentración total durante el vertido, sin distracciones.',
      'Coordina activamente con el personal de piso antes y durante el vertido.',
      'Mantiene línea de visión clara hacia el punto de vertido durante toda la operación.',
      'Ejecuta el vertido con control preciso de velocidad e inclinación de la cuchara.',
      'Evita salpicaduras o derrames mediante control adecuado de la velocidad de vertido.',
      'No gira la plataforma ni pierde contacto visual con la cuchara durante el vertido.',
      'Verifica que el personal de piso está en posición segura antes de iniciar el vertido.',
    ]},
    { k:'comunicacion', label:'Comunicación y Coordinación', sub:'Señales · Equipo de piso', items:[
      'Establece comunicación clara con el equipo de piso antes de iniciar el izaje.',
      'Responde correctamente a señales estándar del aparejador/dogman.',
      'Coordina maniobras con el equipo de piso durante el traslado y vertido.',
      'Mantiene comunicación constante durante toda la operación hasta el cierre.',
    ]},
    { k:'cierre', label:'Cierre y Post-Operación', sub:'Residuos · Inspección · Aislamiento', items:[
      'Drena el metal residual correctamente en la zona designada al concluir.',
      'Posiciona la cuchara vacía en la zona de estacionamiento seguro.',
      'Realiza la inspección post-operacional de grúa y cuchara.',
      'Reporta fallas, desviaciones o condiciones anómalas detectadas durante la operación.',
      'Deja la grúa en la posición de parqueo designada.',
      'Asegura el aislamiento del equipo al finalizar la jornada.',
    ]},
  ]},
  montacargas: { operador: [
    { k:'oral', label:'Evaluación Oral', sub:'Preguntas de conocimiento', items:[
      'Describe su experiencia en el uso del montacargas y conoce los alcances operativos seguros del equipo.',
      'Describe correctamente el procedimiento ante placa de capacidad ilegible o ausente: aislar el equipo, colocar etiqueta "Fuera de servicio", registrar y reportar al supervisor.',
      'Describe el procedimiento correcto ante defectos detectados en el checklist preoperacional: no operar, aislar, etiquetar "Fuera de servicio", registrar en el libro de registro y reportar al supervisor.',
      'Explica correctamente cómo establecer la capacidad y limitaciones del montacargas: verificar la placa de cumplimiento y comparar con el peso de la carga.',
      'Describe la técnica correcta para circular en superficie inclinada: retroceder hacia abajo con la carga hacia arriba, nunca descender de frente con carga.',
      'Nombra al menos 3 condiciones que pueden provocar volcamiento lateral: velocidad excesiva, giro brusco, curva cerrada, superficie irregular, carga desequilibrada.',
      'Nombra al menos 3 condiciones que pueden provocar volcamiento frontal: carga excesiva, viajar con mástil muy elevado, descender de frente en rampa, frenar con carga alta.',
      'Sabe qué hacer si la carga obstruye la visión: conducir en reversa o utilizar un observador posicionado correctamente.',
      'Confirma que no está permitido transportar pasajeros en las cuchillas y describe el procedimiento ante contacto accidental con conductor eléctrico activo (permanecer en el equipo, advertir al área, esperar aislamiento de la fuente).',
    ]},
    { k:'practica', label:'Evaluación Práctica', sub:'Inspección preoperacional · Operación · Cierre', items:[
      'Selecciona y utiliza el EPP correcto para la tarea (casco, guantes, calzado de seguridad, chaleco).',
      'Aísla el equipo antes de iniciar la inspección preoperacional.',
      'Verifica todos los sistemas hidráulicos para detectar fugas externas.',
      'Verifica el nivel de aceite hidráulico.',
      'Verifica que las mangueras hidráulicas estén en buen estado y sin daños.',
      'Verifica el nivel de aceite del motor.',
      'Verifica que la tapa del radiador esté bien cerrada y el nivel del refrigerante.',
      'Verifica que la(s) batería(s) estén aseguradas y el nivel del electrolito sea correcto.',
      'Inspecciona el mástil para detectar grietas, deformaciones o daños.',
      'Revisa las cuchillas para detectar daños, grietas en el talón o deformaciones.',
      'Comprueba que las cadenas estén adecuadamente lubricadas y libres de daños.',
      'Comprueba que el extintor de incendios esté cargado y en condiciones operativas.',
      'Comprueba el estado de los neumáticos (presión, desgaste, daños).',
      'Verifica la placa de capacidad y cumplimiento: legible, aplicable al equipo y explica la información que proporciona.',
      'Verifica que el asiento y cinturón de seguridad estén en buen estado de funcionamiento.',
      'Mantiene los 3 puntos de contacto al subir y bajar del montacargas.',
      'Comprueba el correcto funcionamiento de faros, luces intermitentes, baliza, luces de marcha atrás y luces de freno.',
      'Verifica que la alarma de marcha atrás esté operativa.',
      'Comprueba el funcionamiento del claxon/bocina.',
      'Usa y ajusta el cinturón de seguridad al inicio de la operación.',
      'Comprueba la dirección y la respuesta del volante.',
      'Verifica la presión y respuesta del pedal del freno de servicio.',
      'Realiza función hidráulica completa del mástil y las cuchillas antes de partir.',
      'Cede el paso al resto del tráfico y verifica el entorno antes de arrancar.',
      'Evalúa el peso de la carga antes de levantarla para confirmar que está dentro de la capacidad del equipo.',
      'Sigue y mantiene la ruta/plan de viaje acordado en el área.',
      'Inserta las cuchillas de forma limpia y centrada, con el mínimo contacto con el palet.',
      'Asegura que el mástil esté vertical o ligeramente inclinado hacia atrás para estabilizar la carga.',
      'Verifica espacio libre suficiente antes de desplazarse con el mástil ligeramente inclinado hacia atrás y a la altura de desplazamiento correcta.',
      'Viaja a una velocidad segura y adaptada a las condiciones del entorno.',
      'Opera todos los controles con suavidad, sin movimientos bruscos.',
      'Asegura que la carga se asiente de manera uniforme antes de retirar las cuchillas en el punto de depósito.',
      'Retira las cuchillas de forma limpia y controlada.',
      'Estaciona el montacargas en un lugar adecuado y designado.',
      'Baja las cuchillas planas sobre el suelo, aplica el freno de estacionamiento y apaga el encendido.',
      'Mantiene 3 puntos de contacto al bajarse del montacargas.',
    ]},
  ]},
  montacargas_e: { operador: [
    { k:'oral', label:'Evaluación Oral', sub:'Preguntas de conocimiento (aplica a ambos tipos)', items:[
      'Describe su experiencia en el uso del montacargas y conoce los alcances operativos seguros del equipo.',
      'Describe correctamente el procedimiento ante placa de capacidad ilegible o ausente: aislar el equipo, colocar etiqueta "Fuera de servicio", registrar y reportar al supervisor.',
      'Describe el procedimiento correcto ante defectos detectados en el checklist preoperacional: no operar, aislar, etiquetar "Fuera de servicio", registrar en el libro de registro y reportar al supervisor.',
      'Explica correctamente cómo establecer la capacidad y limitaciones del montacargas: verificar la placa de cumplimiento y comparar con el peso de la carga.',
      'Describe la técnica correcta para circular en superficie inclinada: retroceder hacia abajo con la carga hacia arriba, nunca descender de frente con carga.',
      'Nombra al menos 3 condiciones que pueden provocar volcamiento lateral: velocidad excesiva, giro brusco, curva cerrada, superficie irregular, carga desequilibrada.',
      'Nombra al menos 3 condiciones que pueden provocar volcamiento frontal: carga excesiva, viajar con mástil muy elevado, descender de frente en rampa, frenar con carga alta.',
      'Sabe qué hacer si la carga obstruye la visión: conducir en reversa o utilizar un observador correctamente posicionado.',
      'Confirma que no está permitido transportar pasajeros en las cuchillas y describe el procedimiento ante contacto accidental con conductor eléctrico activo.',
    ]},
    { k:'insp', label:'Inspección del equipo', sub:'Baterías · Sistemas · Visibilidad', items:[
      'Verifica el estado de las baterías del equipo.',
      'Verifica el nivel de carga de las baterías.',
      'Verifica el estado del cargador y conexiones eléctricas.',
      'Verifica cámaras y monitores del equipo.',
      'Verifica Blue Spot o sistema de advertencia visual.',
      'Verifica espejos y visibilidad del operador.',
      'Verifica el sistema de inclinación del mástil.',
      'Verifica el sistema hidráulico.',
      'Verifica la placa de capacidad del equipo.',
    ]},
    { k:'op', label:'Operación', sub:'Check List · EPP · Carga · Desplazamiento', items:[
      'Realiza el Check List pre operacional.',
      'Utiliza los EPP requeridos.',
      'Mantiene los 3 puntos de contacto al subir y bajar del equipo.',
      'Utiliza el cinturón de seguridad.',
      'Realiza una inspección del área de trabajo antes de iniciar.',
      'Verifica la ruta de tránsito antes de desplazarse.',
      'Evalúa el peso y dimensiones de la carga antes de levantarla.',
      'Verifica el centro de gravedad de la carga.',
      'Posiciona correctamente las cuchillas antes del levantamiento.',
      'Levanta la carga suavemente y de forma controlada.',
      'Mantiene la carga en posición segura durante el desplazamiento.',
      'Utiliza el claxon en cruces y puntos ciegos.',
      'Mantiene velocidad segura y adaptada a las condiciones.',
      'Respeta los límites de operación del equipo.',
      'Mantiene distancia segura respecto de peatones y estructuras.',
      'Utiliza un spotter cuando la visibilidad es limitada.',
    ]},
    { k:'man', label:'Maniobras críticas', sub:'Apilamiento · Espacios reducidos · Giros', items:[
      'Realiza el apilamiento de la carga correctamente.',
      'Deposita la carga de forma segura.',
      'Opera en espacios reducidos con control y precisión.',
      'Realiza maniobras de giro controladas.',
      'Mantiene el mástil en posición adecuada durante el desplazamiento.',
      'Verifica el espacio libre superior y lateral antes de maniobrar.',
      'Identifica condiciones inseguras antes de iniciar la maniobra.',
    ]},
    { k:'fin', label:'Finalización', sub:'Estacionamiento · Procedimiento de apagado', items:[
      'Estaciona el equipo en el área autorizada.',
      'Baja completamente las cuchillas al finalizar.',
      'Aplica el freno de estacionamiento.',
      'Apaga el equipo siguiendo el procedimiento establecido.',
      'Mantiene los tres puntos de contacto al descender del equipo.',
    ]},
  ]},
  manlift3b: { operador: [
    { k:'s', label:'SABER', sub:'Conocimiento del equipo y normativa', items:[
      'Identifica las partes críticas del manlift de brazo articulado (plataforma, brazo principal, brazo pluma, controles de canastilla y tierra, sensores de inclinación).',
      'Conoce la capacidad máxima de carga (454 kg), la altura de trabajo (17.80 m) y el alcance horizontal (9.00 m) del equipo E18 AJ RT.',
      'Reconoce el funcionamiento del sistema anti-atrapamiento y el procedimiento de bajada de emergencia desde tierra.',
      'Describe los protocolos de respuesta ante fallas del equipo, alarmas o accidentes en altura.',
      'Reconoce las normativas peruanas aplicables a la operación: Ley 29783, DS 005-2012-TR, DS 024-2016-EM.',
      'Conoce los pictogramas de riesgo del equipo, el plan de señalización perimetral y los controles administrativos aplicables.',
    ]},
    { k:'sh', label:'SABER HACER', sub:'Inspección · Operación · Estacionamiento', items:[
      'Realiza la inspección preoperacional completa: nivel de batería, estado de neumáticos OTR, sistemas hidráulicos, controles de plataforma y tierra.',
      'Verifica la operatividad del sistema anti-atrapamiento y del sensor de inclinación antes de elevar.',
      'Opera los controles proporcionales con fluidez y precisión, sin movimientos bruscos.',
      'Usa arnés de seguridad con línea de vida anclada al punto designado en la canastilla durante toda la operación elevada.',
      'Aplica bloqueo de ruedas, verifica la nivelación del terreno y respeta las pendientes máximas de operación (40%).',
      'Demuestra manejo correcto del analizador de fallas incorporado y responde adecuadamente a alarmas del sistema.',
      'Estaciona correctamente el equipo al finalizar: terreno firme, plataforma descendida, freno aplicado, energía desconectada.',
    ]},
    { k:'ss', label:'SABER SER', sub:'Actitud · Autocuidado · Reporte', items:[
      'Usa el EPP completo sin necesidad de recordatorio (arnés, casco, lentes de seguridad, guantes, calzado antideslizante).',
      'Mantiene concentración plena durante la operación, evitando distracciones (teléfono, conversaciones).',
      'Reporta inmediatamente cualquier anomalía detectada: fallas de sensores, niveles de batería bajos, funcionamiento hidráulico irregular.',
      'Respeta estrictamente los protocolos de operación incluso bajo presión de tiempo u operativa.',
      'Mantiene el orden y la limpieza del área de trabajo, eliminando obstáculos antes de posicionar el equipo.',
    ]},
    { k:'sc', label:'SABER CONVIVIR', sub:'Comunicación · Coordinación · Equipo', items:[
      'Comunica los movimientos de la plataforma al personal en tierra mediante radio o señas claras antes de cada desplazamiento.',
      'Coordina con otros equipos y operadores para evitar interferencias en el área de trabajo durante la operación elevada.',
      'Acepta retroalimentación del supervisor y corrige las técnicas de operación según las indicaciones recibidas.',
      'Participa activamente en charlas y briefings de seguridad antes de iniciar la operación.',
      'Apoya y guía a compañeros menos experimentados en el uso seguro del equipo, sin realizar operaciones en lugar de ellos.',
    ]},
  ]},
  tijera3a: { operador: [
    { k:'s', label:'SABER', sub:'Conocimiento del equipo y normativa', items:[
      'Identifica las partes críticas del elevador de tijera (plataforma, mecanismo de tijera, barandas, controles de plataforma y tierra, sensor de inclinación y niveles de batería).',
      'Conoce la capacidad máxima de carga, la altura de trabajo máxima permitida del equipo y las condiciones de superficie que limitan su operación.',
      'Reconoce el funcionamiento del sistema de descenso de emergencia y los controles de tierra para descender la plataforma en caso de fallo.',
      'Describe los riesgos específicos del elevador de tijera (vuelco por superficie irregular o pendiente, cizallamiento, caída de objetos, caída desde plataforma).',
      'Reconoce las normativas peruanas aplicables: Ley 29783, DS 005-2012-TR, DS 024-2016-EM, y los requisitos de trabajo en altura.',
      'Conoce los requisitos de zona de exclusión perimetral, señalización durante operación elevada y comunicación con personal en tierra.',
    ]},
    { k:'sh', label:'SABER HACER', sub:'Inspección · Operación · Estacionamiento', items:[
      'Realiza la inspección preoperacional completa: nivel de batería o combustible, estado hidráulico, ruedas, barandas y portilla de acceso, controles de plataforma y tierra.',
      'Verifica la nivelación del terreno y aplica bloqueadores de ruedas antes de elevar la plataforma.',
      'Opera los controles de elevación y traslado desde la plataforma con suavidad y precisión.',
      'Usa arnés de seguridad con línea de vida anclada al punto designado en la plataforma durante toda la operación en altura.',
      'Verifica que la carga total (personas + materiales + herramientas) no supere la capacidad nominal y está distribuida uniformemente sobre la plataforma.',
      'Desciende la plataforma completamente antes de trasladar el equipo a una nueva posición de trabajo.',
      'Estaciona correctamente: plataforma descendida, freno de estacionamiento aplicado, energía desconectada y accesos asegurados.',
    ]},
    { k:'ss', label:'SABER SER', sub:'Actitud · Autocuidado · Reporte', items:[
      'Usa el EPP completo sin necesidad de recordatorio (arnés, casco, lentes de seguridad, guantes, calzado antideslizante).',
      'Verifica las condiciones del terreno y la nivelación antes de elevar, rechazando la operación sobre superficies no adecuadas.',
      'Reporta inmediatamente anomalías mecánicas, hidráulicas o eléctricas al supervisor, etiqueta el equipo como "Fuera de servicio" y no lo pone en servicio hasta su reparación.',
      'Respeta estrictamente la prohibición de mover el equipo con la plataforma elevada bajo cualquier circunstancia.',
      'Mantiene la zona bajo la plataforma libre de personal durante toda la operación elevada.',
    ]},
    { k:'sc', label:'SABER CONVIVIR', sub:'Comunicación · Coordinación · Equipo', items:[
      'Informa al personal de tierra el inicio y fin de cada operación elevada, manteniendo comunicación constante durante la permanencia en altura.',
      'Coordina con otros equipos y operadores para evitar interferencias y accesos no autorizados bajo la plataforma durante la elevación.',
      'Acepta retroalimentación del supervisor y aplica correcciones inmediatas en la técnica de operación.',
      'Participa en briefings de seguridad y verifica que todos conocen la señal de evacuación antes de elevar.',
      'Fomenta el respeto por la zona de exclusión entre compañeros, rechazando activamente el acceso no autorizado al área de trabajo.',
    ]},
  ]},

bm1: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio', sub:'Casco · Visor · Guantes refractarios · Mandil · Polainas', items:[
      'Utilizó correctamente todo el EPP requerido: casco, visor de calor de cuerpo completo, guantes de aluminio o cuero refractario, mandil, polainas y calzado de seguridad.',
      'Verificó el estado de su EPP antes de ingresar al área del horno.',
      'No ingresó al área de carga sin el EPP completo en ningún momento de la evaluación.',
    ]},
    { k:'preop', label:'2. Evaluación del área y preparación preoperacional', sub:'Heat Sheet · Peligros · Equipos auxiliares', items:[
      'Planificó la tarea revisando la hoja de carga / Heat Sheet antes de iniciar.',
      'Identificó y evaluó los peligros relevantes: scrap húmedo, sellado, con materiales extraños o contaminados.',
      'Controló los peligros: apartó scrap no conforme, verificó área libre de agua y aceite.',
      'Realizó la pre-inspección de equipos auxiliares: grúa de carga (BC1), balanza y magneto (si aplica).',
    ]},
    { k:'carga', label:'3. Operaciones de preparación y carga al horno de inducción', sub:'Balanza · Selección de scrap · Hoja de carga', items:[
      'Llevó a cero (zeroed) la balanza de scrap antes de iniciar la pesada.',
      'Seleccionó el scrap correcto según la especificación: tipo, porcentaje de mezcla y peso indicado en la hoja de carga.',
      'Armó correctamente el balde/tolva de carga: primero materiales más ligeros y de menor punto de fusión, luego los de mayor densidad.',
      'Registró los pesos y materiales correctamente en la hoja de carga al finalizar.',
    ]},
    { k:'seguro', label:'4. Comportamientos seguros y concentración', sub:'Zonas de exclusión · Orden · Foco', items:[
      'Mantuvo zonas de exclusión activas en todo momento durante el manejo de cargas y magneto.',
      'Mantuvo la concentración durante toda la secuencia sin distracciones.',
      'Mantuvo el área de trabajo ordenada y libre de riesgos de tropiezos durante la operación.',
    ]},
    { k:'wi', label:'5. Operación de equipos conforme a WI del sitio', sub:'BC1 · Balanza · Magneto', items:[
      'Operó la grúa de carga (BC1) con licencia BC1 vigente y dentro de los parámetros de seguridad.',
      'Operó la balanza de scrap según el procedimiento: tara, pesada progresiva y registro.',
      'Siguió el procedimiento de uso del magneto: carga baja, zona de exclusión, sin personal bajo la carga.',
      'No utilizó barras de palanca ni herramientas no autorizadas para desatascar balde/tolva sin supervisión directa.',
    ]},
    { k:'result', label:'6. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Especificación · Sin incidentes · Documentación', items:[
      'La carga preparada cumplió con el peso objetivo y la especificación de la colada indicados en la hoja de carga.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'Entregó la hoja de carga completada correctamente al fundidor / supervisor al cierre de la operación.',
      'Comunicó el estado del área y observaciones relevantes al turno entrante o al fundidor.',
    ]},
  ]},
  bm2: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio', sub:'Casco · Visor completo · Guantes refractarios', items:[
      'Utilizó correctamente todo el EPP requerido: casco, visor de calor de cuerpo completo, guantes de aluminio o cuero refractario, mandil, polainas y calzado de seguridad.',
      'Verificó el estado de su EPP antes de ingresar al área del horno.',
    ]},
    { k:'arranque', label:'2. Procedimientos de arranque y apagado del horno de inducción', sub:'Inspección preoperacional · Warm-up', items:[
      'Realizó la inspección preoperacional del horno y controles antes de energizar.',
      'Aplicó los tiempos y parámetros de calentamiento (warm-up) correspondientes al tipo de revestimiento en uso.',
    ]},
    { k:'eld', label:'3. Inspección del revestimiento y verificación de fuga a tierra (ELD)', sub:'Desgaste · Parchado · Umbrales 30 mA / 40 mA', items:[
      'Inspeccionó visualmente el revestimiento del horno en el vaciado: identificó puntos negros irregulares como señales de desgaste.',
      'Midió el desgaste del revestimiento y verificó que no supera el desgaste máximo permisible del sitio.',
      'Realizó el parchado (patching) del revestimiento según el procedimiento, usando materiales compatibles.',
      'Interpretó correctamente la lectura del ELD: identificó los umbrales de acción (30 mA: notificar supervisor/mantenimiento; 40 mA: notificar gerencia, evaluar evacuación).',
      'Registró las lecturas de ELD en el formulario correspondiente.',
    ]},
    { k:'fusion', label:'4. Operación de fusión y conocimientos metalúrgicos', sub:'Potencia · Bridging · Temperatura · Espectrómetro · Aleaciones', items:[
      'Seleccionó y ajustó la potencia del horno (power setting) conforme a la etapa del proceso y la especificación de la colada.',
      'Monitoreó continuamente el proceso de fusión para detectar bridging: ante cualquier indicio, cortó la potencia de inmediato y notificó al supervisor.',
      'Tomó temperaturas del metal en las etapas requeridas usando termopar/lance y registró los valores en la hoja de colada.',
      'Tomó muestras de metal en los momentos correctos usando el método apropiado (inmersión o cuchara) y las envió al espectrómetro.',
      'Interpretó correctamente la composición química resultado del espectrómetro y la comparó con la especificación del grado requerido.',
      'Adicionó aleaciones en el orden correcto, en cantidades conformes a la hoja de carga, verificando que estén secas e identificadas.',
      'Nunca adicionó un material no identificado al horno.',
    ]},
    { k:'slag', label:'5. Operaciones de escorificación (Slagging)', sub:'Momento · Coagulantes · Skimmer · Disposición', items:[
      'Identificó correctamente el momento de escorificar: antes del muestreo y antes del sangrado.',
      'Utilizó coagulantes para aglomerar la escoria conforme a la práctica del sitio.',
      'Ejecutó la escorificación con la herramienta correcta (skimmer), en posición segura, con personal fuera de la zona de proyecciones.',
      'Dispuso la escoria en el recipiente/bin designado, evitando derrames en el área de trabajo.',
      'Aplicó técnicas correctas de manejo manual durante la operación de escorificación.',
    ]},
    { k:'tap', label:'6. Preparación y ejecución del sangrado (Tapping)', sub:'Temperatura · Aleaciones · Cuchara precalentada', items:[
      'Verificó que la escoria fue completamente removida antes de iniciar el sangrado.',
      'Determinó y ajustó la temperatura de sangrado correcta para el grado en proceso.',
      'Definió el orden de adición de aleaciones: cuáles van al horno y cuáles a la cuchara.',
      'Confirmó las posiciones del personal y que las zonas de exclusión estaban activas antes de iniciar el sangrado.',
      'Determinó el punto de toma de la muestra final (horno o cuchara) conforme al procedimiento.',
      'Ejecutó el sangrado de forma controlada, sin derrames ni proyecciones atribuibles a mala práctica.',
      'Verificó que la cuchara estuviera correctamente preparada y precalentada antes de recibir el metal.',
    ]},
    { k:'bc3', label:'7. Comportamientos seguros con grúa BC3 y transferencia de cucharas', sub:'Licencia vigente · Zonas de exclusión · Metal fundido', items:[
      'Operó la grúa BC3 con licencia vigente y dentro de los parámetros de seguridad para metales fundidos.',
      'Verificó la preparación y estado de la cuchara antes de la transferencia (estado del revestimiento).',
      'Mantuvo zonas de exclusión activas bajo toda carga suspendida con metal fundido.',
      'Mantuvo las cargas lo más bajas posible durante el traslado y los pasillos despejados.',
    ]},
    { k:'seguro', label:'8. Comportamientos seguros y concentración', sub:'WI del sitio · Orden · Consulta ante dudas', items:[
      'Siguió en todo momento las Instrucciones de Trabajo (WI) del sitio para operación de horno de inducción.',
      'Mantuvo el área del horno ordenada y libre de riesgos de tropiezos.',
      'No realizó ninguna operación crítica (potencia, sangrado, adición de aleaciones) sin confirmación con el fundidor o supervisor cuando tenía dudas.',
      'Mantuvo la concentración durante toda la duración de la evaluación sin distracciones.',
    ]},
    { k:'result', label:'9. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Composición química · Temperatura de sangrado', items:[
      'La composición química final de la colada cumplió con la especificación del grado requerido.',
      'La temperatura de sangrado estuvo dentro del rango aprobado para el grado procesado.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'El resultado de la colada y la documentación de la hoja de colada fueron entregados correctamente al finalizar.',
    ]},
  ]},
  bm3: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio', sub:'Casco · Lentes · Mascarilla P2 · Tyvek · Guantes refractarios', items:[
      'Utilizó correctamente: casco, lentes de seguridad o careta, protección respiratoria (mascarilla antipolvo P2 mínimo) al manipular polvo refractario y traje Tyvek.',
      'Seleccionó EPP adicional según la tarea: visor de calor y guantes refractarios para parchado en caliente.',
      'No ingresó al área de trabajo sin el EPP correcto en ningún momento de la evaluación.',
    ]},
    { k:'preop', label:'2. Evaluación del área, planificación y controles previos', sub:'Tipo de trabajo · Peligros · LOTOTO · Material refractario', items:[
      'Planificó la tarea: identificó el tipo de trabajo refractario a realizar, los materiales necesarios y verificó disponibilidad de stock.',
      'Identificó y evaluó los peligros relevantes: quemaduras, exposición a polvo refractario, vibración, herramientas eléctricas, pellizcos, lesiones oculares y riesgo de explosión por curado inadecuado.',
      'Controló los peligros: aisló el horno mediante LOTOTO antes de ingresar al área (cambio completo de revestimiento), verificó material refractario sin humedad ni vencido.',
      'Realizó controles previos al inicio: estado del material refractario (fecha, humedad), herramientas disponibles, dimensiones medidas y registradas.',
    ]},
    { k:'refrac', label:'3. Operaciones de trabajo refractario', sub:'Revestimiento completo · Parchado · Cuchara', items:[
      'Revestimiento completo de horno – retirada: ejecutó LOTOTO, retiró pico y tapa con martillo neumático, eliminó acumulación de metal, separó revestimiento, posicionó pistón empujador con grúa aérea y expulsó revestimiento de forma controlada.',
      'Revestimiento completo de horno – instalación de mica y sonda ELD: instaló papel mica con solapamiento de 30 mm, cortó orificio para sonda ELD, centró y conectó sonda con la secuencia correcta (arandela, tuerca, cable, arandela, dos tuercas).',
      'Revestimiento completo de horno – instalación del polvo refractario: instaló en capas (60 mm base, apisonado, capas adicionales), niveló base, vibró 10-15 min, colocó formaleta centrada y nivelada, llenó con tenedor cada 100 mm y vibró progresivamente (100 mm/minuto).',
      'Reparación / parchado de horno: inspeccionó revestimiento en cada vaciado, identificó señales de desgaste (puntos negros, depresiones), eliminó material suelto y escoria antes del parche, aplicó material de parche presionando firmemente.',
      'En todos los casos: midió dimensiones antes y después de la instalación/reparación y registró en la hoja de reparación.',
    ]},
    { k:'seguro', label:'4. Comportamientos seguros y concentración', sub:'Manejo manual · Orden · LOTOTO · Curado', items:[
      'Aplicó técnicas correctas de manejo manual durante toda la tarea (levantamiento y transporte de sacos de refractario).',
      'Mantuvo el área de trabajo limpia y ordenada durante y al finalizar; no dejó herramientas dentro del horno.',
      'Reportó de inmediato al supervisor cualquier incidente, cuasi-accidente o condición anómala.',
      'No aceleró el curado de castables o apisonables con calor excesivo sin seguir la curva de sinterización establecida.',
      'Retiró las etiquetas LOTOTO según procedimiento únicamente al finalizar el trabajo y salir del área del horno.',
    ]},
    { k:'result', label:'5. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Sin incidentes · Documentación · Consumo de refractario', items:[
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'Entregó la hoja de reparación del horno/cuchara completada correctamente al supervisor de fundición para su firma.',
      'Completó la documentación de consumo de refractario y la entregó al coordinador de turno.',
    ]},
  ]},
  bm4: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio', sub:'Casco · Visor completo · Guantes refractarios · Mandil · Polainas', items:[
      'Utilizó correctamente todo el EPP requerido para vaciado: casco, visor de calor de cuerpo completo, guantes de aluminio o cuero refractario, mandil, polainas y calzado de seguridad.',
      'Verificó el estado de su EPP antes de ingresar al área de vaciado.',
      'No realizó ninguna operación de vaciado sin el EPP completo en ningún momento de la evaluación.',
    ]},
    { k:'preop', label:'2. Evaluación del área y preparación preoperacional', sub:'Grado · Temperatura · Moldes · Cuchara precalentada', items:[
      'Planificó la tarea: confirmó grado, temperatura de vaciado requerida, secuencia de moldes y posición de pig moulds para el exceso de metal.',
      'Identificó y evaluó los peligros relevantes: desbordamiento de cuchara, fallo de varilla de tapón, exposición al calor, quemaduras, puntos de aplastamiento y atrapamiento.',
      'Controló los peligros: verificó el pozo de sangrado libre de humedad, confirmó la posición del pozo de recolección de emergencia y que los pasillos de evacuación estuvieran despejados.',
      'Realizó la inspección preoperacional de la cuchara: revestimiento (espesor, puntos de desgaste en boquilla, codos y áreas de impacto), estado de la varilla de tapón, ausencia de puntos calientes y funcionamiento del mecanismo de giro.',
      'Verificó que la cuchara estuviera precalentada según el procedimiento del sitio antes de recibir el metal.',
    ]},
    { k:'vaciado', label:'3. Operación de vaciado', sub:'Chorro centrado · Velocidad · Pig moulds · Inspección post-vaciado', items:[
      'Inspeccionó las cucharas identificando las áreas críticas de desgaste: boquilla, codos, área de impacto y portaboquilla; señaló cualquier condición fuera de rango al evaluador.',
      'Confirmó la temperatura correcta de vaciado para el grado en proceso consultando con el controlador / fundidor antes de iniciar.',
      'Ejecutó el vaciado con precisión: mantuvo el chorro centrado en la copa de vaciado de cada molde, sin salpicaduras, a la velocidad adecuada.',
      'Mantuvo el nivel de metal en la cuchara por encima del mínimo para evitar la entrada de escoria al molde por el pico.',
      'Dirigió el exceso de metal a los pig moulds (chanchos) al finalizar el vaciado, sin derramar sobre el piso.',
      'Realizó la limpieza e inspección de la cuchara después del vaciado y reportó condiciones anómalas al supervisor.',
    ]},
    { k:'seguro', label:'4. Comportamientos seguros y concentración', sub:'Zonas de exclusión · Varilla de tapón · Sin distracciones', items:[
      'Mantuvo zonas de exclusión activas en todo momento: no permitió personal no autorizado en el área de vaciado durante la operación.',
      'Ante cualquier señal de fallo de la varilla de tapón o desbordamiento inminente, detuvo la operación y notificó al supervisor de inmediato.',
      'No realizó movimientos bruscos con la cuchara que pudieran generar salpicaduras de metal fundido.',
      'Mantuvo el área de trabajo ordenada y libre de riesgos de tropiezos durante la operación.',
      'Mantuvo la concentración durante toda la secuencia de vaciado sin distracciones.',
    ]},
    { k:'wi', label:'5. Operación de equipos conforme a WI del sitio', sub:'BC3 · Tipo de cuchara · Precalentamiento · Pirómetro', items:[
      'Operó la grúa de metales fundidos (BC3) con licencia vigente para el transporte y posicionamiento de la cuchara.',
      'Configuró correctamente el tipo de cuchara según la operación.',
      'Siguió el procedimiento del sitio para el precalentamiento de cuchara y pico antes de recibir metal.',
      'Utilizó el pirómetro / termopar correctamente para verificar la temperatura de vaciado antes de iniciar.',
    ]},
    { k:'result', label:'6. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Sin desbordamientos · Temperatura correcta · Documentación', items:[
      'Los moldes fueron vaciados sin desbordamientos, salpicaduras significativas ni entradas de escoria atribuibles a mala técnica.',
      'La temperatura de vaciado estuvo dentro del rango aprobado para el grado procesado durante toda la secuencia.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'Completó la documentación de vaciado (registro de temperaturas, colada, moldes vaciados) y la entregó correctamente al finalizar el turno.',
    ]},
  ]},
  bm5: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio', sub:'Casco · Visor completo · Guantes refractarios · Mandil · Polainas', items:[
      'Utilizó correctamente todo el EPP requerido: casco, visor de calor de cuerpo completo, guantes de aluminio o cuero refractario, mandil, polainas y calzado de seguridad.',
      'Verificó el estado de su EPP antes de ingresar al área de vaciado.',
      'No realizó ninguna operación de control de vaciado sin el EPP completo.',
    ]},
    { k:'preop', label:'2. Evaluación del área, planificación y controles previos', sub:'Secuencia de moldes · Temperatura · Pig moulds · Peligros', items:[
      'Planificó la tarea: verificó la secuencia de moldes a vaciar, la temperatura de vaciado requerida para el grado en proceso y la disponibilidad de pig moulds para el exceso de metal.',
      'Identificó y evaluó los peligros relevantes: quemaduras, estrés por calor, calor radiante, salpicaduras de metal, desbordamiento de cuchara/molde, puntos de aplastamiento y caídas.',
      'Controló los peligros: verificó el pozo de sangrado libre de humedad, confirmó la posición del pozo de recolección de emergencia y que los pasillos de la línea de vaciado estuvieran despejados.',
    ]},
    { k:'control', label:'3. Control de calidad y supervisión del proceso de vaciado', sub:'Velocidad · Temperatura · Muestra final · Decisión de parada', items:[
      'Supervisó activamente la velocidad de vaciado del operador BM4 durante toda la secuencia, interviniendo cuando la velocidad no cumplía con los criterios del método.',
      'Tomó las temperaturas del metal en los momentos requeridos usando pirómetro o termopar, registrando los valores en el formulario de colada.',
      'Tomó la muestra final conforme al procedimiento del sitio y la envió correctamente para análisis.',
      'Confirmó cada molde vaciado en las tarjetas de control del sitio de forma precisa y oportuna.',
      'Tomó la decisión de detener el vaciado cuando algún criterio del método no se cumplió, notificando de inmediato al fundidor responsable.',
    ]},
    { k:'linea', label:'4. Operación y organización de la línea de vaciado', sub:'Secuencia · WI · Coordinación BM4 · Pig moulds', items:[
      'Organizó correctamente la secuencia de vaciado de moldes según el plan de producción del turno.',
      'Operó la línea de vaciado conforme al procedimiento del sitio y dentro de los parámetros de seguridad.',
      'Coordinó eficazmente con el operador de vaciado (BM4) y el personal de fundición durante toda la secuencia.',
      'Dirigió el exceso de metal a los pig moulds (chanchos) al finalizar el vaciado, sin derrames sobre el piso.',
    ]},
    { k:'doc', label:'5. Registro y documentación del proceso de vaciado', sub:'Temperaturas · Plataforma digital · Formulario de colada', items:[
      'Registró correctamente toda la información relevante de la colada: temperaturas, tiempos, moldes vaciados, incidencias.',
      'Ingresó los datos en la plataforma digital del sitio de forma completa y sin errores.',
      'Completó y entregó el formulario de colada al fundidor responsable al finalizar la operación.',
    ]},
    { k:'seguro', label:'6. Comportamientos seguros y concentración', sub:'Zonas de exclusión · Criterios de parada · Reporte de incidentes', items:[
      'Mantuvo zonas de exclusión activas en todo momento durante la operación de vaciado.',
      'Ante cualquier condición de riesgo (desbordamiento inminente, fallo de cuchara, temperatura fuera de rango), detuvo la operación y notificó al supervisor de inmediato.',
      'Mantuvo la concentración durante toda la secuencia de vaciado sin distracciones.',
      'Reportó todo incidente o cuasi-accidente al supervisor de turno de forma inmediata usando el formulario del sitio.',
    ]},
    { k:'wi', label:'7. Operación de equipos conforme a WI del sitio', sub:'Línea de vaciado · Pirómetro', items:[
      'Operó todos los equipos de la línea de vaciado dentro de los parámetros y procedimientos establecidos en las WI del sitio.',
      'Utilizó correctamente el pirómetro / termopar para medición de temperaturas.',
    ]},
    { k:'result', label:'8. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Sin desbordamientos · Temperatura correcta · Sin incidentes · Documentación', items:[
      'La secuencia de vaciado se completó sin desbordamientos, salpicaduras significativas ni entradas de escoria atribuibles a deficiencias en el control.',
      'Las temperaturas de vaciado estuvieron dentro del rango aprobado para el grado procesado durante toda la secuencia.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'Toda la documentación de la colada fue completada correctamente y entregada al finalizar el turno.',
    ]},
  ]},
  bm6: { operador: [
    { k:'epp', label:'1. Requisitos de EPP para operación del espectrómetro', sub:'Lentes · Guantes para muestras calientes · Calzado', items:[
      'Utilizó correctamente el EPP requerido en el área del espectrómetro: lentes de seguridad, guantes apropiados para el manejo de muestras calientes y calzado de seguridad.',
      'Utilizó protección adicional al manipular muestras calientes provenientes del horno: guantes refractarios o de cuero.',
      'No manipuló muestras metálicas sin EPP en ningún momento de la evaluación.',
    ]},
    { k:'preop', label:'2. Evaluación del área y controles previos al inicio', sub:'Muestras · Patrones · Argón · Estado del equipo', items:[
      'Planificó la tarea: verificó disponibilidad de muestras, patrones de control, patrones de configuración y suministro de argón antes de iniciar.',
      'Identificó y evaluó los peligros relevantes: quemaduras por muestras calientes, laceraciones, abrasiones durante el pulido, exposición al calor y pinzamientos en el equipo de preparación.',
      'Controló los peligros: superficies de trabajo ordenadas, recipientes para muestras calientes en posición correcta, equipos de pulido inspeccionados.',
      'Realizó los controles previos al inicio: verificó el estado del espectrómetro (diagnóstico en pantalla), disponibilidad de argón, limpieza de soporte y electrodo, sellos y o-rings en buen estado.',
    ]},
    { k:'operacion', label:'3. Operación del espectrómetro', sub:'Preparación de muestra · Pulido · Calibración · Análisis · Drift', items:[
      'Preparación de la muestra: enfrió rápidamente la muestra del horno usando el método del sitio; verificó que la muestra estuviera plana, sin porosidades ni agujeros significativos.',
      'Pulido de la muestra: pulió la superficie hasta obtener un acabado liso y plano sin capa descarburada; evitó contaminar la superficie pulida con los dedos u otros contaminantes.',
      'Selección del programa de calibración correcto: identificó el grado o tipo de aleación en proceso y seleccionó la curva de calibración correspondiente; no usó la curva incorrecta.',
      'Ejecución del análisis: realizó un mínimo de dos quemaduras; verificó que la diferencia entre quemaduras individuales no exceda el 2%; repitió si los resultados estuvieran fuera de tolerancia.',
      'Corrección de desvío (drift correction): ejecutó los patrones de configuración (alto y bajo) al inicio y cuando el instrumento lo requirió; interpretó correctamente los resultados.',
      'Verificación del análisis: ejecutó el patrón de control (estándar secundario) antes de analizar muestras desconocidas; verificó que los resultados estuvieran dentro de las tolerancias aceptables del sitio.',
      'Identificó correctamente cada muestra: número de colada, tipo de muestra (baño, verificación o final) y nombre del operador.',
      'Guardó o registró todos los resultados en el sistema del sitio para trazabilidad posterior.',
    ]},
    { k:'apagado', label:'4. Apagado y aseguramiento del espectrómetro', sub:'Secuencia de cierre · Limpieza · Estado para siguiente turno', items:[
      'Ejecutó el procedimiento de apagado del espectrómetro conforme a la WI del sitio: secuencia correcta de cierre del software, desactivación de la fuente de chispa y sistema de argón.',
      'Limpió el soporte, el electrodo y la mesa después de finalizar el análisis.',
      'Dejó el espectrómetro en condiciones operativas para el siguiente turno; registró cualquier anomalía o alerta de diagnóstico en el formulario de mantenimiento.',
      'Almacenó correctamente las muestras analizadas y los patrones usados según el sistema de calidad del sitio.',
    ]},
    { k:'argon', label:'5. Cambio del suministro de argón', sub:'Señal de bajo nivel · Cambio de cilindro · Verificación de fugas', items:[
      'Identificó correctamente la señal de bajo nivel de argón: lectura del manómetro bajo el umbral del sitio o alerta del diagnóstico de estado del instrumento.',
      'Ejecutó el cambio del cilindro de argón conforme al procedimiento del sitio: cerró la válvula del cilindro vacío, reemplazó sin generar entrada de aire al sistema, abrió el nuevo cilindro gradualmente y verificó presión correcta.',
      'Verificó ausencia de fugas tras el cambio: inspeccionó visualmente y confirmó que el análisis post-cambio no presentaba quemaduras de color blanco ni ruido excesivo.',
      'Registró el cambio de cilindro en el registro de consumo de gases del sitio.',
    ]},
    { k:'seguro', label:'6. Comportamientos seguros y concentración', sub:'Muestras calientes · Superficie pulida · Alertas del sistema', items:[
      'Manipuló todas las muestras calientes con el EPP correcto y las depositó en el recipiente designado, nunca sobre superficies no habilitadas.',
      'No tocó la superficie pulida de la muestra con los dedos después del pulido.',
      'Ante cualquier alerta del diagnóstico de estado del espectrómetro, detuvo el análisis y notificó al supervisor antes de continuar.',
      'Reportó todo incidente o cuasi-accidente al supervisor de turno de forma inmediata usando el formulario del sitio.',
      'Mantuvo el área del espectrómetro limpia y ordenada durante y después de la operación.',
    ]},
    { k:'wi', label:'7. Operación de equipos conforme a WI del sitio', sub:'Espectrómetro · Equipo de preparación de muestras', items:[
      'Operó el espectrómetro dentro de los parámetros y procedimientos establecidos en las WI del sitio.',
      'Operó el equipo de preparación de muestras (disco de pulido, cortadora si aplica) conforme al procedimiento del sitio.',
      'No realizó ajustes al hardware del espectrómetro (lente, alineamiento óptico, filtros) sin autorización del técnico calificado o supervisor.',
    ]},
    { k:'result', label:'8. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Precisión · Tiempo de entrega · Documentación', items:[
      'Los análisis producidos fueron precisos: los resultados del patrón de control estuvieron dentro de las tolerancias aceptables antes de analizar muestras desconocidas.',
      'Los resultados fueron entregados al fundidor o al BM5 en el tiempo requerido para la toma de decisiones de la colada.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles al candidato durante la evaluación.',
      'Toda la documentación de análisis (identificación de muestras, resultados, registros de argón) fue completada correctamente y guardada en el sistema.',
    ]},
  ]},
  bm7: { operador: [
    { k:'epp', label:'1. Requisitos de EPP del sitio (Fundidor)', sub:'Casco · Visor completo · Equipo de todo el personal bajo supervisión', items:[
      'Utilizó correctamente todo el EPP requerido para el área de fusión: casco, visor de calor de cuerpo completo, guantes de aluminio o cuero refractario, mandil, polainas y calzado de seguridad.',
      'Verificó y exigió el uso correcto de EPP a todos los miembros del equipo de fusión bajo su supervisión durante la evaluación.',
      'No permitió en ningún momento personal sin EPP correcto en el área de operación del horno.',
    ]},
    { k:'planif', label:'2. Evaluación del área, planificación del turno y controles previos', sub:'Programa de producción · Peligros · Equipos auxiliares', items:[
      'Planificó el turno de fusión: revisó el programa de producción, las especificaciones de los grados a fundir, la disponibilidad de materias primas (scrap, aleaciones, refractarios) y la asignación del equipo humano.',
      'Identificó y evaluó los peligros relevantes al área de fusión completa: quemaduras, estrés por calor, calor radiante, salpicaduras de metal, riesgo de grúa, aplastamiento, tropezones, electrocución, destello de arco y manipulación manual.',
      'Implementó y verificó los controles de riesgo para todos los peligros identificados antes de autorizar el inicio de operaciones.',
      'Realizó o supervisó los controles previos al inicio: estado del horno, revestimiento, ELD, equipos auxiliares, cucharas precalentadas, espectrómetro operativo.',
    ]},
    { k:'liderazgo', label:'3. Supervisión y liderazgo de la operación del horno de inducción', sub:'Orientación técnica · BM1 · BM2 · Espectrómetro · Vaciado', items:[
      'Proporcionó orientación técnica al equipo de carga (BM1) sobre selección de scrap: composición química, densidad, tamaño, chatarra no magnética y material con restricciones; y sobre la sincronización y cantidad de adiciones de ferroaleación.',
      'Supervisó la operación de fusión (BM2): verificó parámetros de potencia, monitoreo del ELD, muestreo, temperaturas y adiciones de aleación conforme a la hoja de colada.',
      'Interpretó los resultados del espectrómetro y tomó las decisiones metalúrgicas de ajuste de composición: adiciones correctivas, confirmación del grado o rechazo de la colada.',
      'Supervisó la operación de vaciado: definió la selección de cuchara, el orden de colada, las temperaturas de vaciado según la tarjeta de métodos e instrucciones especiales.',
      'Proporcionó comunicación bidireccional efectiva con la supervisión de turno sobre el estado de producción, seguridad, calidad y cualquier desviación del plan.',
    ]},
    { k:'apagado', label:'4. Procedimiento de apagado y cierre del turno', sub:'Condiciones seguras · Parte de turno', items:[
      'Verificó que el área quedara en condiciones seguras al finalizar: horno apagado, cucharas almacenadas correctamente, área limpia y libre de derrames.',
      'Completó y entregó el parte de turno con el estado del horno, revestimiento (mediciones ELD, espesor), incidentes y observaciones relevantes para el turno entrante.',
    ]},
    { k:'emergencia', label:'5. Conocimiento y respuesta ante emergencias del área de fusión', sub:'Run-out · Bridging · Temperaturas · Revestimiento · Eléctrico · Agua', items:[
      'Salida de metal (run-out): Sabe cómo activar la alarma, iniciar la evacuación del área y notificar al supervisor de turno y a HSE de forma inmediata siguiendo el procedimiento del sitio.',
      'Bridging (puenteo del horno): Conoce cómo cortar la potencia de inmediato, notificar al supervisor y ejecutar el protocolo de respuesta con posición segura del personal.',
      'Temperaturas excesivas del metal: Sabe cómo reconocer la lectura fuera de rango, detener el proceso y aplicar el procedimiento de ajuste o notificación según el umbral del sitio.',
      'Falla del revestimiento: Conoce cómo identificar señales de desgaste crítico (puntos negros irregulares, lectura ELD fuera de rango) y tomar la decisión de parada y vaciado de emergencia.',
      'Electrocución / falla eléctrica: Sabe cómo ejecutar el procedimiento de apagado de emergencia y aislar el área siguiendo el protocolo LOTOTO y la notificación a mantenimiento y supervisión.',
      'Falla de suministro de agua / servicios: Sabe reconocer la alarma y ejecutar el procedimiento de apagado de emergencia del horno dentro del tiempo límite establecido.',
    ]},
    { k:'seguro', label:'6. Comportamientos seguros y liderazgo en seguridad', sub:'Intervención constructiva · Zonas de exclusión · Reporte · Concentración', items:[
      'Ejerció liderazgo visible en seguridad durante el turno: intervino de forma constructiva ante comportamientos inseguros del equipo.',
      'Gestionó las zonas de exclusión del área de fusión de forma activa: verificó que se cumplieran para todas las operaciones con metal fundido y bajo carga suspendida.',
      'Reportó de forma inmediata al supervisor todo incidente o cuasi-accidente y tomó acciones correctivas inmediatas.',
      'Mantuvo el área de fusión limpia y ordenada durante toda la operación del turno.',
      'Demostró capacidad de mantener la concentración y la toma de decisiones bajo condiciones de presión operativa.',
    ]},
    { k:'wi', label:'7. Supervisión de equipos conforme a WI del sitio', sub:'Horno · BC1/BC3 · Espectrómetro · Equipos de carga', items:[
      'Verificó que todos los operadores bajo su supervisión operaron sus equipos (horno, grúas BC1/BC3, espectrómetro, equipos de carga) conforme a las WI vigentes del sitio.',
      'Intervino de forma correctiva ante cualquier desviación de las WI observada en el equipo, sin tolerancia a atajos de procedimiento.',
      'Demostró conocimiento avanzado del espectrómetro: mantenimiento, corrección de desvío, perfil de ajuste, selección de grupos de aleación para grados específicos y almacenamiento de muestras.',
    ]},
    { k:'result', label:'8. Resultados requeridos (Seguridad · Calidad · Producción)', sub:'Especificación · Sin incidentes · Costos · Documentación del turno', items:[
      'Las coladas producidas durante el turno cumplieron con las especificaciones de composición química y temperatura para los grados requeridos.',
      'No ocurrieron incidentes de seguridad ni cuasi-accidentes atribuibles a deficiencias de liderazgo o supervisión durante la evaluación.',
      'Los costos de producción del turno (consumo de aleaciones, refractarios, energía) estuvieron dentro de los parámetros establecidos o fueron debidamente justificados.',
      'Toda la documentación del turno (hojas de colada, registros de ELD, parte de turno, consumos) fue completada correctamente y entregada al turno entrante.',
      'El candidato demostró capacidad para proporcionar liderazgo en seguridad, calidad y productividad al equipo de fusión durante toda la evaluación.',
    ]},
  ]},
};
// Default doc metadata — Training can override per type in Supabase
const DOC_META_DEFAULTS={};
TYPES.forEach(t=>{
  DOC_META_DEFAULTS[t.id]={
    bknDoc:t.code,
    fecha:'30-Jun-26',
    revisadoPor:'avera',
    aprobadoPor:'hramamurthi',
    rev:'1',
    fechaEmision:'30-Jun-26',
    clausula:'Emisión inicial – formato Bradken Chilca.',
  };
});

async function getAI(ev){
  const nca=ev.domains.flatMap(d=>d.items.filter(i=>i.result==='NCA').map(i=>i.text));
  if(!nca.length) return '';
  try{
    // Call Vercel API route (works in production, avoids CORS)
    const res=await fetch('/api/generate-plan',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:ev.type,role:ev.role,items:nca})
    });
    if(!res.ok) return '';
    const data=await res.json();
    return data.plan||'';
  }catch(e){
    return '';
  }
}

const s={
  layout:{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",minHeight:'100vh',background:PGBG,color:TX},
  header:{background:SF,borderBottom:`1px solid ${BD}`,padding:'11px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 0 rgba(0,0,0,.04)'},
  brand:{display:'flex',alignItems:'center',gap:10},
  logo:{width:34,height:34,background:BRAND,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:12,letterSpacing:'-0.3px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",flexShrink:0},
  brandName:{color:TX,fontWeight:600,fontSize:13,lineHeight:1.3},
  brandSub:{color:T2,fontWeight:400,fontSize:11,display:'block'},
  main:{maxWidth:740,margin:'0 auto',padding:'24px 16px'},
  card:{background:SF,border:`1px solid ${BD}`,borderRadius:14,padding:'24px',boxShadow:SH},
  h1:{fontSize:21,fontWeight:600,margin:'0 0 4px',color:TX},
  h2:{fontSize:15,fontWeight:600,margin:'0 0 14px',color:TX},
  label:{fontSize:11,fontWeight:700,color:T2,display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em'},
  input:{width:'100%',boxSizing:'border-box'},
  btn:{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6,background:SF,color:T2,border:`1px solid ${BD}`,borderRadius:9,padding:'7px 14px',fontSize:12,fontWeight:500,fontFamily:"'DM Sans',sans-serif"},
  btnPrimary:{cursor:'pointer',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,border:'none',borderRadius:22,padding:'9px 20px',fontSize:13,fontWeight:500,background:BRAND,color:'#fff',fontFamily:"'DM Sans',sans-serif",transition:'background .15s'},
  btnSm:{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,background:BRANDL,color:BRAND,border:'1px solid #C3D5F0',borderRadius:7,padding:'5px 12px',fontSize:11,fontWeight:500,fontFamily:"'DM Sans',sans-serif"},
  back:{cursor:'pointer',border:'none',background:'none',color:T2,fontSize:13,padding:'5px 8px',display:'inline-flex',alignItems:'center',gap:6,borderRadius:7,marginBottom:8,fontFamily:"'DM Sans',sans-serif"},
  code:{fontFamily:"'DM Mono','Consolas',monospace",background:'#0F172A',color:'#38BDF8',fontSize:30,fontWeight:500,letterSpacing:8,padding:'20px 36px',borderRadius:12,display:'inline-block'},
  tag:{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,whiteSpace:'nowrap'},
  divider:{height:'1px',background:BD,margin:'16px 0'},
};

function Step({n,label,active,done}){
  return <div style={{display:'flex',alignItems:'center',gap:6,opacity:done||active?1:0.35}}>
    <div style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
      background:done?G:active?BRAND:S2,color:done||active?'#fff':T3,border:`1.5px solid ${done?G:active?BRAND:BD}`}}>
      {done?'✓':n}
    </div>
    <span style={{fontSize:12,color:active?TX:T2,fontWeight:active?600:400}}>{label}</span>
  </div>;
}

function ResultBadge({r}){
  if(!r) return null;
  return <span style={{...s.tag,
    background:r==='C'?GBKG:RBKG,
    color:r==='C'?G:R,
    border:`1px solid ${r==='C'?GBD:RBD}`}}>
    {r==='C'?'Competente (C)':'No Competente Aún (NCA)'}
  </span>;
}

function PrintView({ev,onClose,docMeta={}}){
  const dm={...DOC_META_DEFAULTS[ev?.type||''],...docMeta};
  const [pdfLoading,setPdfLoading]=useState(false);
  const [pdfError,setPdfError]=useState('');
  const [showPrintTip,setShowPrintTip]=useState(false);
  const typeInfo=TYPES.find(x=>x.id===ev.type);
  const BK='#005596';
  const BKL='#0066AA';
  const BKDARK='#00284A';
  const ROW1='#ffffff';
  const ROW2='#EEF3FA';
  const LBLBG='#4A6081';
  const today2=()=>new Date().toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'});

  async function handlePDF(){
    const el=document.getElementById('bradken-print-doc');
    if(!el){setPdfError('Contenido no encontrado.');return;}
    setPdfLoading(true); setPdfError('');
    try{
      await new Promise((res,rej)=>{
        if(window.html2canvas){res();return;}
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
      await new Promise((res,rej)=>{
        if(window.jspdf){res();return;}
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
      const canvas=await window.html2canvas(el,{
        scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,
        windowWidth:el.scrollWidth,windowHeight:el.scrollHeight
      });
      const{jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const pw=pdf.internal.pageSize.getWidth();
      const ph=pdf.internal.pageSize.getHeight();
      const margin=10;
      const cw=pw-margin*2;
      const ratio=cw/canvas.width;
      const fullH=canvas.height*ratio;
      const totalPages=Math.ceil(fullH/ph);
      for(let p=0;p<totalPages;p++){
        if(p>0) pdf.addPage();
        const srcY=Math.floor((p*ph)/ratio);
        const srcH=Math.min(Math.floor(ph/ratio),canvas.height-srcY);
        if(srcH<=0) break;
        const pc=document.createElement('canvas');
        pc.width=canvas.width; pc.height=srcH;
        pc.getContext('2d').drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        pdf.addImage(pc.toDataURL('image/jpeg',0.92),'JPEG',margin,0,cw,srcH*ratio);
      }
      const nom=`VOC_${(ev.type||'').toUpperCase()}_${(ev.participant.nombres||'').replace(/\s+/g,'_')}_${ev.id}.pdf`;
      try{
        pdf.save(nom);
      }catch(e2){
        const uri=pdf.output('datauristring');
        const w=window.open('','_blank');
        if(w){ w.location.href=uri; }
        else{ const a=document.createElement('a'); a.href=uri; a.target='_blank'; a.click(); }
      }
    }catch(e){
      setPdfError('Error al generar PDF: '+e.message);
    }
    setPdfLoading(false);
  }

  const roleLabel=ev.mode==='licencia'?'Evaluación Práctica de Competencia':ev.role==='emisor'?'EMISOR / AUTORIZADOR':'EJECUTOR';
  // Only BM and BC types show their level code (BM1, BC3, etc.) as subtitle suffix; others show nothing
  const subtitle=(()=>{const icon=typeInfo?.icon||''; return /^(BM\d|BC\d)$/.test(icon)?icon:'';})();
  const isLicencia=ev.mode==='licencia';
  const prereqType=TYPES.find(x=>x.id===ev.type)?.prereq;

  // Cell helpers — proper React component signatures
  const C=({children,s={},colSpan,rowSpan})=><td colSpan={colSpan} rowSpan={rowSpan} style={{border:'1px solid #C8D4E8',padding:'4px 7px',fontSize:10.5,...s}}>{children}</td>;
  const H=({children,s={},colSpan,rowSpan})=><td colSpan={colSpan} rowSpan={rowSpan} style={{border:'1px solid #C8D4E8',padding:'4px 7px',fontSize:10.5,background:LBLBG,color:'#fff',fontWeight:600,...s}}>{children}</td>;
  const Sec=({children,s={},colSpan})=><td colSpan={colSpan||4} style={{border:'1px solid #C8D4E8',padding:'5px 7px',fontSize:11,background:BK,color:'#fff',fontWeight:700,...s}}>{children}</td>;

  // Digital signature block
  const DigSig=({name,ts,label,color,bgColor})=>(
    name ? <div>
      <div style={{fontStyle:'italic',fontSize:12,fontWeight:700,color:'#111',marginBottom:2,letterSpacing:'0.3px'}}>{name}</div>
      <div style={{borderBottom:`1.5px solid ${color||'#333'}`,width:'55%',marginBottom:4}}/>
      <div style={{fontSize:8.5,color:'#444',lineHeight:1.7,background:bgColor||'#f8f8f8',padding:'3px 7px',borderRadius:3,border:`0.5px solid ${color||'#ccc'}30`}}>
        <span style={{color:color||BK,fontWeight:700}}>{label||'✦ Firmado electrónicamente'}</span><br/>
        Sistema de Verificación de Competencias · Bradken Chilca<br/>
        Código: <b>{ev.id}</b> · {ts ? new Date(ts).toLocaleString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}) : ev.evaluator?.fecha||today2()}
      </div>
    </div>
    : <span style={{color:'#aaa',fontSize:10}}>Pendiente</span>
  );

  const BradkenLogo=()=>(
    <img src="data:image/png;base64,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" alt="Bradken" style={{height:42,objectFit:"contain",flexShrink:0}}/>
  );

  return <div style={{fontFamily:'Calibri,Arial,sans-serif',background:'#fff',padding:'20px 24px',maxWidth:820,margin:'0 auto',color:'#111'}}>
    {/* ── Print controls ── */}
    <div className="no-print" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,paddingBottom:12,borderBottom:`1.5px solid ${BK}`}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <button onClick={handlePDF} style={{...s.btnPrimary,gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar documento PDF
        </button>
        <button onClick={onClose} style={s.btn}>← Volver</button>
      </div>
      <div style={{fontSize:12,color:T2,textAlign:'right',lineHeight:1.5}}>
        Descarga el archivo → ábrelo en el navegador → Ctrl+P → Guardar como PDF
      </div>
    </div>

    {showPrintTip&&<div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'12px 16px',marginBottom:16,fontSize:13}}>
      <b style={{color:'#92400e'}}>⚠ No se pudo iniciar la descarga.</b>
      <span style={{color:'#78350f'}}> Usa <strong>Ctrl+P</strong> directamente en esta página y selecciona "Guardar como PDF" como destino de impresión.</span>
    </div>}

    {/* ══ PRINTABLE DOCUMENT CONTENT ══ */}
    <div id="bradken-print-doc" style={{background:'#fff',padding:'4px'}}>

    {/* ══ PAGE 1 HEADER: Diagonal blue banner + logo (SVG-based for html2canvas compatibility) ══ */}
    <div style={{position:'relative',width:'100%',height:76,marginBottom:8}}>
      <svg width="100%" height="76" viewBox="0 0 800 76" preserveAspectRatio="none"
           style={{position:'absolute',top:0,left:0}}>
        <defs>
          <linearGradient id="hdrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#001a3a"/>
            <stop offset="45%"  stopColor="#003375"/>
            <stop offset="78%"  stopColor="#005596"/>
          </linearGradient>
        </defs>
        <polygon points="0,0 560,0 450,76 0,76" fill="url(#hdrGrad)"/>
      </svg>
      {/* Bradken logo — floating in the white space on the right */}
      <div style={{
        position:'absolute',right:0,top:0,bottom:0,width:'28%',
        display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:8,
      }}>
        <BradkenLogo/>
      </div>
    </div>

    {/* Disclaimer text below banner */}
    <p style={{fontSize:8.5,color:'#555',lineHeight:1.5,margin:'0 0 10px 0'}}>
      Si este documento se ha impreso o descargado, se convierte inmediatamente en una copia no controlada y no puede utilizarse ni consultarse en ningún requisito operativo a menos que se utilice un registro de control de copias validado o un sistema equivalente.
    </p>

    {/* ── DOCUMENT TITLE SECTION ── */}
    <div style={{marginBottom:14}}>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:22,fontWeight:700,color:'#005596',marginBottom:2,lineHeight:1.2}}>
        Formulario Bradken (en Blanco)
      </div>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:20,fontWeight:700,color:'#919194',marginBottom:2,lineHeight:1.3}}>
        {typeInfo?.label}
      </div>
      <div style={{fontFamily:'Arial,sans-serif',fontSize:18,fontWeight:700,color:'#919194',lineHeight:1.3}}>
        {isLicencia
          ? `${roleLabel} ${subtitle}`
          : `Verificación de Competencia – ${roleLabel}`}
      </div>
    </div>

    {/* ── DETALLES DEL PARTICIPANTE ── */}
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      <tr><Sec colSpan={4}>Detalles del Participante</Sec></tr>
      <tr><H s={{width:'22%'}}>Nombre completo</H><C>{ev.participant.nombres||''}</C><H s={{width:'15%'}}>Apellidos</H><C>{ev.participant.apellidos||''}</C></tr>
      <tr><H>Cargo / Puesto</H><C colSpan={3}>{ev.participant.cargo||''}</C></tr>
      {ev.participant.equipo&&<tr><H>Marca / Modelo del equipo</H><C colSpan={3}>{ev.participant.equipo}</C></tr>}
      <tr>
        <H>Firma del Colaborador</H>
        <C colSpan={3}>
          <DigSig
            name={ev.approval?.by}
            ts={ev.approval?.signedAt}
            label="✦ Firmado electrónicamente por el evaluado"
            color='#1A6B3A'
            bgColor='#F0FDF4'
          />
        </C>
      </tr>
      {ev.participant.telefono&&<tr>
        <H s={{width:'22%'}}>Celular (WhatsApp)</H>
        <C colSpan={3}>{ev.participant.telefono}</C>
      </tr>}
      {prereqType&&<tr>
        <H s={{width:'22%'}}>{prereqType.replace('¿','').replace('?','').replace('(Obligatorio)','').trim()}</H>
        <C colSpan={3} s={{fontWeight:600,color:ev.participant.prereqCheck==='Sí'?'#166534':ev.participant.prereqCheck==='No'?'#991b1b':'#111'}}>
          {ev.participant.prereqCheck||'___'}
        </C>
      </tr>}
    </tbody></table>

    {/* ── RESUMEN DE LA EVALUACIÓN ── */}
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      <tr><Sec colSpan={4}>Resumen de la Evaluación</Sec></tr>
      <tr>
        <H s={{width:'25%'}}>{ev.participant.colada?'Número de Colada / N° Operación':isLicencia?'Tipo / Modelo del Equipo':'Área / Tarea observada'}</H>
        <C s={{width:'45%'}}>{ev.participant.colada||ev.participant.equipo||ev.participant.area||''}</C>
        <H s={{width:'8%'}}>Turno</H>
        <C>{ev.participant.turno
          ?<span>
            <span style={{marginRight:8,fontWeight:ev.participant.turno==='Mañana'?700:400}}>{ev.participant.turno==='Mañana'?'☑':'☐'} Mañana</span>
            <span style={{marginRight:8,fontWeight:ev.participant.turno==='Tarde'?700:400}}>{ev.participant.turno==='Tarde'?'☑':'☐'} Tarde</span>
            <span style={{fontWeight:ev.participant.turno==='Noche'?700:400}}>{ev.participant.turno==='Noche'?'☑':'☐'} Noche</span>
          </span>
          :<span>☐ Mañana &nbsp; ☐ Tarde &nbsp; ☐ Noche</span>}
        </C>
      </tr>
      <tr><H>Operación observada y comentarios / recomendaciones</H><C colSpan={3} s={{lineHeight:1.6,minHeight:32}}>{ev.participant?.operacionObservada||''}</C></tr>
    </tbody></table>

    {/* ── CONDICIONES DE LA EVALUACIÓN ── */}
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      <tr><Sec colSpan={4}>Condiciones de la Evaluación</Sec></tr>
      <tr><td colSpan={4} style={{border:'1px solid #C8D4E8',padding:'5px 7px',fontSize:10.5,lineHeight:1.6}}>
        <b>Nota: </b>{isLicencia
          ?`La evaluación es conducida por el Evaluador luego de completar las horas de logbook establecidas. Para obtener la ${typeInfo?.label}, el candidato debe obtener resultado Satisfactorio (Competente) en todos los criterios.`
          :`La evaluación de competencias verifica el desempeño del ${roleLabel} en las tareas de alto riesgo establecidas por el procedimiento Bradken Chilca.`}
      </td></tr>
      {prereqType&&<tr>
        <H colSpan={2}>{prereqType.replace('¿','').replace('?','').replace('(Obligatorio)','').trim()}</H>
        <C colSpan={2} s={{fontWeight:600,color:ev.participant.prereqCheck==='Sí'?'#166534':'#991b1b'}}>
          {ev.participant.prereqCheck==='Sí'?'☑ Sí':ev.participant.prereqCheck==='No'?'☒ No (evaluación suspendida)':'□ Sí    □ No'}
        </C>
      </tr>}
      {ev.participant.logbook&&<tr>
        <H colSpan={2}>Logbook completado (horas de supervisión requeridas)</H>
        <C colSpan={2} s={{fontWeight:600,color:ev.participant.logbook==='Sí'?'#166534':'#92400e'}}>
          {ev.participant.logbook==='Sí'?'☑ Sí — Logbook verificado':'☒ No — Pendiente de completar'}
        </C>
      </tr>}
    </tbody></table>

    {/* ── RECONOCIMIENTO DEL SUPERVISOR (solo BC1, BC3, BM1-BM7) ── */}
    {TYPES.find(x=>x.id===ev.type)?.xfields?.includes('supervisor')&&<table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}><tbody>
      <tr><Sec colSpan={4}>Reconocimiento del Supervisor sobre la Competencia del Colaborador</Sec></tr>
      <tr><td colSpan={4} style={{border:'1px solid #C8D4E8',padding:'5px 7px',fontSize:10.5,lineHeight:1.8}}>
        El Supervisor declara que el colaborador ha:<br/>
        ✓ <u>Completado</u> la formación teórica requerida (evaluación escrita o verbal aprobada).<br/>
        ✓ <u>Mantenido</u> el logbook de operaciones durante el período de supervisión requerido.<br/>
        ✓ <u>Sido observado</u> en la tarea bajo supervisión directa y está preparado para la evaluación.
      </td></tr>
      <tr><H>Nombre del Supervisor</H><C colSpan={3}>{ev.participant.supNombre||'___________________________'}</C></tr>
      <tr>
        <H>Firma del Supervisor</H>
        <C>{ev.participant.supNombre?<div style={{fontStyle:'italic',fontWeight:600,fontSize:11}}>{ev.participant.supNombre}<div style={{borderBottom:'1px solid #555',width:'50%',marginTop:2}}/></div>:'___________________________'}</C>
        <H s={{width:'12%'}}>Fecha</H>
        <C>{ev.participant.supFecha||'__  /  __  /  ____'}</C>
      </tr>
    </tbody></table>}

    {/* ── COMPETENCY SECTIONS ── */}
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      {ev.domains.map((d,di)=>[
        <tr key={d.k+'_h'}>
          <td style={{border:'1px solid #C8D4E8',padding:'5px 8px',fontSize:11,fontWeight:700,background:BK,color:'#fff',width:'88%'}}>{d.label}{d.sub&&<span style={{fontWeight:400,marginLeft:6,fontSize:10,opacity:.9}}>— {d.sub}</span>}</td>
          <td style={{border:'1px solid #C8D4E8',padding:'5px 4px',fontSize:11,fontWeight:700,background:BK,color:'#fff',width:'6%',textAlign:'center'}}>C</td>
          <td style={{border:'1px solid #C8D4E8',padding:'5px 4px',fontSize:11,fontWeight:700,background:BK,color:'#fff',width:'6%',textAlign:'center'}}>NCA</td>
        </tr>,
        ...d.items.map((item,ii)=><tr key={d.k+ii} style={{background:ii%2===0?ROW1:ROW2}}>
          <td style={{border:'1px solid #C8D4E8',padding:'4px 8px',fontSize:10.5,lineHeight:1.5}}>{item.text}</td>
          <td style={{border:'1px solid #C8D4E8',padding:'4px',textAlign:'center',fontSize:14}}>{item.result==='C'?'☑':'☐'}</td>
          <td style={{border:'1px solid #C8D4E8',padding:'4px',textAlign:'center',fontSize:14}}>{item.result==='NCA'?'☑':'☐'}</td>
        </tr>)
      ])}
      <tr>
        <td colSpan={3} style={{border:'1px solid #C8D4E8',padding:'5px 8px',fontSize:11,fontWeight:700,background:BK,color:'#fff',textAlign:'center',letterSpacing:0.5}}>
          FIN DE LA EVALUACIÓN DE COMPETENCIAS
        </td>
      </tr>
    </tbody></table>

    {/* ── RESULTADO DE LA EVALUACIÓN ── */}
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      <tr><Sec colSpan={4}>Resultado de la Evaluación (a completar por el Evaluador-Instructor)</Sec></tr>
      <tr><H s={{width:'22%'}}>Nombre del Evaluador</H><C colSpan={3} s={{fontWeight:600}}>{ev.evaluator?.nombre||''}</C></tr>
      <tr>
        <H>Firma del Evaluador</H>
        <C colSpan={2}><DigSig name={ev.evaluator?.nombre} ts={ev.evaluatorSignedAt||ev.createdAt} label="✦ Firmado electrónicamente" color={BK} bgColor='#EEF3FA'/></C>
        <C s={{width:'18%'}}><span style={{color:'#555',fontSize:9}}>Fecha:</span><br/><b>{ev.evaluator?.fecha||'__/__/____'}</b></C>
      </tr>
      <tr>
        <H>Resultado de la Evaluación</H>
        <C colSpan={3} s={{fontWeight:700,fontSize:12,color:ev.overallResult==='C'?'#166534':ev.overallResult==='NCA'?'#991b1b':'#111'}}>
          {ev.overallResult==='C'?'☑ Competente (C)':ev.overallResult==='NCA'?'☑ No Competente Aún (NCA)':'□ Competente (C)    □ No Competente Aún (NCA)'}
        </C>
      </tr>
      <tr><H>Retroalimentación</H><C colSpan={3} s={{lineHeight:1.7,minHeight:36}}>{ev.comments||''}</C></tr>
    </tbody></table>

    {/* ── PLAN DE DESARROLLO (por código NCA) ── */}
    {(()=>{
      const planItems=ev.plan?.planItems||{};
      const hasPlanItems=Object.keys(planItems).some(k=>planItems[k]?.trim());
      const ncaList=(ev.domains||[]).flatMap(d=>(d.items||[]).filter(i=>i.result==='NCA'));
      if(!hasPlanItems&&!ev.aiRec) return null;
      return <table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
        <tr><Sec colSpan={2}>Plan de Desarrollo de Competencias — Ítems NCA</Sec></tr>
        {ev.aiRec&&!hasPlanItems&&<tr><td colSpan={2} style={{border:'1px solid #C8D4E8',padding:'5px 8px',fontSize:10.5,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{ev.aiRec}</td></tr>}
        {hasPlanItems&&ncaList.map((item,idx)=>{
          const code='NCA-'+String(idx+1).padStart(2,'0');
          const txt=planItems[code]||'';
          if(!txt) return null;
          return [
            <tr key={code+'_h'}>
              <td colSpan={2} style={{border:'1px solid #C8D4E8',padding:'5px 8px',background:'#EEF3FA',fontWeight:700,fontSize:10.5}}>
                <span style={{background:BK,color:'#fff',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 7px',marginRight:8,fontFamily:'monospace'}}>{code}</span>
                {item.text}
              </td>
            </tr>,
            <tr key={code+'_p'}><td colSpan={2} style={{border:'1px solid #C8D4E8',padding:'5px 8px',fontSize:10.5,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{txt}</td></tr>
          ];
        })}
      </tbody></table>;
    })()}

    {/* ── APROBACIÓN DEL EVALUADO ── */}
    {ev.approval&&<table style={{width:'100%',borderCollapse:'collapse',marginBottom:4}}><tbody>
      <tr><td colSpan={4} style={{border:'1px solid #C8D4E8',padding:'5px 8px',fontSize:11,fontWeight:700,background:'#1A6B3A',color:'#fff'}}>
        Firma del Evaluado — Confirmación de Resultados
      </td></tr>
      <tr><H s={{width:'22%'}}>Nombre del Evaluado</H><C colSpan={3} s={{fontWeight:600}}>{ev.approval.by||''}</C></tr>
      <tr>
        <H>Firma del Evaluado</H>
        <C colSpan={2}><DigSig name={ev.approval.by} ts={ev.approval.signedAt} label="✦ Confirmado electrónicamente — El evaluado declara haber revisado y comprendido los resultados" color='#1A6B3A' bgColor='#F0FDF4'/></C>
        <C s={{width:'18%'}}><span style={{color:'#555',fontSize:9}}>Fecha de confirmación:</span><br/><b>{ev.approval.fecha||'__/__/____'}</b></C>
      </tr>
    </tbody></table>}

    {/* ── RESUMEN DE REVISIONES ── */}
    <div style={{textAlign:'center',fontSize:12,fontWeight:600,margin:'10px 0 4px',color:'#1A1A2E'}}>Tabla 1.&nbsp;&nbsp;Resumen de la revisión</div>
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:6}}><tbody>
      <tr>
        <td style={{border:'1px solid #C8D4E8',padding:'4px 6px',fontSize:10,fontWeight:700,background:'#005596',color:'#fff',width:'6%'}}>Rev.</td>
        <td style={{border:'1px solid #C8D4E8',padding:'4px 6px',fontSize:10,fontWeight:700,background:'#005596',color:'#fff',width:'14%'}}>Fecha de Emisión</td>
        <td style={{border:'1px solid #C8D4E8',padding:'4px 6px',fontSize:10,fontWeight:700,background:'#005596',color:'#fff',width:'44%'}}>Cláusula/Sección revisada y Lista de cambios</td>
        <td style={{border:'1px solid #C8D4E8',padding:'4px 6px',fontSize:10,fontWeight:700,background:'#005596',color:'#fff',width:'18%'}}>Revisado por</td>
        <td style={{border:'1px solid #C8D4E8',padding:'4px 6px',fontSize:10,fontWeight:700,background:'#005596',color:'#fff',width:'18%'}}>Aprobado por</td>
      </tr>
      <tr>
        <C>{dm.rev||'1'}</C><C>{dm.fechaEmision||'30-Jun-26'}</C><C>{dm.clausula||'Emisión inicial – formato Bradken Chilca.'}</C><C>{dm.revisadoPor||'avera'}</C><C>{dm.aprobadoPor||'hramamurthi'}</C>
      </tr>
    </tbody></table>

    {/* ══ BOTTOM META TABLE (Organización / Título / BKN Doc) ══ */}
    <table style={{width:'100%',borderCollapse:'collapse',marginTop:8,marginBottom:4,border:'1px solid #C8D8EC'}}><tbody>
      <tr>
        {['Organización','Proceso','Región','Tipo de documento'].map((lbl,i)=>(
          <td key={i} style={{border:'1px solid #C8D8EC',padding:'6px 10px',width:'25%',verticalAlign:'top'}}>
            <div style={{fontSize:9,color:'#888',marginBottom:2}}>{lbl}:</div>
            <div style={{fontSize:11,fontWeight:700,color:'#111'}}>
              {['Bradken','Capability & Training','Chilca','Form (blank)'][i]}
            </div>
          </td>
        ))}
      </tr>
      <tr>
        <td colSpan={4} style={{border:'1px solid #C8D8EC',padding:'6px 10px'}}>
          <span style={{fontSize:10,color:'#888'}}>Título del Documento: </span>
          <span style={{fontSize:11,fontWeight:700,color:'#111'}}>
            {typeInfo?.label}{isLicencia?` — ${roleLabel} ${subtitle}`:` — Verificación de Competencia — ${roleLabel}`}
          </span>
        </td>
      </tr>
      <tr>
        {[
          ['BKN Doc & Revisión',dm.bknDoc||ev.docCode],
          ['Fecha',dm.fecha||'30-Jun-26'],
          ['Revisado por',dm.revisadoPor||'avera'],
          ['Aprobado por',dm.aprobadoPor||'hramamurthi'],
        ].map(([lbl,val],i)=>(
          <td key={i} style={{border:'1px solid #C8D8EC',padding:'6px 10px',verticalAlign:'top'}}>
            <span style={{fontSize:10,color:'#888'}}>{lbl}: </span>
            <span style={{fontSize:11,fontWeight:700,color:'#111'}}>{val}</span>
          </td>
        ))}
      </tr>
    </tbody></table>

    {/* ── FOOTER ── */}
    <div style={{borderTop:`2px solid ${BK}`,paddingTop:6,marginTop:4}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:9,color:'#555',lineHeight:1.5}}>
          <b>© Bradken Pty Limited 2026</b> l ABN 33 108 693 009 l Código de evaluación: <b>{ev.id}</b><br/>
          <b>Solo para uso interno confidencial:</b> Este documento es confidencial y puede contener información comercial sensible. Queda expresamente prohibido cualquier uso no autorizado.
        </div>
        <BradkenLogo/>
      </div>
    </div>

    </div>{/* end bradken-print-doc */}

    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>;
}




function PlanManager({ev,form,setForm,saving,msg,onSave,onBack}){
  const TX='#1A1A2E',T2='#6B7280',T3='#9CA3AF',R='#DC2626',G='#16A34A',AM='#D97706';
  const BD='#E4E7EF',RBKG='#FEF2F2',GBKG='#F0FDF4',ABKG='#FFFBEB';
  const BRAND='#005596',s={label:{fontSize:11,fontWeight:600,color:T3,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6},
    input:{border:'1px solid '+BD,borderRadius:8,padding:'8px 12px',fontSize:13,color:TX,width:'100%',background:'#fff'},
    btnPrimary:{cursor:'pointer',background:BRAND,color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:600}};
  
  const tipo=TYPES.find(function(t){return t.id===ev.type;});
  const ncaItems=(ev.domains||[]).flatMap(function(d){return (d.items||[]).filter(function(i){return i.result==='NCA';});});
  
  const statusList=[
    {val:'pendiente',lbl:'Pendiente',col:R,bg:RBKG},
    {val:'en_progreso',lbl:'En progreso',col:AM,bg:ABKG},
    {val:'listo',lbl:'Listo para re-evaluar',col:G,bg:GBKG},
    {val:'re_evaluado',lbl:'Re-evaluado ✓',col:'#5B21B6',bg:'#F5F3FF'}
  ];
  
  return React.createElement('div',null,
    React.createElement('button',{style:{cursor:'pointer',border:'none',background:'none',color:T2,fontSize:13,padding:'5px 8px',display:'inline-flex',alignItems:'center',gap:6,borderRadius:7},onClick:onBack},'← Historial'),
    React.createElement('h2',{style:{fontSize:22,fontWeight:700,color:TX,margin:'8px 0 16px'}},'Gestión del Plan de Desarrollo'),
    React.createElement('div',{style:{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:14,padding:'14px 16px',marginBottom:12}},
      React.createElement('div',{style:{fontSize:13,fontWeight:600,color:R,marginBottom:4}},'Evaluación con resultado NCA'),
      React.createElement('div',{style:{fontSize:13,color:TX}},ev.participant.nombres,' ',ev.participant.apellidos,' · ',tipo&&tipo.label),
      React.createElement('div',{style:{fontSize:12,color:T2,marginTop:2}},'Código: ',ev.id,' · Evaluador: ',ev.evaluator&&ev.evaluator.nombre,' · ',new Date(ev.createdAt).toLocaleDateString('es-PE'))
    ),
    React.createElement('div',{style:{background:'#fff',border:'1px solid '+BD,borderRadius:14,padding:'14px 16px',marginBottom:12}},
      React.createElement('div',{style:{fontSize:12,fontWeight:700,color:TX,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}},'Ítems con resultado NCA'),
      ncaItems.length===0
        ? React.createElement('div',{style:{fontSize:12,color:T2}},'No se encontraron ítems NCA.')
        : ncaItems.map(function(item,idx){
            return React.createElement('div',{key:idx,style:{display:'flex',gap:8,alignItems:'flex-start',padding:'5px 0',borderBottom:'1px solid '+BD}},
              React.createElement('span',{style:{color:R,flexShrink:0,marginTop:1}},'✗'),
              React.createElement('span',{style:{fontSize:12,color:TX,lineHeight:1.5}},item.text)
            );
          })
    ),
    React.createElement('div',{style:{background:'#fff',border:'1px solid '+BD,borderRadius:14,padding:'14px 16px',marginBottom:12}},
      React.createElement('div',{style:{fontSize:12,fontWeight:700,color:TX,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}},'Plan de Desarrollo de Competencias'),
      ncaItems.length===0
        ? React.createElement('p',{style:{fontSize:12,color:T2,margin:0}},'No hay ítems NCA registrados.')
        : ncaItems.map(function(item,idx){
            var code='NCA-'+String(idx+1).padStart(2,'0');
            return React.createElement('div',{key:code,style:{border:'1px solid #C3D5F0',borderRadius:10,padding:'12px 14px',marginBottom:10,background:'#F8FBFF'}},
              React.createElement('div',{style:{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}},
                React.createElement('span',{style:{background:BRAND,color:'#fff',fontSize:10,fontWeight:700,borderRadius:5,padding:'3px 9px',flexShrink:0,fontFamily:'monospace',marginTop:1}},code),
                React.createElement('span',{style:{fontSize:12,color:TX,lineHeight:1.5}},item.text)
              ),
              React.createElement('label',{style:{fontSize:10,fontWeight:700,color:T3,textTransform:'uppercase',letterSpacing:'0.06em',display:'block',marginBottom:5}},'Plan de acción para '+code+':'),
              React.createElement('textarea',{
                style:{border:'1px solid '+BD,borderRadius:8,padding:'8px 10px',fontSize:12.5,color:TX,width:'100%',minHeight:90,resize:'vertical',fontFamily:'inherit',lineHeight:1.6,background:'#fff'},
                value:(form.planItems&&form.planItems[code])||'',
                placeholder:'Actividades de refuerzo, metodología (OJT, práctica supervisada, tutoría) y plazo para este ítem...',
                onChange:function(e){
                  var v=e.target.value;
                  setForm(function(f){
                    var pi=Object.assign({},f.planItems||{});
                    pi[code]=v;
                    return Object.assign({},f,{planItems:pi});
                  });
                }
              })
            );
          })
    ),
    React.createElement('div',{style:{background:'#fff',border:'1px solid '+BD,borderRadius:14,padding:'16px',display:'flex',flexDirection:'column',gap:14}},
      React.createElement('h3',{style:{fontSize:16,fontWeight:600,color:TX,margin:'0 0 4px'}},'Estado del plan de desarrollo'),
      React.createElement('div',null,
        React.createElement('label',{style:s.label},'Estado actual'),
        React.createElement('div',{style:{display:'flex',gap:10,marginTop:4}},
          statusList.map(function(item){
            var active=form.estado===item.val;
            return React.createElement('button',{
              key:item.val,
              onClick:function(){setForm(function(f){return {...f,estado:item.val};});},
              style:{flex:1,padding:'8px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
                background:active?item.bg:'transparent',color:active?item.col:T2,
                border:'1.5px solid '+(active?item.col:BD)}
            },item.lbl);
          })
        )
      ),
      React.createElement('div',null,
        React.createElement('label',{style:s.label},'Puede ser evaluado a partir de'),
        React.createElement('input',{style:s.input,type:'date',value:form.fechaListo||'',
          onChange:function(e){setForm(function(f){return {...f,fechaListo:e.target.value};});}}),
        form.fechaListo&&React.createElement('p',{style:{fontSize:11,color:T2,marginTop:4}},
          new Date(form.fechaListo+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'long',year:'numeric'}))
      ),
      React.createElement('div',null,
        React.createElement('label',{style:s.label},'Observaciones de seguimiento'),
        React.createElement('textarea',{style:{...s.input,height:80},value:form.observaciones||'',
          placeholder:'Actividades completadas, comentarios del supervisor...',
          onChange:function(e){setForm(function(f){return {...f,observaciones:e.target.value};});}})
      ),
      React.createElement('div',null,
        React.createElement('label',{style:s.label},'Celular del evaluador (para WhatsApp)'),
        React.createElement('input',{style:s.input,value:form.evaluadorTelefono||'',
          placeholder:'987654321 (9 digitos)',maxLength:9,
          onChange:function(e){setForm(function(f){return {...f,evaluadorTelefono:onlyDigits(e.target.value)};});}})
      ),
      msg&&React.createElement('p',{style:{fontSize:12,color:msg.startsWith('✓')?G:R,margin:0}},msg),
      React.createElement('div',{style:{display:'flex',gap:10,flexWrap:'wrap'}},
        React.createElement('button',{style:s.btnPrimary,disabled:saving,onClick:onSave},saving?'Guardando...':'Guardar cambios'),
        React.createElement(WANotifyButton,{managingEv:ev,planForm:form})
      )
    )
  );
}

function WANotifyButton({managingEv,planForm}){
  if(!managingEv||planForm.estado!=='listo'||!planForm.fechaListo) return null;
  const nombre=((managingEv.participant?.nombres||'')+' '+(managingEv.participant?.apellidos||'')).trim();
  const tipo=TYPES.find(t=>t.id===managingEv.type)?.label||managingEv.type;
  const fechaF=new Date(planForm.fechaListo+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const evaluadorNombre=managingEv.evaluator?.nombre||'Evaluador';
  const msg=encodeURIComponent('Hola '+evaluadorNombre+', el trabajador *'+nombre+'* puede ser re-evaluado en *'+tipo+'* a partir del *'+fechaF+'*. Plan autorizado por Training Bradken Chilca. Evaluacion: *'+managingEv.id+'* - https://bradken-voc.vercel.app');
  const phone=(planForm.evaluadorTelefono||'').replace(/\D/g,'');
  const waNum=phone.length>=9?('51'+phone.slice(-9)):'';
  return <a href={'https://wa.me/'+waNum+'?text='+msg} target="_blank" rel="noopener noreferrer"
    style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25D366',color:'#fff',
      borderRadius:22,padding:'9px 18px',fontSize:13,fontWeight:600,textDecoration:'none'}}>
    <span>💬</span> Notificar evaluador por WhatsApp
  </a>;
}


function onlyDigits(s){return (s||'').split('').filter(function(ch){return ch>='0'&&ch<='9';}).join('');}
export default function App(){
  const [view,setView]=useState('home');
  const [ev,setEv]=useState(null);
  const [step,setStep]=useState(0);
  const [codeIn,setCodeIn]=useState('');
  const [loadEv,setLoadEv]=useState(false);
  const [aiLoad,setAiLoad]=useState(false);
  const [copied,setCopied]=useState(false);
  const [err,setErr]=useState('');
  const [printing,setPrinting]=useState(false);
  const [printFrom,setPrintFrom]=useState('home');
  const [evalCategory,setEvalCategory]=useState(null); // null | 'permiso' | 'licencia' | 'bm'

  function openPrint(fromView){ setPrintFrom(fromView); setPrinting(true); }
  function closePrint(){ setPrinting(false); setView(printFrom==='admin'?'admin:list':printFrom==='admin:forms'?'admin:forms':printFrom); }
  const [adminEvals,setAdminEvals]=useState([]);
  const [adminLoading,setAdminLoading]=useState(false);
  const [adminFilter,setAdminFilter]=useState({type:'',role:'',status:'',search:''});
  const [managingEv,setManagingEv]=useState(null);
  const [editingEv,setEditingEv]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [editSaving,setEditSaving]=useState(false);
  const [editMsg,setEditMsg]=useState('');
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [planForm,setPlanForm]=useState({estado:'pendiente',fechaListo:'',observaciones:'',evaluadorTelefono:''});
  const [planSaving,setPlanSaving]=useState(false);
  const [planMsg,setPlanMsg]=useState('');
  const [pendingReevals,setPendingReevals]=useState([]);
  const [docMeta,setDocMeta]=useState({});       // {typeId: {bknDoc,fecha,revisadoPor,aprobadoPor,rev,fechaEmision,clausula}}
  const [docMetaType,setDocMetaType]=useState(null);
  const [docMetaForm,setDocMetaForm]=useState({});
  const [docMetaSaving,setDocMetaSaving]=useState(false);
  const [docMetaMsg,setDocMetaMsg]=useState('');
  const [pinInput,setPinInput]=useState('');
  const [pinError,setPinError]=useState('');
  const [pinVisible,setPinVisible]=useState(false);
  const [pinAttempts,setPinAttempts]=useState(0);
  const [changingPin,setChangingPin]=useState(false);
  const [newPin,setNewPin]=useState('');
  const [newPinConfirm,setNewPinConfirm]=useState('');
  const [pinChangeMsg,setPinChangeMsg]=useState('');
  const [evalPinInput,setEvalPinInput]=useState('');
  const [evalPinError,setEvalPinError]=useState('');
  const [evalPinVisible,setEvalPinVisible]=useState(false);
  const [evalPinAttempts,setEvalPinAttempts]=useState(0);

  // Refresh pending re-evals every time the evaluator reaches the category screen
  useEffect(()=>{
    if(view==='eval:type'){
      loadPendingReevals().then(setPendingReevals);
    }
  },[view]);
  useEffect(()=>{
    loadDocMeta().then(meta=>setDocMeta(meta));
  },[]);

  function reset(){ setView('home'); setEv(null); setStep(0); setCodeIn(''); setErr(''); setPrinting(false); setEvalCategory(null); }

  async function openAdmin(){
    setPinInput('');setPinError('');setPinAttempts(0);setPinVisible(false);
    setChangingPin(false);setNewPin('');setNewPinConfirm('');setPinChangeMsg('');
    setView('admin:pin');
  }



  async function verifyEvalPin(){
    const correct=await loadPin('evaluator_pin');
    if(evalPinInput===correct){
      setEvalPinError('');setEvalPinAttempts(0);setEvalPinInput('');
      setView('eval:type');
    } else {
      const att=evalPinAttempts+1;
      setEvalPinAttempts(att);
      setEvalPinInput('');
      if(att>=5) setEvalPinError('Acceso bloqueado. Has superado el límite de intentos. Recarga la página para reiniciar.');
      else setEvalPinError(`PIN incorrecto. Intento ${att} de 5.`);
    }
  }

  async function verifyPin(){
    const correct=await loadPin('training_pin');
    if(pinInput===correct){
      setPinError('');setPinAttempts(0);setPinInput('');
      setAdminLoading(true);
      setAdminFilter({type:'',role:'',status:'',search:''});
      const all=await loadAllEvals();
      setAdminEvals(all);
      setAdminLoading(false);
      setView('admin:list');
    } else {
      const attempts=pinAttempts+1;
      setPinAttempts(attempts);
      setPinInput('');
      if(attempts>=5){
        setPinError(`Acceso bloqueado temporalmente. Has superado el límite de intentos. Recarga la página para reiniciar.`);
      } else {
        setPinError(`PIN incorrecto. Intento ${attempts} de 5.`);
      }
    }
  }

  async function handleChangePin(){
    if(!newPin||newPin.length<4){setPinChangeMsg('El PIN debe tener al menos 4 dígitos.');return;}
    if(newPin!==newPinConfirm){setPinChangeMsg('Los PINs no coinciden.');return;}
    if(!/^\d+$/.test(newPin)){setPinChangeMsg('El PIN solo puede contener números.');return;}
    const ok=await savePin('training_pin', newPin);
    if(ok){setPinChangeMsg('✓ PIN actualizado correctamente.');setNewPin('');setNewPinConfirm('');
      setTimeout(()=>{setChangingPin(false);setPinChangeMsg('');},2000);}
    else{setPinChangeMsg('Error al guardar. Intenta nuevamente.');}
  }

  async function refreshAdmin(){
    setAdminLoading(true);
    const all=await loadAllEvals();
    setAdminEvals(all);
    setAdminLoading(false);
  }

  async function loadDocMeta(){
    try{
      const{data}=await supabase.from('config').select('*').like('key','docmeta:%');
      if(!data) return {};
      const meta={};
      data.forEach(row=>{
        const typeId=row.key.replace('docmeta:','');
        try{ meta[typeId]=JSON.parse(row.value); }catch(e){}
      });
      return meta;
    }catch(e){ return {}; }
  }

  async function saveDocMeta(typeId,data){
    setDocMetaSaving(true); setDocMetaMsg('');
    try{
      const{error}=await supabase.from('config').upsert({key:'docmeta:'+typeId,value:JSON.stringify(data),site:'global'});
      if(!error){
        setDocMeta(prev=>({...prev,[typeId]:data}));
        setDocMetaMsg('✓ Metadatos actualizados correctamente.');
      } else setDocMetaMsg('Error al guardar.');
    }catch(e){ setDocMetaMsg('Error: '+e.message); }
    setDocMetaSaving(false);
  }

  async function saveEdit(evalId, participant){
    setEditSaving(true); setEditMsg('');
    try{
      const{error}=await supabase.from('evaluaciones').update({participant}).eq('id',evalId);
      if(!error){ setEditMsg('✓ Datos actualizados correctamente.'); await refreshAdmin(); }
      else setEditMsg('Error al guardar.');
    }catch(e){ setEditMsg('Error: '+e.message); }
    setEditSaving(false);
  }

  async function deleteEval(evalId){
    try{
      const{error}=await supabase.from('evaluaciones').delete().eq('id',evalId);
      if(!error){ setConfirmDelete(null); await refreshAdmin(); setView('admin:list'); }
    }catch(e){ console.error(e); }
  }

  async function savePlan(evalId, planData){
    setPlanSaving(true); setPlanMsg('');
    try{
      const{error}=await supabase.from('evaluaciones').update({plan:planData}).eq('id',evalId);
      if(!error){ setPlanMsg('✓ Guardado correctamente'); await refreshAdmin(); }
      else setPlanMsg('Error al guardar.');
    }catch(e){ setPlanMsg('Error: '+e.message); }
    setPlanSaving(false);
  }

  async function loadPendingReevals(){
    try{
      const{data}=await supabase.from('evaluaciones').select('*')
        .eq('overall_result','NCA').not('plan','is',null);
      if(!data) return [];
      return data.map(normalizeEval).filter(e=>e.plan?.estado==='listo');
    }catch(e){ return []; }
  }

  async function openEvaluador(){
    setEvalPinInput('');setEvalPinError('');setEvalPinAttempts(0);setEvalPinVisible(false);
    // Pre-load pending reevals
    const reevals=await loadPendingReevals();
    setPendingReevals(reevals);
    setView('eval:pin');
  }

  function upEv(fn){ setEv(prev=>{const n={...prev};fn(n);return n;}); }

  async function handleSubmitEval(){
    const hasAll=ev.domains.every(d=>d.items.every(i=>i.result!==null));
    if(!hasAll){setErr('Completa todos los ítems antes de enviar.');return;}
    if(!ev.evaluator.nombre){setErr('Ingresa el nombre del asesor.');return;}
    if(!ev.overallResult){setErr('Selecciona el resultado general.');return;}
    setErr('');
    const toSave={...ev,status:'pending_approval',evaluatorSignedAt:new Date().toISOString()};
    const ok=await saveEval(toSave);
    if(!ok){setErr('Error al guardar. Intenta nuevamente.');return;}
    if(toSave.overallResult==='NCA'){
      setAiLoad(true);
      try{
        const rec=await getAI(toSave);
        toSave.aiRec=rec;
        await saveEval(toSave);
      }catch(e){}
      setAiLoad(false);
    }
    setEv(toSave);
    setView('eval:code');
  }

  async function handleLookup(){
    if(!codeIn.trim()){setErr('Ingresa el código de evaluación.');return;}
    setLoadEv(true);setErr('');
    const found=await loadEval(codeIn);
    setLoadEv(false);
    if(!found){setErr('Código no encontrado. Verifica e intenta nuevamente.');return;}
    setEv(found);
    setView('approve:view');
  }

  async function handleApprove(name){
    const updated={...ev,status:'approved',approval:{by:name,fecha:today(),signedAt:new Date().toISOString()}};
    await saveEval(updated);
    setEv(updated);
    setView('approve:done');
  }

  if(printing&&ev) return <PrintView ev={ev} onClose={closePrint} docMeta={docMeta[ev.type]||{}}/>;

  const TypeIcon=({id})=>{
    const t=TYPES.find(x=>x.id===id);
    return <div style={{width:44,height:44,background:t.color,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
      color:'#fff',fontSize:20,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{t.icon}</div>;
  };

  return <div style={s.layout}>
    <link rel="preconnect" href="https://fonts.googleapis.com"/>
    <header style={s.header}>
      <div style={s.brand}>
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAaoAAABmCAYAAACa0tWNAAAACXBIWXMAAAsSAAALEgHS3X78AAAThElEQVR4nGL8//8/wygYBaNgFIyCUTAoAQMDAwAAAP//YhqNmVEwCkbBKBgFgxYwMDAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//YhnJ0cMYNv0CAwOD/iBwCiEQ+H9V5gZkNYxh0wUYGBgKkIQm/F+V+WFQuXoUjIJRMAooBQwMDAAAAAD//xqxPSrGsOkLhkgl1YheSUEBqJI6BWWvY2BgaKC7y0bBKBgFo4DWgIGBAQAAAP//GpE9Ksaw6aBCPn4QOIUQ2Ph/VSa+CugbAwODAwMDwwMoHgWjYBSMguEFGBgYAAAAAP//GnE9Ksaw6aCCvX8QOIUQuMjAwJCARw1omI8LqgbU4FAYHM4eBaNgFIwCKgIGBgYAAAAA//8aURUVY9h0AwYGBmzDaIMNfARVQPjmnP6vypzAwMBgBq2oeEaH/kbBKBgFwxIwMDAAAAAA//9i/P///4iIXOjigwNDdfHEKBgFo2AUjEjAwMAAAAAA//8aST2qDUN88cQoGAWjYBSMPMDAwAAAAAD//xoRFRVj2HTQMJn9IHAKIbCQwOKJUTAKRsEoGFmAgYEBAAAA//8a9hUVY9h00BxO/iBwCiFwEW1f1CgYBaNgFIx4wMDAwAAAAAD//xrWc1TQxRPnB4FTCAHQ4gmD/6syR5eYj4JRMApGATJgYGAAAAAA//8atj0qxrDpCtDFE0MBBIxWUqNgFIyCUYAFMDAwAAAAAP//GpYVFXSFH2hBAv8gcA4hUPh/VeZQqVBHwSgYBaOAvoCBgQEAAAD//xquPaoJQ2SF30LofqhRMApGwSgYBdgAAwMDAAAA//8adhUVY9j0hiFyPNLo4olRMApGwSggBBgYGAAAAAD//xpWiymgK/zmDwKnEAKjiydGwSgYBaOAGMDAwAAAAAD//xo2FRV0hd+BITIv5Tg6LzUKRsEoGAVEAAYGBgAAAAD//xoWQ3+jiydGwSgYBaNgmAIGBgYAAAAA//8aLnNUoIJffhC4gxAYXTwxCkbBKBgFpAAGBgYAAAAA//8a8hXVELoA8eL/VZn4ru0YBaNgFIyCUYAOGBgYAAAAAP//GtIV1RC6APEj9ILDUTAKRsEoGAWkAAYGBgAAAAD//xqyiymgFyDuHwROIQYY/l+VeWHwO3MUjIJRMAoGGWBgYAAAAAD//xqSPaohdAEiCCSOVlKjYBSMglFAJmBgYAAAAAD//xpyFRV0hd+CIbLCD7R4YsEgcMcoGAWjYBQMTcDAwAAAAAD//xqKPaqhcgHi6OKJUTAKRsEooBQwMDAAAAAA//8aUhXVELoAcXTxxCgYBaNgFFADMDAwAAAAAP//GjIV1RC6ABEEHP6vyvwwCNwxCkbBKBgFQxswMDAAAAAA//8aEhUVdPHEUDjDj2F08cQoGAWjYBRQETAwMAAAAAD//xr0FdUQuwBxdPHEKBgFo2AUUBMwMDAAAAAA//8a1PuooCv8DgyRxRMH/6/KHJ2XGgWjYBSMAmoCBgYGAAAAAP//Guw9qqFyAeJD0HXyg8Ado2AUjIJRMLwAAwMDAAAA//8atBXVELoAEbTCL2B08cQoGAWjYBTQADAwMAAAAAD//xqUFRV0hV/9IHAKMaBgdPHEKBgFo2AU0AgwMDAAAAAA//8adHNUQ+wCxIn/V2WOXic/CkbBKBgFtAIMDAwAAAAA//8aVBUVdPHEhSFyt9To4olRMApGwSigNWBgYAAAAAD//xpsQ39D5QLE0cUTo2AUjIJRQA/AwMAAAAAA//8aNBXVELoAcXTxxCgYBaNgFNALMDAwAAAAAP//GhRDf9DFE0Pl5IlOBgaGHQNo/4P/qzIfDKD9o2AUjIJRQD/AwMAAAAAA//8a8IpqiF2AuJaBgSF4ELjjI/QU+QZSKq1Jk6YaQPem0RNcgOINeXnZRPVCJ02aSs9E+RHJjQfy8rJpds/ZpElTQWb7k6E1MS8vmyonntA5bEHgIqhxBR3WB6UBUtJrAxGrfx3z8rIpOrkGmi+IHdEB+ScAmz8mTZo6kGXZwby8bJQ580mTpoLChdxDvBvz8rJB4U8RIDJM8MchAwMDAAAA//9iodQhlIAhdgHiRgYGhimDpKLih+4xCwBdx0/CsU0CA3D6PMy+CZMmTZ1AjcRPZcAPdSMI50+aNBU0/9hArYoBBiZNmqpAZiUFAg3QgnQoAn0oBvm9f9KkqQeh4TsojkWDVlLErjIGVVIOxDa4hjioB1V0gyKeGBgYAAAAAP//GrA5qiF2ASIogQ7Gu6VAYTcfOnQ62AE/NPEP9gIXtJhnPqj3M2nSVAEqmktJBS0/adLU4XK3GahBsB9UCEIr7wED0DAltpI6OIIqKRigdh4gDzAwMAAAAAD//xrIxRRDafFEwiBfPDEBWvEPBRAP6lkNAXf6U6u3Dy2QKT1lZbD1RCkFoArrArRHQ3cAraTmE1lJLQQNq42wSgoEQGEz8CNeDAwMAAAAAP//GpCKCnoBIrnDIPQGCUPg5AlQghpKG4/zB7o1TSSwh86TUAqo0RsaTr0qGACl2wP0rqygvXpiF29NzMvLHsk3dVMrD5APGBgYAAAAAP//ovsc1RC7ALHx/6rMoTKHNtQ2HzdQWIA3kqlPARpWxO7XK4DOrZHVmoYOnVCrEUGvuaqDFFytA/KvAQlzofzQISYDWvdYoHExgYTeLdUWsSCBhTSKQ1qG3cDOVzEwMAAAAAD//6JrRTXELkDc+H9V5lAabqHWIgmyV/tAW8YNRPaWKapYKV2UQeSKMgZoQRpAQeGSQOTw0kYiwg3cq6JB4YkODlAhfAWg4TaBCP/LQ9MNzUYFoO4h9sog0HB/AY3C+cFgWaAABSC/EpM+QY0JhQEZ/mRgYAAAAAD//6Lb0B/S3VJDAQzWxRODGuTlZV/Iy8sOgLbICYEBPYEEWhAT2yuj5BQSYgvfAuiJJ4TAkGg8gQo0aEGvAM1PhEACrSbukVb2EVtJOdChMTBYALHl3MDNVzEwMAAAAAD//6JLRYVUSQ2FFX5DYfHEYAdDIpNDK6uPRCglqwCFzikRUyEvhO7LIaYSGlJzVdAWODHu5afF8DWZldSIuQ0Bum9wIpHKQfNV9J8LZ2BgAAAAAP//olePaqhcgMgwRBZPDHZAzKZOYnoP9ADExDW5k/3E9n7A6qCteGLCZUj19qEF/0YilFJ1UQWJy89BvT6FkVRJwUBeXjao8iGm1wsCoL1w9F2pycDAAAAAAP//onlFNYQuQGQYYosnBjMgpgcyWIaBaeIO6I58UnpTMEBM5WYPNX8oAbpWACQuPx9JG3lxAdDwNjGjCyBA3/1VDAwMAAAAAP//omlFxRg2PWAIXYA41BZPDGZAzPDAYBkeJKZ1SE4hS2xaQgkHEnpVo2kVByBx+TmooUDzFYeDHUAbS8T21EENMPrlXwYGBgAAAAD//6LZqj/oCr+hMiE5uniCCgBp+S+hFYgTB9HKJ2IqKpIKMejQCDGrMA/iCIcGIgpacK9qkK0gwwcO0KjRmoDUu7wA7RkQO4KzcAD2SCnQoDcMWrhCcY8VNF81adJU0AIjYuLJHzRflZeXTfvN+wwMDAAAAAD//6JJRQVdPLFhCC2eGL22AwFAeyZo2QveCB0TH3AwadLUACKH50itDIj1H9ZeEahXBT29g1D+aRiC++eoDcidVqDFHiliQDwNpkLAxztRwyDQAiNoRUpMQws0XwXaykDbYV0GBgYAAAAA//+i1dDfULkAkQFaSY1em0F78BG6R2tQXDgJzYzEFFQfSRkZIOG4JFy9KRggpqU6FOeqBgMYqEpqqIDBNV/FwMAAAAAA//+ieo9qCF2ACAKF/1dlDpWhk6EMYIU91QoHCgpo2MkUxLZqG0icvyBrbgoLmADtmY32qqgLHg6hGxsGBIDSO3S0gZgrS2DzVbRrgDIwMAAAAAD//6Jqjwp6PNJQWeG38P+qzKFwOOpwAPzQY7Pug4a0qNQC208mnk/iHAbRaQTpNAZC4CGhFj20chztVVEfyA/E+YJDDUB7+8RuiAfPV9HMiwwMDAAAAAD//6JaRQW9AHGoHI90cYgd4jqcQD60oBjMp72DWt2BZEy0E9MDYiCh1zWByCGY0RWApAF9aBocreDxAOiGeGJOmQEB2u2vYmBgAAAAAP//osrQ3xC7AHF08QRhQO6BrwzQPVSEFinoQwvhwbjSciP0nDdy5i2JafwQ7E3BAHQIZgIRq7CG2gpAaoJCtO0DAtCKm9D0Az/0Xix6z1fR4lBaWpZloLwMygvEngdI/aX+DAwMAAAAAP//oriiGmIXIDKMLp4gDKh04CuhY2tA91ItGISFqz90KGMhtMIi9vp8Yg+fJXW4eQGRy4UH+1wVra51uYCehqBXsG8gcuXafGjhSq8RlsF2KC1eMCjmqxgYGAAAAAD//6JGj2p08cQoQAHQxF1AROJOGMQHFYPmsQygPRViKitiK3cFMu73eUjEKtrB3qui2/1j0PhygG78JWY+Mh92HctI3/iLDYDS1IDur2JgYAAAAAD//6KoohpiFyCOLp6gI4AmbkIWUtLyciRDjwJ0gy+x+6f0ocN5eCsWEg6fZaDxXWyDuVdF98ULoDnGSZOmgoYF+4lQTmrDZESBAd1fxcDAAAAAAP//IruiGmIXII4unhicgB/UkiWnYKCw51AA7fERU4ARc3HiYJlrG5S9KujesgFp0IJa9pMmTX1A5PQEqGHyABqGowdTYwJS5qtAm9ap02hiYGAAAAAA//8ia9XfELsAEXx0/+jiCfoCElYADcgyYejQRCERSvnxuZGEVia9wKBaAQgdUiN2oRVNKgfoVRYORK6ghF2PPyg2pg8mAG2sERsusAVTlAMGBgYAAAAA//8iuaIaYhcgMoxWUgMGiC0wB6zlCq2siCm88LUMB1tPfVDsqwJVUNAh0Qck3AVFs3IF2kMi9hJHUGW1fijd+0UvQOL+KtBwKuVhyMDAAAAAAP//Imnob4hdgAgCiaN3S5EOKCzoBKCFNzG9jI+DYD7gArk9ooEc0iIAKJ2rciBjwQcMCEB7oKSGKaHhVYoBdJGPA7SlT8wii/nQYcDRCgsJkDhfRfkBEAwMDAAAAAD//yJ1jmooXYAIWjwxks7zInZjHjGAmKWo1ABDfQUmsYX5RCruM1xAhxWA9nQeznxIzWEifAB24/CkSVM/EDnHHg9tkARQqSKl1aHPoLMj6dmTJmW+ijLAwMAAAAAA//8iuqIaYhcgXvy/KnOktYKG4vllQ3YVJgmHz34k47xAfPYScwUIwxA6A/AjFSsBogFo3xR0RSAxYWkPm7cicyP4sAMk7q+iDDAwMAAAAAD//yJqjmqIXYD4cQQe0vlwCN39BQMbh/hJCsQ2hKg6pAU9RYGYeZahcAbgR+jNugMyPA8NS0Mi5ylBI0kXRs8IRABo/iVmQRJlgIGBAQAAAP//IlhRDbELEBlG4OKJoXgk1JC+qBK2OZRI5bTIOxTddzVIAGioWmGgl4FD7XcgYZHFgdFFFggAXZAEOnaMdoCBgQEAAAD//8JbUQ2xCxAZRuDiiYvQinko+XkjtBU9lBsTxB6XtJAWQ0XQliwxc5KDsVcFcrcjaD5lsKQBpMqKmDDlhy6yGD0IGAFA+QE0qkMbwMDAAAAAAP//IjRHNZAXIJK6OODCCFk88RAaLxv+r8okdV7qA5UXXZACQIXBhmFycOpg6NGACof7RLphICuri9BJ9wPQ+B+UczxkHLsEWhShMLoiEGW+6jxNLGBgYAAAAAD//2L8//8/rcweBaNgFIyCUTAKKAMMDAwAAAAA//+i1VX0o2AUjIJRMApGAeWAgYEBAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//Gq2oRsEoGAWjYBQMXsDAwAAAAAD//xqtqEbBKBgFo2AUDF7AwMAAAAAA//8arahGwSgYBaNgFAxewMDAAAAAAP//AwCOifTnzj3glAAAAABJRU5ErkJggg==" alt="Bradken" style={{height:42,objectFit:"contain",flexShrink:0}}/>
        <div>
          <div style={s.brandName}>Bradken · Verificación de Competencias</div>
          <span style={s.brandSub}>Training Manufacturing</span>
        </div>
      </div>
      {ev?.status&&ev.status!=='draft'&&view!=='admin:list'&&<button onClick={()=>openPrint(view)}
        style={{...s.btnSm,gap:5}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Imprimir PDF
      </button>}
    </header>

    <div style={s.main}>
      {/* ── HOME ── */}
      {view==='home'&&<div>
        <div style={{padding:'28px 0 20px'}}>
          <h1 style={{...s.h1,fontSize:22}}>Verificación de Competencias</h1>
          <p style={{color:T2,fontSize:13,margin:'4px 0 0'}}>Evaluación por dominios para actividades de alto riesgo · Bradken Chilca</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
          {[{
            id:'eval',
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
            color:BRAND,bg:BRANDL,
            title:'Soy Evaluador',
            sub:'Iniciar una nueva evaluación de competencias',
            target:'eval:type',
            action: openEvaluador
          },{
            id:'approve',
            icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
            color:'#0F766E',bg:'#F0FDFA',
            title:'Soy Evaluado',
            sub:'Revisar y aprobar mi evaluación con mi código',
            target:'approve:enter'
          }].map(x=><button key={x.id} onClick={()=>x.action?x.action():setView(x.target)}
            style={{...s.card,cursor:'pointer',textAlign:'left',padding:'20px',border:`1px solid ${BD}`,transition:'border-color .15s,box-shadow .15s'}}
            onMouseOver={e=>{e.currentTarget.style.borderColor=x.color;e.currentTarget.style.boxShadow='0 4px 20px rgba(27,92,168,.12)';}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
            <div style={{width:44,height:44,background:x.bg,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',color:x.color,marginBottom:14}}>{x.icon}</div>
            <div style={{fontSize:15,fontWeight:600,color:TX,marginBottom:4}}>{x.title}</div>
            <div style={{fontSize:12,color:T2,lineHeight:1.5}}>{x.sub}</div>
          </button>)}
        </div>
        <button onClick={openAdmin}
          style={{...s.card,cursor:'pointer',textAlign:'left',width:'100%',display:'flex',alignItems:'center',gap:16,padding:'16px 20px',border:`1px solid ${BD}`,transition:'border-color .15s,box-shadow .15s'}}
          onMouseOver={e=>{e.currentTarget.style.borderColor=AM;e.currentTarget.style.boxShadow='0 4px 20px rgba(245,158,11,.12)';}}
          onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
          <div style={{width:44,height:44,background:ABKG,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',color:AM,flexShrink:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600,color:TX,marginBottom:2}}>Área de Training — Historial</div>
            <div style={{fontSize:12,color:T2}}>Ver todas las evaluaciones registradas, descargar PDF, gestionar para LMS</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>}


      {/* ── EVAL: REEVALS ── */}
      {view==='eval:reevals'&&(()=>{
        // Group by evaluator name alphabetically
        const grouped={};
        pendingReevals.forEach(e=>{
          const evName=(e.evaluator?.nombre||'Sin evaluador').toUpperCase();
          if(!grouped[evName]) grouped[evName]=[];
          grouped[evName].push(e);
        });
        const sorted=Object.keys(grouped).sort();
        return <div>
          <button style={s.back} onClick={()=>setView('eval:type')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Categorías
          </button>
          <h2 style={s.h1}>Re-evaluaciones Autorizadas</h2>
          <p style={{color:T2,fontSize:13,margin:'4px 0 20px'}}>Trabajadores con plan de desarrollo completado · organizados por evaluador</p>
          {sorted.length===0
            ? <div style={{...s.card,textAlign:'center',padding:'32px'}}>
                <div style={{fontSize:32,marginBottom:8}}>🟢</div>
                <p style={{color:T2}}>No hay re-evaluaciones pendientes.</p>
              </div>
            : sorted.map(evName=><div key={evName} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,padding:'0 4px'}}>
                  {evName}
                </div>
                {grouped[evName].map(e=>{
                  const tipo=TYPES.find(t=>t.id===e.type)?.label||e.type;
                  const fechaF=e.plan?.fechaListo
                    ? new Date(e.plan.fechaListo+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit',year:'numeric'})
                    : '—';
                  return <div key={e.id} style={{...s.card,padding:'14px 16px',marginBottom:8,border:`1px solid ${GBD}`,background:GBKG,display:'flex',alignItems:'center',gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:TX}}>{e.participant?.nombres} {e.participant?.apellidos}</div>
                      <div style={{fontSize:12,color:T2,marginTop:2}}>{tipo} · Código original: {e.id}</div>
                      <div style={{fontSize:12,color:G,marginTop:2,fontWeight:500}}>🟢 Puede evaluarse desde: {fechaF}</div>
                      {e.plan?.observaciones&&<div style={{fontSize:11,color:T2,marginTop:4,fontStyle:'italic'}}>"{e.plan.observaciones}"</div>}
                    </div>
                    <button onClick={async()=>{
                        // Mark original eval plan as re-evaluated → removes from pending list
                        const updatedPlan={...(e.plan||{}),estado:'re_evaluado',reEvalFecha:new Date().toISOString()};
                        await supabase.from('evaluaciones').update({plan:updatedPlan}).eq('id',e.id);
                        // Refresh pending list
                        const reevals=await loadPendingReevals();
                        setPendingReevals(reevals);
                        // Start new eval pre-filled with original participant data
                        const newEval=initEval(e.type,e.role);
                        newEval.participant={
                          ...newEval.participant,
                          nombres:e.participant?.nombres||'',
                          apellidos:e.participant?.apellidos||'',
                          cargo:e.participant?.cargo||'',
                          telefono:e.participant?.telefono||'',
                          equipo:e.participant?.equipo||'',
                          area:e.participant?.area||'',
                        };
                        setEv(newEval);
                        setEvalCategory(null);
                        setView('eval:participant');
                      }}
                      style={{...s.btnPrimary,fontSize:12,padding:'7px 14px',flexShrink:0}}>
                      Iniciar re-evaluación →
                    </button>
                  </div>;
                })}
              </div>
            )
          }
        </div>;
      })()}

      {/* ── EVAL: PIN ── */}
      {view==='eval:pin'&&<div style={{maxWidth:360,margin:'48px auto'}}>
        <button style={s.back} onClick={reset}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Inicio
        </button>
        <div style={{...s.card,textAlign:'center',padding:'32px 24px'}}>
          <div style={{width:56,height:56,background:BRANDL,borderRadius:'50%',display:'flex',alignItems:'center',
            justifyContent:'center',margin:'0 auto 16px',color:BRAND}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 style={{...s.h1,fontSize:20,marginBottom:4}}>Acceso — Evaluador</h2>
          <p style={{fontSize:13,color:T2,marginBottom:24}}>Ingresa el PIN para iniciar una evaluación.</p>
          <div style={{position:'relative',marginBottom:8}}>
            <input
              type={evalPinVisible?'text':'password'}
              inputMode="numeric"
              value={evalPinInput}
              onChange={e=>setEvalPinInput(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>e.key==='Enter'&&evalPinAttempts<5&&verifyEvalPin()}
              placeholder="••••"
              maxLength={8}
              disabled={evalPinAttempts>=5}
              style={{...s.input,textAlign:'center',fontSize:28,letterSpacing:8,fontFamily:"'DM Mono',monospace",paddingRight:44,boxSizing:'border-box'}}
              autoFocus
            />
            <button onClick={()=>setEvalPinVisible(v=>!v)}
              style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',cursor:'pointer',color:T3,fontSize:16,padding:4}}>
              {evalPinVisible?'🙈':'👁'}
            </button>
          </div>
          {evalPinError&&<p style={{fontSize:12,color:R,margin:'6px 0 12px',lineHeight:1.4}}>{evalPinError}</p>}
          <button style={{...s.btnPrimary,width:'100%',padding:12,fontSize:14,marginTop:8,
            opacity:evalPinAttempts>=5?0.4:1}}
            onClick={verifyEvalPin}
            disabled={evalPinAttempts>=5||!evalPinInput}>
            Ingresar →
          </button>
          <p style={{fontSize:11,color:T3,marginTop:16}}>Solo personal autorizado como Evaluador · Bradken Chilca</p>
        </div>
      </div>}

      {view==='eval:type'&&(()=>{
        const CATS=[
          { id:'permiso',
            label:'Permisos de Trabajo de Alto Riesgo',
            icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
            color:BK, bg:'#FEF2F2',
            desc:'Alturas · Espacios Confinados · Caliente · LOTO' },
          { id:'licencia',
            label:'Licencias de Equipo y Vehículo',
            icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
            color:'#0891B2', bg:'#ECFEFF',
            desc:'BC1 · BC3 · Montacargas · Manlift · Tijera' },
          { id:'bm',
            label:'Licencias para Fundir – Horno de Inducción (BM)',
            icon:<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 6-8 6-8 12a8 8 0 0 0 16 0c0-6-8-6-8-12z"/></svg>,
            color:'#D97706', bg:'#FFFBEB',
            desc:'BM1 · BM2 · BM3 · BM4 · BM5 · BM6 · BM7' },
        ];
        const catTypes={
          permiso: TYPES.filter(t=>t.mode==='permiso'),
          licencia: TYPES.filter(t=>t.mode==='licencia'&&!t.id.startsWith('bm')),
          bm: TYPES.filter(t=>t.id.startsWith('bm')),
        };
        const handleTypeClick=(t)=>{
          if(t.mode==='licencia'){setEv(initEval(t.id,'operador'));setView('eval:participant');}
          else{setEv(e=>({...e,_type:t.id}));setView('eval:role');}
        };
        const TypeCard=({t})=><button onClick={()=>handleTypeClick(t)}
          style={{...s.card,cursor:'pointer',textAlign:'left',padding:'16px 18px',border:`1px solid ${BD}`,transition:'all .15s'}}
          onMouseOver={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)';}}
          onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
          <div style={{width:40,height:40,background:t.color+'18',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:10,
            color:t.color,fontWeight:700,fontSize:t.icon?.length>1?12:18,border:`1px solid ${t.color}25`,fontFamily:"'DM Mono',monospace"}}>{t.icon}</div>
          <div style={{fontSize:13,fontWeight:600,color:TX,marginBottom:2,lineHeight:1.3}}>{t.label}</div>
          <div style={{fontSize:11,color:T2,marginTop:2,lineHeight:1.4}}>{t.sub}</div>
          <div style={{fontSize:10,color:T3,marginTop:6,fontFamily:"'DM Mono',monospace"}}>{t.code}</div>
        </button>;

        if(!evalCategory) return <div>
          <button style={s.back} onClick={reset}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Inicio
          </button>
          {pendingReevals.length>0&&<button onClick={()=>setView('eval:reevals')}
            style={{...s.card,cursor:'pointer',display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
              marginBottom:16,border:`1.5px solid ${G}`,background:GBKG,textAlign:'left',width:'100%'}}>
            <div style={{width:36,height:36,background:G,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16,flexShrink:0}}>{pendingReevals.length}</div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:G}}>Trabajadores listos para re-evaluación</div>
              <div style={{fontSize:12,color:T2}}>Training autorizó su re-evaluación → Ver lista</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto'}}><polyline points="9 18 15 12 9 6"/></svg>
          </button>}
          <h2 style={s.h1}>Selecciona la categoría</h2>
          <p style={{color:T2,fontSize:13,margin:'4px 0 24px'}}>Elige la categoría para ver los tipos de evaluación disponibles</p>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {CATS.map(cat=><button key={cat.id} onClick={()=>setEvalCategory(cat.id)}
              style={{...s.card,cursor:'pointer',display:'flex',alignItems:'center',gap:20,padding:'20px 24px',border:`1px solid ${BD}`,textAlign:'left',transition:'all .15s'}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.boxShadow='0 4px 24px rgba(0,0,0,.1)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
              <div style={{width:68,height:68,background:cat.bg,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',
                color:cat.color,flexShrink:0,border:`1.5px solid ${cat.color}30`}}>
                {cat.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:17,fontWeight:600,color:TX,lineHeight:1.3,marginBottom:4}}>{cat.label}</div>
                <div style={{fontSize:12,color:T2}}>{cat.desc}</div>
                <div style={{fontSize:12,color:cat.color,marginTop:6,fontWeight:500}}>{catTypes[cat.id]?.length} evaluaciones disponibles →</div>
              </div>
            </button>)}
          </div>
        </div>;

        const activeCat=CATS.find(c=>c.id===evalCategory);
        return <div>
          <button style={s.back} onClick={()=>setEvalCategory(null)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Categorías
          </button>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <div style={{width:44,height:44,background:activeCat.bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:activeCat.color,border:`1.5px solid ${activeCat.color}30`}}>
              {activeCat.icon}
            </div>
            <div>
              <h2 style={{...s.h1,fontSize:18,marginBottom:2}}>{activeCat.label}</h2>
              <div style={{fontSize:12,color:T2}}>{catTypes[evalCategory]?.length} tipos disponibles</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {catTypes[evalCategory]?.map(t=><TypeCard key={t.id} t={t}/>)}
          </div>
        </div>;
      })()}


      {/* ── EVAL: ROLE ── */}
      {view==='eval:role'&&<div>
        <button style={s.back} onClick={()=>setView('eval:type')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Tipo de permiso
        </button>
        <h2 style={s.h1}>Rol a evaluar</h2>
        <p style={{color:T2,fontSize:13,margin:'4px 0 20px'}}>Selecciona el rol del trabajador dentro del permiso de trabajo</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[{id:'emisor',title:'EMISOR / AUTORIZADOR',sub:'Emite y autoriza el permiso. Evalúa condiciones, verifica EPP y controla la vigencia.',
             svgPath:<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><polyline points="16 3 18 5 22 1"/></>},
            {id:'ejecutor',title:'EJECUTOR',sub:'Realiza físicamente el trabajo de alto riesgo dentro de las condiciones autorizadas.',
             svgPath:<><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>}
          ].map(r=>{
            const activeType=ev?._type||ev?.type;
            const t=TYPES.find(x=>x.id===activeType)||TYPES[0];
            return <button key={r.id} onClick={()=>{setEv(initEval(activeType,r.id));setView('eval:participant');}}
              style={{...s.card,cursor:'pointer',textAlign:'left',border:`1px solid ${BD}`,padding:'20px',transition:'all .15s'}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.1)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
              <div style={{width:44,height:44,background:t.color+'18',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',
                color:t.color,marginBottom:14,border:`1px solid ${t.color}30`}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.svgPath}</svg>
              </div>
              <div style={{fontSize:14,fontWeight:600,color:TX,marginBottom:6}}>{r.title}</div>
              <div style={{fontSize:12,color:T2,lineHeight:1.6}}>{r.sub}</div>
            </button>;
          })}
        </div>
      </div>}

      {/* ── EVAL: PARTICIPANT ── */}
      {view==='eval:participant'&&ev&&<div>
        <button style={s.back} onClick={()=>setView(ev.mode==='licencia'?'eval:type':'eval:role')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {ev.mode==='licencia'?'Tipo de evaluación':'Rol'}
        </button>
        {(()=>{
          const typeInfo=TYPES.find(x=>x.id===ev.type);
          const roleLabel=ev.mode==='licencia'?'Evaluación de Competencia':ev.role==='emisor'?'EMISOR / AUTORIZADOR':'EJECUTOR';
          return <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <div style={{width:44,height:44,background:typeInfo?.color+'18',borderRadius:11,flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',color:typeInfo?.color,
              fontWeight:700,fontSize:typeInfo?.icon?.length>1?12:18,fontFamily:"'DM Mono',monospace",border:`1px solid ${typeInfo?.color}30`}}>
              {typeInfo?.icon}
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:TX}}>{typeInfo?.label}</div>
              <div style={{fontSize:12,color:T2}}>{roleLabel}</div>
            </div>
          </div>;
        })()}
        <div style={{...s.card,display:'flex',flexDirection:'column',gap:14}}>
          <h3 style={{...s.h2,margin:'0 0 4px'}}>Datos del participante</h3>
          {[['nombres','Nombres'],['apellidos','Apellidos'],['cargo','Cargo / Puesto'],['fechaCurso','Fecha del curso'],['telefono','Número de celular (para WhatsApp)']].map(([f,l])=><div key={f}>
            <label style={s.label}>{l}</label>
            <input style={s.input} value={ev.participant[f]} onChange={e=>upEv(n=>{n.participant[f]=e.target.value;})} placeholder={l}/>
          </div>)}
          {TYPES.find(x=>x.id===ev.type)?.prereq&&<div>
            <label style={s.label}>{TYPES.find(x=>x.id===ev.type).prereq}</label>
            <div style={{display:'flex',gap:10,marginTop:4}}>
              {['Sí','No'].map(opt=><button key={opt} onClick={()=>upEv(n=>{n.participant.prereqCheck=opt;})}
                style={{padding:'6px 20px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .1s',
                  background:ev.participant.prereqCheck===opt?(opt==='Sí'?G:R):'transparent',
                  color:ev.participant.prereqCheck===opt?'#fff':opt==='Sí'?G:R,
                  border:`1.5px solid ${ev.participant.prereqCheck===opt?(opt==='Sí'?G:R):(opt==='Sí'?GBD:RBD)}`}}>{opt}</button>)}
            </div>
            {ev.participant.prereqCheck==='No'&&<p style={{fontSize:11,color:R,marginTop:6}}>⚠ Este prerrequisito es obligatorio para realizar la evaluación BC3.</p>}
          </div>}

          {/* ── Type-specific extra fields ── */}
          {(()=>{
            const xf=TYPES.find(x=>x.id===ev.type)?.xfields||[];
            return <>
              {xf.includes('area')&&<div>
                <label style={s.label}>Área / Tarea observada</label>
                <input style={s.input} value={ev.participant.area||''}
                  onChange={e=>upEv(n=>{n.participant.area=e.target.value;})}
                  placeholder="Ej: Fachada norte nivel 3, andamio área de mantenimiento..."/>
              </div>}
              {xf.includes('equipo')&&<div>
                <label style={s.label}>Marca / Modelo del equipo evaluado</label>
                <input style={s.input} value={ev.participant.equipo}
                  onChange={e=>upEv(n=>{n.participant.equipo=e.target.value;})}
                  placeholder="Ej: Toyota 8FGU25 / E18 AJ RT / Genie GS-2032"/>
              </div>}
              {xf.includes('colada')&&<div>
                <label style={s.label}>Número de Colada / N° de Operación</label>
                <input style={s.input} value={ev.participant.colada}
                  onChange={e=>upEv(n=>{n.participant.colada=e.target.value;})}
                  placeholder="Ej: C-2025-147"/>
              </div>}
              {xf.includes('turno')&&<div>
                <label style={s.label}>Turno de evaluación</label>
                <div style={{display:'flex',gap:10,marginTop:4}}>
                  {['Mañana','Tarde','Noche'].map(t=><button key={t} onClick={()=>upEv(n=>{n.participant.turno=t;})}
                    style={{padding:'6px 18px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                      background:ev.participant.turno===t?BRAND:'transparent',
                      color:ev.participant.turno===t?'#fff':T2,
                      border:`1.5px solid ${ev.participant.turno===t?BRAND:BD}`}}>{t}</button>)}
                </div>
              </div>}
              {xf.includes('logbook')&&<div>
                <label style={s.label}>Logbook completado (horas de supervisión requeridas)</label>
                <div style={{display:'flex',gap:10,marginTop:4}}>
                  {['Sí','No'].map(opt=><button key={opt} onClick={()=>upEv(n=>{n.participant.logbook=opt;})}
                    style={{padding:'6px 20px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                      background:ev.participant.logbook===opt?(opt==='Sí'?G:R):'transparent',
                      color:ev.participant.logbook===opt?'#fff':opt==='Sí'?G:R,
                      border:`1.5px solid ${ev.participant.logbook===opt?(opt==='Sí'?G:R):(opt==='Sí'?GBD:RBD)}`}}>{opt}</button>)}
                </div>
                {ev.participant.logbook==='No'&&<p style={{fontSize:11,color:AM,marginTop:4}}>⚠ El logbook completado es prerequisito para la evaluación.</p>}
              </div>}
              {xf.includes('supervisor')&&<div style={{...s.card,padding:'14px 16px',marginTop:4,borderColor:BD}}>
                <div style={{fontSize:12,fontWeight:600,color:TX,marginBottom:10}}>Reconocimiento del Supervisor</div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10}}>
                  <div>
                    <label style={s.label}>Nombre del Supervisor</label>
                    <input style={s.input} value={ev.participant.supNombre}
                      onChange={e=>upEv(n=>{n.participant.supNombre=e.target.value;})}
                      placeholder="Nombre completo del supervisor"/>
                  </div>
                  <div>
                    <label style={s.label}>Fecha</label>
                    <input style={s.input} value={ev.participant.supFecha}
                      onChange={e=>upEv(n=>{n.participant.supFecha=e.target.value;})}
                      placeholder="DD/MM/AAAA"/>
                  </div>
                </div>
              </div>}
            </>;
          })()}
          <button style={{...s.btnPrimary,marginTop:4}}
            onClick={()=>{
              if(!ev.participant.nombres||!ev.participant.apellidos){setErr('Nombres y apellidos son obligatorios.');return;}
              setErr('');setView('eval:form');
            }}>
            Iniciar evaluación
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          {err&&<p style={{color:R,fontSize:12,margin:0}}>{err}</p>}
        </div>
      </div>}

      {/* ── EVAL: FORM ── */}
      {view==='eval:form'&&ev&&<div>
        <button style={s.back} onClick={()=>setView('eval:participant')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Datos del participante
        </button>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:TX}}>{ev.participant.nombres} {ev.participant.apellidos}</div>
            <div style={{fontSize:12,color:T2}}>{TYPES.find(x=>x.id===ev.type)?.label}{ev.mode!=='licencia'?` · ${ev.role==='emisor'?'Emisor':'Ejecutor'}`:''}</div>
          </div>
          <span style={{...s.tag,background:BRANDL,color:BRAND,border:`1px solid #C3D5F0`}}>
            {ev.domains.reduce((a,d)=>a+d.items.filter(i=>i.result!==null).length,0)}/
            {ev.domains.reduce((a,d)=>a+d.items.length,0)} ítems
          </span>
        </div>
        {ev.domains.map((d,di)=><div key={d.k} style={{...s.card,marginBottom:12,padding:0,overflow:'hidden'}}>
          <div style={{background:S2,borderBottom:`1px solid ${BD}`,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <span style={{fontSize:13,fontWeight:600,color:TX}}>{d.label}</span>
              <span style={{fontSize:11,color:T2,marginLeft:8}}>{d.sub}</span>
            </div>
            {d.items.every(i=>i.result!==null)&&<span style={{fontSize:11,color:G,fontWeight:600}}>✓ Completado</span>}
          </div>
          <div>
            {d.items.map((item,ii)=><div key={ii} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'11px 16px',
              borderBottom:ii<d.items.length-1?`1px solid ${BD}`:'none',background:ii%2===0?SF:PGBG}}>
              <div style={{flex:1,fontSize:13,lineHeight:1.6,color:TX,paddingTop:2}}>{item.text}</div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                {['C','NCA'].map(r=><button key={r} onClick={()=>upEv(n=>{n.domains[di].items[ii].result=r;})}
                  style={{padding:'4px 14px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .1s',
                    background:item.result===r?(r==='C'?G:R):'transparent',
                    color:item.result===r?'#fff':r==='C'?G:R,
                    border:`1.5px solid ${item.result===r?(r==='C'?G:R):(r==='C'?GBD:RBD)}`}}>{r}</button>)}
              </div>
            </div>)}
          </div>
        </div>)}
        <div style={{...s.card,marginTop:4}}>
          <h3 style={{...s.h2,fontSize:16,marginBottom:12}}>Resultado y cierre de evaluación</h3>
          <div style={{marginBottom:14}}>
            <label style={s.label}>Nombre del Asesor / Evaluador</label>
            <input style={s.input} value={ev.evaluator.nombre} onChange={e=>upEv(n=>{n.evaluator.nombre=e.target.value;})} placeholder="Nombre completo del evaluador"/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={s.label}>Resultado general de la evaluación</label>
            {(()=>{
              const hasNCA=(ev.domains||[]).some(d=>(d.items||[]).some(i=>i.result==='NCA'));
              return <div style={{display:'flex',gap:10,marginTop:6,flexDirection:'column'}}>
                {hasNCA&&<div style={{fontSize:11,color:R,background:RBKG,border:`1px solid ${RBD}`,borderRadius:8,padding:'6px 12px'}}>
                  ⚠ Se detectaron ítems NCA — el resultado Competente está bloqueado automáticamente.
                </div>}
                <div style={{display:'flex',gap:10}}>
                  <button disabled={hasNCA} onClick={()=>{if(!hasNCA)upEv(n=>{n.overallResult='C';});}}
                    style={{flex:1,padding:'10px',borderRadius:22,fontSize:13,fontWeight:600,
                      cursor:hasNCA?'not-allowed':'pointer',opacity:hasNCA?0.3:1,transition:'all .1s',
                      background:ev.overallResult==='C'?G:SF,
                      color:ev.overallResult==='C'?'#fff':G,
                      border:`1.5px solid ${ev.overallResult==='C'?G:GBD}`}}>
                    ✅ Competente (C)
                  </button>
                  <button onClick={()=>upEv(n=>{n.overallResult='NCA';})}
                    style={{flex:1,padding:'10px',borderRadius:22,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .1s',
                      background:ev.overallResult==='NCA'?R:SF,
                      color:ev.overallResult==='NCA'?'#fff':R,
                      border:`1.5px solid ${ev.overallResult==='NCA'?R:RBD}`}}>
                    ❌ No Competente Aún (NCA)
                  </button>
                </div>
              </div>;
            })()}
          </div>
          <div style={{marginBottom:16}}>
            <label style={s.label}>Operación observada y comentarios / recomendaciones</label>
            <textarea style={{...s.input,height:72,resize:'vertical'}} value={ev.participant?.operacionObservada||''}
              onChange={e=>upEv(n=>{n.participant.operacionObservada=e.target.value;})}
              placeholder="Describe la tarea o actividad específica observada, condiciones del área, materiales, turno..."/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={s.label}>Comentarios y recomendaciones del evaluador</label>
            <textarea style={{...s.input,height:80,resize:'vertical'}} value={ev.comments} onChange={e=>upEv(n=>{n.comments=e.target.value;})} placeholder="Observaciones generales, recomendaciones, condiciones específicas..."/>
          </div>
          {err&&<p style={{color:R,fontSize:12,margin:'0 0 10px'}}>{err}</p>}
          {aiLoad&&<div style={{display:'flex',alignItems:'center',gap:8,color:'var(--text-secondary)',fontSize:13,marginBottom:10}}>
            <svg style={{animation:'spin 1s linear infinite'}} width='14' height='14' viewBox='0 0 24 24' fill='none' stroke={BRAND} strokeWidth='2.5' strokeLinecap='round'><path d='M21 12a9 9 0 1 1-6.219-8.56'/></svg> Generando plan de desarrollo con IA...
          </div>}
          <button style={{...s.btnPrimary,width:'100%',padding:12,fontSize:15}} onClick={handleSubmitEval} disabled={aiLoad}>
            {aiLoad?'Procesando...':'Enviar evaluación y generar código'}
          </button>
        </div>
      </div>}

      {/* ── EVAL: CODE ── */}
      {view==='eval:code'&&ev&&<div style={{textAlign:'center',padding:'24px 0'}}>
        <div style={{fontSize:40,marginBottom:12}}>✅</div>
        <h2 style={{...s.h1,marginBottom:4}}>Evaluación registrada</h2>
        <p style={{color:T2,marginBottom:20}}>
          Comparte este código con <b>{ev.participant.nombres} {ev.participant.apellidos}</b> para que pueda revisar y aprobar su evaluación.
        </p>
        <div style={{marginBottom:20}}>
          <p style={{fontSize:13,color:T2,marginBottom:8}}>Código de evaluación</p>
          <div style={s.code}>{ev.id}</div>
        </div>

        {/* WhatsApp share button */}
        {(()=>{
          const nombre=`${ev.participant.nombres||''} ${ev.participant.apellidos||''}`.trim();
          const tipo=TYPES.find(x=>x.id===ev.type)?.label||ev.type;
          const msg=encodeURIComponent(
            `Hola ${nombre}, tu evaluación de competencias *${tipo}* en Bradken Chilca ha sido registrada.\n\n` +
            `Tu código de acceso es: *${ev.id}*\n\n` +
            `Ingresa a https://bradken-voc.vercel.app, selecciona "Soy Evaluado" e ingresa tu código para revisar y aprobar tu evaluación.\n\n` +
            `— Equipo Training Bradken Chilca`
          );
          const phone=(ev.participant.telefono||'').replace(/\D/g,'');
          const waNum=phone.length>=9?`51${phone.slice(-9)}`:'';
          return <div style={{marginBottom:16}}>
            <a href={`https://wa.me/${waNum}?text=${msg}`} target="_blank" rel="noopener noreferrer"
              style={{display:'inline-flex',alignItems:'center',gap:8,background:'#25D366',color:'#fff',
                borderRadius:22,padding:'10px 22px',fontSize:14,fontWeight:600,textDecoration:'none'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.506 3.93 1.394 5.6L0 24l6.562-1.394C8.2 23.494 10.075 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.587-.49-5.092-1.348l-.362-.215-3.897.828.843-3.794-.234-.38C2.49 15.587 2 13.848 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Enviar código por WhatsApp
            </a>
            <p style={{fontSize:11,color:T3,marginTop:6}}>Abre WhatsApp con el mensaje listo · solo presiona Enviar</p>
          </div>;
        })()}

        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
          <button style={{...s.btn,borderRadius:22}} onClick={()=>{navigator.clipboard?.writeText(ev.id);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
            {copied?'✓ Copiado':'Copiar código'}
          </button>
          <button style={s.btn} onClick={()=>openPrint('eval:code')}>🖨 Imprimir evaluación</button>
          <button style={{...s.btnPrimary}} onClick={reset}>Nueva evaluación</button>
        </div>
        {ev.aiRec&&<div style={{...s.card,marginTop:28,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <div style={{width:24,height:24,background:'#1A5276',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>✦</div>
            <span style={{fontWeight:600,fontSize:14}}>Plan de desarrollo IA — ítems NCA</span>
          </div>
          <p style={{fontSize:13,lineHeight:1.7,color:T2,whiteSpace:'pre-wrap',margin:0}}>{ev.aiRec}</p>
        </div>}
        <div style={{...s.card,marginTop:16,textAlign:'left'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <ResultBadge r={ev.overallResult}/>
            <span style={{fontSize:13,color:T2}}>{ev.participant.nombres} {ev.participant.apellidos} · {ev.role==='emisor'?'Emisor':ev.mode==='licencia'?'Operador':'Ejecutor'}</span>
          </div>
        </div>
      </div>}

      {/* ── ADMIN: PIN ── */}
      {view==='admin:pin'&&<div style={{maxWidth:360,margin:'48px auto'}}>
        <button style={s.back} onClick={reset}>← Inicio</button>
        <div style={{...s.card,textAlign:'center',padding:'32px 24px'}}>
          <div style={{width:56,height:56,background:BRANDL,borderRadius:'50%',display:'flex',alignItems:'center',
            justifyContent:'center',margin:'0 auto 16px',color:BRAND}}><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg></div>
          <h2 style={{...s.h1,fontSize:22,marginBottom:4}}>Área de Training</h2>
          <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:24}}>Acceso restringido. Ingresa el PIN para continuar.</p>
          <div style={{position:'relative',marginBottom:8}}>
            <input
              type={pinVisible?'text':'password'}
              inputMode="numeric"
              value={pinInput}
              onChange={e=>setPinInput(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>e.key==='Enter'&&pinAttempts<5&&verifyPin()}
              placeholder="••••"
              maxLength={8}
              disabled={pinAttempts>=5}
              style={{...s.input,textAlign:'center',fontSize:28,letterSpacing:8,fontFamily:"'DM Mono',monospace",
                paddingRight:44,boxSizing:'border-box'}}
              autoFocus
            />
            <button onClick={()=>setPinVisible(v=>!v)}
              style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:16,padding:4}}>
              {pinVisible?'🙈':'👁'}
            </button>
          </div>
          {pinError&&<p style={{fontSize:12,color:R,margin:'6px 0 12px',lineHeight:1.4}}>{pinError}</p>}
          <button
            style={{...s.btnPrimary,width:'100%',padding:12,fontSize:15,marginTop:8,
              opacity:pinAttempts>=5?0.4:1}}
            onClick={verifyPin}
            disabled={pinAttempts>=5||!pinInput}
          >Ingresar →</button>
          <p style={{fontSize:11,color:T3,marginTop:16}}>
            Solo personal autorizado del área de Training · Bradken Chilca
          </p>
        </div>
      </div>}



      {/* ── ADMIN: CONTROL DE VERSIONES ── */}

      {/* ── ADMIN: FORMS ── */}
      {view==='admin:forms'&&<div>
        <button style={s.back} onClick={()=>setView('admin:list')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Historial
        </button>
        <h2 style={s.h1}>Formularios</h2>
        <p style={{color:T2,fontSize:13,margin:'4px 0 20px'}}>Vista previa de todos los formatos en blanco. Haz clic en cualquiera para previsualizarlo.</p>
        {[
          {label:'Permisos de Trabajo de Alto Riesgo', types:TYPES.filter(t=>t.mode==='permiso')},
          {label:'Licencias de Equipo y Vehículo', types:TYPES.filter(t=>t.mode==='licencia'&&!t.id.startsWith('bm'))},
          {label:'Licencias para Fundir – Horno de Inducción (BM)', types:TYPES.filter(t=>t.id.startsWith('bm'))},
        ].map(cat=><div key={cat.label} style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>{cat.label}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {cat.types.flatMap(t=>{
              // For permisos show both roles; for licencias show one (operador)
              const roles=t.mode==='licencia'?['operador']:['emisor','ejecutor'];
              return roles.map(role=><button key={t.id+'-'+role} onClick={()=>{
                // Build blank eval for preview
                let blankDomains;
                if(t.mode==='licencia'){
                  const secs=COMP_LIC[t.id]?.operador||[];
                  blankDomains=secs.map(sec=>({
                    k:sec.k, label:sec.label, sub:sec.sub||'',
                    items:sec.items.map(text=>({text,result:null}))
                  }));
                } else {
                  blankDomains=DOM.map((d,i)=>({
                    ...d,
                    items:(COMP[t.id]?.[role]?.[i]||[]).map(text=>({text,result:null}))
                  }));
                }
                const roleLbl=t.mode!=='licencia'?(role==='emisor'?'EMISOR / AUTORIZADOR':'EJECUTOR'):'';
                const blankEv={
                  id:'PREVIEW', type:t.id, role, mode:t.mode,
                  status:'preview', docCode:t.code, color:t.color,
                  participant:{nombres:'',apellidos:'',cargo:'',fechaCurso:'',
                    prereqCheck:null,logbook:null,colada:'',turno:'',equipo:'',
                    area:'',supNombre:'',supFecha:'',telefono:''},
                  evaluator:{nombre:'',fecha:''},
                  domains:blankDomains,
                  overallResult:null, comments:'', approval:null,
                  aiRec:'', evaluatorSignedAt:null,
                  createdAt:new Date().toISOString()
                };
                setEv(blankEv);
                openPrint('admin:forms');
              }}
              style={{...s.card,cursor:'pointer',display:'flex',alignItems:'center',gap:12,
                padding:'12px 14px',textAlign:'left',border:`1px solid ${BD}`,transition:'all .15s'}}
              onMouseOver={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor=BD;e.currentTarget.style.boxShadow=SH;}}>
              <div style={{width:38,height:38,background:t.color+'18',borderRadius:8,display:'flex',
                alignItems:'center',justifyContent:'center',color:t.color,fontWeight:700,
                fontSize:t.icon.length>1?11:17,fontFamily:"'DM Mono',monospace",
                border:`1px solid ${t.color}25`,flexShrink:0}}>{t.icon}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:TX,lineHeight:1.3}}>{t.label}</div>
                {t.mode!=='licencia'&&<div style={{fontSize:10,fontWeight:600,color:t.color,marginTop:2}}>{role==='emisor'?'Emisor / Autorizador':'Ejecutor'}</div>}
                <div style={{fontSize:10,color:T3,marginTop:1,fontFamily:"'DM Mono',monospace"}}>{t.code}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" style={{marginLeft:'auto',flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
            </button>);})}
          </div>
        </div>)}
      </div>}

      {view==='admin:docmeta'&&(()=>{
        const cats=[
          {label:'Permisos de Trabajo de Alto Riesgo', types:TYPES.filter(t=>t.mode==='permiso')},
          {label:'Licencias de Equipo y Vehículo', types:TYPES.filter(t=>t.mode==='licencia'&&!t.id.startsWith('bm'))},
          {label:'Licencias para Fundir – Horno de Inducción (BM)', types:TYPES.filter(t=>t.id.startsWith('bm'))},
        ];
        const getMeta=(typeId)=>({...DOC_META_DEFAULTS[typeId],...(docMeta[typeId]||{})});
        return <div>
          <button style={s.back} onClick={()=>{setDocMetaType(null);setView('admin:list');}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Historial
          </button>
          <h2 style={s.h1}>Control de Versiones de Documentos</h2>
          <p style={{color:T2,fontSize:13,margin:'4px 0 20px'}}>Selecciona un formulario para actualizar sus metadatos ISO (BKN Doc, fechas, revisores). Los cambios aplican a todos los PDFs generados desde ese momento.</p>

          {!docMetaType
            ? cats.map(cat=><div key={cat.label} style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{cat.label}</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {cat.types.map(t=>{
                    const m=getMeta(t.id);
                    const isModified=!!docMeta[t.id];
                    return <button key={t.id} onClick={()=>{
                        setDocMetaType(t.id);
                        setDocMetaForm({...m});
                        setDocMetaMsg('');
                      }}
                      style={{...s.card,cursor:'pointer',display:'flex',alignItems:'center',gap:12,padding:'12px 16px',textAlign:'left',border:`1px solid ${isModified?'#C3D5F0':BD}`,background:isModified?BRANDL:SF}}>
                      <div style={{width:36,height:36,background:t.color+'18',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',
                        color:t.color,fontWeight:700,fontSize:t.icon.length>1?11:16,fontFamily:"'DM Mono',monospace",flexShrink:0,border:`1px solid ${t.color}25`}}>{t.icon}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:TX}}>{t.label}</div>
                        <div style={{fontSize:11,color:T2,marginTop:1}}>
                          Rev. {m.rev} · {m.fecha} · {m.revisadoPor} / {m.aprobadoPor}
                          {isModified&&<span style={{color:BRAND,marginLeft:8,fontWeight:600}}>• Modificado</span>}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>;
                  })}
                </div>
              </div>)
            : (()=>{
                const t=TYPES.find(x=>x.id===docMetaType);
                return <div>
                  <button style={s.back} onClick={()=>{setDocMetaType(null);setDocMetaMsg('');}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    Lista de formularios
                  </button>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                    <div style={{width:40,height:40,background:t.color+'18',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                      color:t.color,fontWeight:700,fontSize:t.icon.length>1?11:16,fontFamily:"'DM Mono',monospace",border:`1px solid ${t.color}25`}}>{t.icon}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:600,color:TX}}>{t.label}</div>
                      <div style={{fontSize:12,color:T2}}>{t.code}</div>
                    </div>
                  </div>

                  <div style={{...s.card,display:'flex',flexDirection:'column',gap:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:BRAND,textTransform:'uppercase',letterSpacing:'0.05em',paddingBottom:8,borderBottom:`1px solid ${BD}`}}>
                      Encabezado del documento (BKN Doc & Revisión)
                    </div>
                    {[
                      ['bknDoc','BKN Doc & Revisión (código del documento)','TRG-F-008'],
                      ['fecha','Fecha de revisión','30-Jun-26'],
                      ['revisadoPor','Revisado por','avera'],
                      ['aprobadoPor','Aprobado por','hramamurthi'],
                    ].map(([f,lbl,ph])=><div key={f}>
                      <label style={s.label}>{lbl}</label>
                      <input style={s.input} value={docMetaForm[f]||''} placeholder={ph}
                        onChange={e=>setDocMetaForm(prev=>({...prev,[f]:e.target.value}))}/>
                    </div>)}

                    <div style={{fontSize:12,fontWeight:700,color:BRAND,textTransform:'uppercase',letterSpacing:'0.05em',paddingBottom:8,borderBottom:`1px solid ${BD}`,marginTop:4}}>
                      Tabla 1 – Resumen de la revisión
                    </div>
                    {[
                      ['rev','Rev. (número de revisión)','1'],
                      ['fechaEmision','Fecha de emisión','30-Jun-26'],
                      ['clausula','Cláusula/Sección revisada y Lista de cambios','Emisión inicial – formato Bradken Chilca.'],
                    ].map(([f,lbl,ph])=><div key={f}>
                      <label style={s.label}>{lbl}</label>
                      <input style={s.input} value={docMetaForm[f]||''} placeholder={ph}
                        onChange={e=>setDocMetaForm(prev=>({...prev,[f]:e.target.value}))}/>
                    </div>)}

                    {docMetaMsg&&<p style={{fontSize:12,color:docMetaMsg.startsWith('✓')?G:R,margin:0}}>{docMetaMsg}</p>}

                    <div style={{display:'flex',gap:10}}>
                      <button style={{...s.btnPrimary}} disabled={docMetaSaving}
                        onClick={()=>saveDocMeta(docMetaType,docMetaForm)}>
                        {docMetaSaving?'Guardando...':'Guardar cambios'}
                      </button>
                      <button style={s.btn} onClick={()=>{
                        setDocMetaForm({...DOC_META_DEFAULTS[docMetaType]});
                        setDocMetaMsg('');
                      }}>Restaurar valores por defecto</button>
                    </div>
                  </div>
                </div>;
              })()
          }
        </div>;
      })()}


      {/* ── ADMIN: EDIT ── */}
      {view==='admin:edit'&&editingEv&&<div>
        <button style={s.back} onClick={()=>setView('admin:list')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Historial
        </button>
        <h2 style={s.h1}>Editar Datos del Participante</h2>
        <div style={{...s.card,marginBottom:12,padding:'12px 16px',background:'#FFFBEB',borderColor:'#FCD34D'}}>
          <div style={{fontSize:12,color:'#92400e'}}>
            <b>Nota:</b> Solo se pueden editar los datos del participante. Los resultados C/NCA y la firma del evaluador no se modifican para preservar la integridad del registro.
          </div>
        </div>
        <div style={{...s.card,display:'flex',flexDirection:'column',gap:14}}>
          {[
            ['nombres','Nombres'],['apellidos','Apellidos'],['cargo','Cargo / Puesto'],
            ['fechaCurso','Fecha del curso'],['equipo','Marca / Modelo del equipo'],
            ['colada','Número de Colada / N° Operación'],['turno','Turno'],
            ['supNombre','Nombre del Supervisor'],['supFecha','Fecha del Supervisor'],
            ['telefono','Número de celular (WhatsApp)'],
          ].map(([field,label])=><div key={field}>
            <label style={s.label}>{label}</label>
            <input style={s.input} value={editForm[field]||''}
              onChange={e=>{const v=e.target.value;setEditForm(prev=>({...prev,[field]:v}));}}/>
          </div>)}
          {editMsg&&<p style={{fontSize:12,color:editMsg.startsWith('✓')?G:R,margin:0}}>{editMsg}</p>}
          <div style={{display:'flex',gap:10}}>
            <button style={{...s.btnPrimary}} disabled={editSaving}
              onClick={async()=>{
                setEditSaving(true);
                await saveEdit(editingEv.id,editForm);
                setEditSaving(false);
              }}>
              {editSaving?'Guardando...':'Guardar cambios'}
            </button>
            <button style={s.btn} onClick={()=>setView('admin:list')}>Cancelar</button>
          </div>
        </div>
      </div>}

      {/* ── CONFIRM DELETE MODAL ── */}
      {confirmDelete&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
        <div style={{background:'#fff',borderRadius:14,padding:'24px',maxWidth:380,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          <div style={{fontSize:32,marginBottom:8,textAlign:'center'}}>⚠️</div>
          <h3 style={{...s.h1,textAlign:'center',marginBottom:8}}>Eliminar evaluación</h3>
          <p style={{fontSize:13,color:T2,textAlign:'center',marginBottom:20}}>
            Se eliminará permanentemente el registro <b>{confirmDelete}</b> de Supabase. Esta acción no se puede deshacer.
          </p>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button style={{...s.btnPrimary,background:'#DC2626'}}
              onClick={()=>deleteEval(confirmDelete)}>
              Sí, eliminar
            </button>
            <button style={s.btn} onClick={()=>setConfirmDelete(null)}>Cancelar</button>
          </div>
        </div>
      </div>}

      {/* ── ADMIN: PLAN ── */}
      {view==='admin:plan'&&managingEv&&<PlanManager
        ev={managingEv}
        form={planForm}
        setForm={setPlanForm}
        saving={planSaving}
        msg={planMsg}
        onSave={async()=>{
          const d={...planForm,updatedAt:new Date().toISOString(),evaluadorNombre:managingEv.evaluator?.nombre};
          await savePlan(managingEv.id,d);
          setManagingEv(function(p){return {...p,plan:d};});
        }}
        onBack={function(){setView('admin:list');}}
      />}
      {/* ── ADMIN: LIST ── */}
      {view==='admin:list'&&<div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <button style={s.back} onClick={reset}>← Inicio</button>
            <h2 style={{...s.h1,margin:0}}>Historial de Evaluaciones</h2>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setView('admin:forms')}
              style={{...s.btnSm,display:'flex',alignItems:'center',gap:4}}>
              📄 Formularios
            </button>
            <button onClick={()=>{setDocMetaType(null);setDocMetaMsg('');setView('admin:docmeta');}}
              style={{...s.btnSm,display:'flex',alignItems:'center',gap:4}}>
              📋 Control de Versiones
            </button>
            <button onClick={()=>{setChangingPin(c=>!c);setPinChangeMsg('');setNewPin('');setNewPinConfirm('');}}
              style={{...s.btnSm,display:'flex',alignItems:'center',gap:4}}>
              🔑 {changingPin?'Cancelar':'Cambiar PIN'}
            </button>
            <button onClick={refreshAdmin} disabled={adminLoading}
              style={{...s.btn,display:'flex',alignItems:'center',gap:6,fontSize:13}}>
              {adminLoading?'↻ Actualizando...':'↻ Actualizar'}
            </button>
          </div>
        </div>

        {changingPin&&<div style={{...s.card,marginBottom:16,padding:'16px 20px',borderColor:ABD,background:ABKG}}>
          <p style={{fontSize:13,fontWeight:600,marginBottom:12,color:AM,display:'flex',alignItems:'center',gap:6}}><svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='2'/><circle cx='19' cy='12' r='1'/><circle cx='5' cy='12' r='1'/><path d='M17 12a5 5 0 0 1-5 5 5 5 0 0 1-5-5'/></svg> Cambiar PIN de acceso</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={s.label}>Nuevo PIN (solo números, mín. 4 dígitos)</label>
              <input type="password" inputMode="numeric" value={newPin}
                onChange={e=>setNewPin(e.target.value.replace(/\D/g,''))} maxLength={8}
                placeholder="Nuevo PIN" style={s.input}/>
            </div>
            <div>
              <label style={s.label}>Confirmar nuevo PIN</label>
              <input type="password" inputMode="numeric" value={newPinConfirm}
                onChange={e=>setNewPinConfirm(e.target.value.replace(/\D/g,''))} maxLength={8}
                placeholder="Repetir PIN" style={s.input}/>
            </div>
          </div>
          {pinChangeMsg&&<p style={{fontSize:12,color:pinChangeMsg.startsWith('✓')?G:R,margin:'0 0 8px'}}>{pinChangeMsg}</p>}
          <button onClick={handleChangePin} style={{...s.btnPrimary,fontSize:13,padding:'7px 16px'}}>
            Guardar nuevo PIN
          </button>
        </div>}

        {/* KPI Cards */}
        {!adminLoading&&adminEvals.length>0&&(()=>{
          const total=adminEvals.length;
          const approved=adminEvals.filter(e=>e.status==='approved').length;
          const pending=adminEvals.filter(e=>e.status==='pending_approval').length;
          const comp=adminEvals.filter(e=>e.overallResult==='C').length;
          return <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {[{label:'Total evaluaciones',val:total,c:'var(--text-primary)'},
              {label:'Firmadas por evaluado',val:approved,c:'#166534'},
              {label:'Pendientes de aprobación',val:pending,c:'#92400e'},
              {label:'Resultado Competente',val:`${Math.round(comp/total*100)}%`,c:BK}
            ].map(k=><div key={k.label} style={{background:'var(--surface-1)',borderRadius:8,padding:'12px 14px',border:'0.5px solid var(--border)'}}>
              <div style={{fontSize:11,color:'var(--text-secondary)',marginBottom:4}}>{k.label}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:700,color:k.c}}>{k.val}</div>
            </div>)}
          </div>;
        })()}

        {/* Filters */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:8,marginBottom:16}}>
          <input placeholder="Buscar por nombre o código..." value={adminFilter.search}
            onChange={e=>setAdminFilter(f=>({...f,search:e.target.value}))}/>
          <select value={adminFilter.type} onChange={e=>setAdminFilter(f=>({...f,type:e.target.value}))}>
            <option value=''>Todos los tipos</option>
            {TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={adminFilter.role} onChange={e=>setAdminFilter(f=>({...f,role:e.target.value}))}>
            <option value=''>Todos los roles</option>
            <option value='operador'>Operador</option>
            <option value='emisor'>Emisor</option>
            <option value='ejecutor'>Ejecutor</option>
          </select>
          <select value={adminFilter.status} onChange={e=>setAdminFilter(f=>({...f,status:e.target.value}))}>
            <option value=''>Todos los estados</option>
            <option value='pending_approval'>Pendiente aprobación</option>
            <option value='approved'>Firmado</option>
          </select>
        </div>

        {adminLoading&&<div style={{textAlign:'center',padding:'40px',color:'var(--text-secondary)'}}>
          <div style={{fontSize:24,marginBottom:8}}>⟳</div>Cargando evaluaciones...
        </div>}

        {!adminLoading&&adminEvals.length===0&&<div style={{...s.card,textAlign:'center',padding:'40px'}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <p style={{color:'var(--text-secondary)'}}>No hay evaluaciones registradas aún.</p>
        </div>}

        {!adminLoading&&adminEvals.length>0&&(()=>{
          const q=adminFilter.search.toLowerCase();
          const filtered=adminEvals.filter(e=>{
            if(adminFilter.type&&e.type!==adminFilter.type) return false;
            if(adminFilter.role&&e.role!==adminFilter.role) return false;
            if(adminFilter.status&&e.status!==adminFilter.status) return false;
            if(q&&!(e.participant?.nombres?.toLowerCase().includes(q)||
                    e.participant?.apellidos?.toLowerCase().includes(q)||
                    e.id?.toLowerCase().includes(q))) return false;
            return true;
          });
          return <div>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:8}}>
              {filtered.length} de {adminEvals.length} evaluaciones
            </p>
            <div style={{border:'0.5px solid var(--border)',borderRadius:8,overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,minWidth:680}}>
                <thead>
                  <tr style={{background:'var(--surface-1)'}}>
                    {['Código','Participante','Evaluador','Tipo','Rol','Resultado','Estado','Fecha'].map(h=>
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontWeight:600,fontSize:12,color:'var(--text-secondary)',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}
                    <th style={{padding:'8px 10px',borderBottom:'0.5px solid var(--border)'}}/>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e,i)=>{
                    const t=TYPES.find(x=>x.id===e.type);
                    return <tr key={e.id} style={{borderBottom:i<filtered.length-1?'0.5px solid var(--border)':'none',background:i%2===0?'transparent':'var(--surface-0)'}}>
                      <td style={{padding:'8px 10px',fontFamily:"'DM Mono',monospace",fontWeight:600,fontSize:12,color:DARK}}>{e.id}</td>
                      <td style={{padding:'8px 10px'}}>
                        <div style={{fontWeight:500}}>{e.participant?.nombres} {e.participant?.apellidos}</div>
                        <div style={{fontSize:11,color:'var(--text-secondary)'}}>{e.participant?.cargo}</div>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <div style={{fontSize:12,fontWeight:500,color:TX}}>{e.evaluator?.nombre||'—'}</div>
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
                          <span style={{width:16,height:16,background:t?.color+'20',borderRadius:3,display:'inline-flex',alignItems:'center',justifyContent:'center',color:t?.color,fontWeight:700,fontSize:8,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{t?.icon}</span>
                          <span style={{fontSize:12}}>{t?.label}</span>
                        </span>
                      </td>
                      <td style={{padding:'8px 10px',fontSize:12,textTransform:'uppercase',color:'var(--text-secondary)'}}>{e.role}</td>
                      <td style={{padding:'8px 10px'}}>
                        {e.overallResult&&<span style={{...s.tag,fontSize:11,
                          background:e.overallResult==='C'?GBKG:RBKG,
                          color:e.overallResult==='C'?G:R,
                          border:`1px solid ${e.overallResult==='C'?GBD:RBD}`}}>
                          {e.overallResult==='C'?'Competente':'NCA'}
                        </span>}
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{...s.tag,fontSize:11,
                          background:e.status==='approved'?GBKG:e.status==='pending_approval'?ABKG:S2,
                          color:e.status==='approved'?G:e.status==='pending_approval'?AM:T2}}>
                          {e.status==='approved'?'Firmada':e.status==='pending_approval'?'Pendiente':'Borrador'}
                        </span>
                      </td>
                      <td style={{padding:'8px 10px',fontSize:12,color:'var(--text-secondary)',whiteSpace:'nowrap'}}>
                        {e.createdAt?new Date(e.createdAt).toLocaleDateString('es-PE'):'-'}
                      </td>
                      <td style={{padding:'8px 6px',width:140,whiteSpace:'nowrap'}}>
                        <div style={{display:'flex',gap:3,flexWrap:'nowrap',alignItems:'center'}}>
                          <button title="Descargar PDF" onClick={()=>{setEv(e);openPrint('admin');}}
                            style={{cursor:'pointer',background:'#EEF3FA',color:'#005596',border:'1px solid #C3D5F0',borderRadius:6,padding:'5px 7px',fontSize:11,fontWeight:600}}>
                            🖨
                          </button>
                          <button title="Editar datos del participante" onClick={()=>{
                              setEditingEv(e);setEditForm({...e.participant});setEditMsg('');setView('admin:edit');
                            }}
                            style={{cursor:'pointer',background:'#FFFBEB',color:'#92400e',border:'1px solid #FCD34D',borderRadius:6,padding:'5px 7px',fontSize:11}}>
                            ✏
                          </button>
                          <button title="Eliminar evaluación" onClick={()=>setConfirmDelete(e.id)}
                            style={{cursor:'pointer',background:'#FEF2F2',color:'#991B1B',border:'1px solid #FCA5A5',borderRadius:6,padding:'5px 7px',fontSize:11}}>
                            🗑
                          </button>
                          {e.overallResult==='NCA'&&<button title="Gestionar plan de desarrollo" onClick={()=>{
                              setManagingEv(e);
                              setPlanForm({estado:e.plan?.estado||'pendiente',fechaListo:e.plan?.fechaListo||'',
                                observaciones:e.plan?.observaciones||'',evaluadorTelefono:e.plan?.evaluadorTelefono||'',
                                planText:e.plan?.planText||'',
                                planItems:e.plan?.planItems||{}});
                              setPlanMsg('');setView('admin:plan');
                            }}
                            style={{cursor:'pointer',whiteSpace:'nowrap',fontSize:10,fontWeight:600,borderRadius:6,padding:'5px 7px',
                              background:e.plan?.estado==='re_evaluado'?'#F5F3FF':e.plan?.estado==='listo'?GBKG:e.plan?.estado==='en_progreso'?ABKG:RBKG,
                              color:e.plan?.estado==='re_evaluado'?'#5B21B6':e.plan?.estado==='listo'?G:e.plan?.estado==='en_progreso'?AM:R,
                              border:`1px solid ${e.plan?.estado==='re_evaluado'?'#C4B5FD':e.plan?.estado==='listo'?GBD:e.plan?.estado==='en_progreso'?ABD:RBD}`}}>
                            {e.plan?.estado==='re_evaluado'?'✅':e.plan?.estado==='listo'?'🟢':e.plan?.estado==='en_progreso'?'🟡':'🔴'} Plan
                          </button>}
                        </div>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>;
        })()}
        <p style={{fontSize:11,color:'var(--text-muted)',marginTop:16,textAlign:'center'}}>
          Los registros se almacenan en este sistema y pueden descargarse individualmente como PDF para subir al LMS.
          Para un historial centralizado con exportación masiva, contacta al equipo de Training para escalar a producción con base de datos.
        </p>
      </div>}

      {/* ── APPROVE: ENTER ── */}
      {view==='approve:enter'&&<div>
        <button style={s.back} onClick={reset}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='15 18 9 12 15 6'/></svg>
          Inicio
        </button>
        <div style={{...s.card,maxWidth:400,margin:'24px auto'}}>
          <h2 style={s.h2}>Ingresar código de evaluación</h2>
          <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:20}}>El evaluador te entregó un código de 6 caracteres. Ingrésalo para revisar tu evaluación.</p>
          <label style={s.label}>Código</label>
          <input style={{...s.input,textTransform:'uppercase',letterSpacing:4,fontSize:20,textAlign:'center',fontFamily:"'DM Mono',monospace"}}
            value={codeIn} onChange={e=>setCodeIn(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6}/>
          {err&&<p style={{color:R,fontSize:12,margin:'8px 0 0'}}>{err}</p>}
          <button style={{...s.btnPrimary,width:'100%',marginTop:14}} onClick={handleLookup} disabled={loadEv}>
            {loadEv?'Buscando...':'Buscar evaluación →'}
          </button>
        </div>
      </div>}

      {/* ── APPROVE: VIEW ── */}
      {view==='approve:view'&&ev&&<ApproverView ev={ev} onApprove={handleApprove} onPrint={()=>openPrint('approve:view')} onBack={()=>setView('approve:enter')}/>}

      {/* ── APPROVE: DONE ── */}
      {view==='approve:done'&&ev&&<div style={{textAlign:'center',padding:'32px 0'}}>
        <div style={{fontSize:48,marginBottom:12}}>🎉</div>
        <h2 style={s.h1}>Evaluación firmada</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:24}}>Has firmado y confirmado tu evaluación de competencias.</p>
        <ResultBadge r={ev.overallResult}/>
        <div style={{marginTop:24,display:'flex',gap:10,justifyContent:'center'}}>
          <button style={s.btnPrimary} onClick={()=>openPrint('approve:done')}>🖨 Descargar PDF</button>
          <button style={s.btn} onClick={reset}>Inicio</button>
        </div>
      </div>}
    </div>
  </div>;
}

function ApproverView({ev,onApprove,onPrint,onBack}){
  const [name,setName]=useState(ev.participant.nombres+' '+ev.participant.apellidos);
  const t=TYPES.find(x=>x.id===ev.type);
  if(ev.status==='approved') return <div>
    <button style={s.back} onClick={onBack}>← Volver</button>
    <div style={{...s.card,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:8}}>✅</div>
      <h2 style={s.h1}>Ya aprobaste esta evaluación</h2>
      <p style={{color:'var(--text-secondary)',marginBottom:16}}>Aprobado el {ev.approval?.fecha} por {ev.approval?.by}</p>
      <button style={s.btnPrimary} onClick={onPrint}>🖨 Descargar PDF</button>
    </div>
  </div>;
  return <div>
    <button style={s.back} onClick={onBack}>← Volver</button>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
      <div style={{width:44,height:44,background:t.color,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:20,fontWeight:700}}>{t.icon}</div>
      <div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:700}}>{t.label}</div>
        <div style={{fontSize:13,color:'var(--text-secondary)'}}>{ev.role==='emisor'?'EMISOR / AUTORIZADOR':'EJECUTOR'} · {ev.participant.nombres} {ev.participant.apellidos}</div>
      </div>
      <ResultBadge r={ev.overallResult}/>
    </div>
    {ev.domains.map(d=><div key={d.k} style={{...s.card,marginBottom:10,padding:0,overflow:'hidden'}}>
      <div style={{background:DARK,padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'#fff'}}>{d.label} – {d.sub}</span>
      </div>
      {d.items.map((item,i)=><div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 14px',
        borderBottom:i<d.items.length-1?'0.5px solid var(--border)':'none',background:i%2===0?'transparent':'var(--surface-1)'}}>
        <span style={{fontSize:15,lineHeight:1,paddingTop:2,flexShrink:0}}>{item.result==='C'?'✅':item.result==='NCA'?'❌':'⬜'}</span>
        <span style={{fontSize:13,lineHeight:1.6,color:item.result==='NCA'?R:TX}}>{item.text}</span>
      </div>)}
    </div>)}
    {ev.aiRec&&<div style={{...s.card,marginBottom:12,borderColor:BD,background:'#EBF2FD'}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:BRAND,display:'flex',alignItems:'center',gap:6}}><svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg> Plan de desarrollo de competencias</div>
      <p style={{fontSize:13,lineHeight:1.7,color:'var(--text-secondary)',whiteSpace:'pre-wrap',margin:0}}>{ev.aiRec}</p>
    </div>}
    {ev.evaluator.comments&&<div style={{...s.card,marginBottom:12}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:6}}>Comentarios del evaluador</div>
      <p style={{fontSize:13,color:'var(--text-secondary)',margin:0}}>{ev.comments}</p>
    </div>}
    <div style={{...s.card,background:'var(--surface-1)'}}>
      <h3 style={{...s.h2,fontSize:16,marginBottom:12}}>Confirmar revisión y aprobar</h3>
      <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:14}}>Al aprobar, confirmas que revisaste los resultados de tu evaluación y estás de acuerdo con el proceso realizado.</p>
      <label style={s.label}>Tu nombre completo</label>
      <input style={{...s.input,marginBottom:12}} value={name} onChange={e=>setName(e.target.value)}/>
      <div style={{display:'flex',gap:10}}>
        <button style={{...s.btnPrimary,flex:1}} onClick={()=>onApprove(name)}>✅ Aprobar evaluación</button>
        <button style={s.btn} onClick={onPrint}>🖨 Imprimir</button>
      </div>
    </div>
  </div>;
}
