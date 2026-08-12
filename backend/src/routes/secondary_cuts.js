const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

// Helper: Comprobar si un corte primario (fecha + turno) cae dentro del filtro seleccionado
function matchesFilter(cut, filter) {
  const { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin } = filter;

  if (modalidad === 'dia_especifico') {
    if (cut.fecha !== fecha) return false;
    if (turno && turno !== 'completo' && cut.turno !== turno) return false;
    return true;
  }

  if (modalidad === 'rango_fechas') {
    if (cut.fecha < fecha_inicio || cut.fecha > fecha_fin) return false;

    // Filtro de frontera en fecha inicial
    if (cut.fecha === fecha_inicio && turno_inicio === 'tarde' && cut.turno === 'manana') {
      return false;
    }

    // Filtro de frontera en fecha final
    if (cut.fecha === fecha_fin && turno_fin === 'manana' && cut.turno === 'tarde') {
      return false;
    }

    return true;
  }

  return false;
}

// Obtener destinatarios
router.get('/destinatarios', auth, async (req, res) => {
  await db.read();
  const list = (db.data.cut_recipients || []).filter(r => r.activo !== false);
  res.json(list);
});

// Registrar nuevo destinatario
router.post('/destinatarios', auth, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del destinatario es obligatorio' });
  }

  await db.read();
  if (!db.data.cut_recipients) db.data.cut_recipients = [];

  const exists = db.data.cut_recipients.find(r => r.nombre.toLowerCase() === nombre.trim().toLowerCase());
  if (exists) {
    return res.json(exists);
  }

  const id = db.data.cut_recipients.length > 0 ? Math.max(...db.data.cut_recipients.map(r => r.id)) + 1 : 1;
  const newRecipient = { id, nombre: nombre.trim(), activo: true, created_at: new Date().toISOString() };
  db.data.cut_recipients.push(newRecipient);

  // Registrar en Auditoría
  if (!db.data.activity_logs) db.data.activity_logs = [];
  db.data.activity_logs.push({
    id: db.data.activity_logs.length + 1,
    usuario_id: req.user.id,
    usuario_nombre: req.user.nombre || req.user.username || 'Usuario',
    accion: 'CREAR_DESTINATARIO',
    entidad: 'cut_recipients',
    entidad_id: id,
    detalles: `Se registró nuevo destinatario para entrega de fondos: "${nombre.trim()}"`,
    timestamp: new Date().toISOString()
  });

  await db.write();
  res.json(newRecipient);
});

// Vista previa / cálculo de efectivo disponible y saldo restante
router.post('/preview', auth, async (req, res) => {
  const { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin } = req.body;
  await db.read();

  const allCuts = db.data.cash_cuts || [];
  const filter = { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin };

  // 1. Cortes primarios que entran en el filtro
  const targetCuts = allCuts.filter(c => matchesFilter(c, filter));

  // 2. Suma de efectivo bruto - gastos de esos turnos primarios
  const total_efectivo_generado = targetCuts.reduce((sum, c) => sum + Number(c.efectivo_final || c.efectivo_contado || 0), 0);

  // 3. Buscar entregas secundarias previas que se hayan realizado sobre los mismos cortes/fechas
  const allSecCuts = db.data.secondary_cuts || [];
  let total_ya_entregado = 0;

  targetCuts.forEach(primaryCut => {
    // Buscar entregas secundarias que abarquen esta fecha y turno del corte primario
    const previousDeliveries = allSecCuts.filter(sec => {
      return matchesFilter(primaryCut, {
        modalidad: sec.modalidad,
        fecha: sec.fecha_corte,
        turno: sec.turno,
        fecha_inicio: sec.fecha_inicio,
        turno_inicio: sec.turno_inicio || 'manana',
        fecha_fin: sec.fecha_fin,
        turno_fin: sec.turno_fin || 'completo'
      });
    });

    // Sumar proporcionalmente el dinero ya entregado de estos cortes
    previousDeliveries.forEach(sec => {
      // Para evitar sumar duplicado entre cortes del mismo retiro secundario, calculamos el aporte por turno o total
      total_ya_entregado += Number(sec.monto_entregado || 0);
    });
  });

  // Evitar duplicación si varias deliveries comparten el mismo array
  const uniqueSecCutIds = new Set();
  let total_entregas_previas = 0;

  targetCuts.forEach(primaryCut => {
    allSecCuts.forEach(sec => {
      const isMatch = matchesFilter(primaryCut, {
        modalidad: sec.modalidad,
        fecha: sec.fecha_corte,
        turno: sec.turno,
        fecha_inicio: sec.fecha_inicio,
        turno_inicio: sec.turno_inicio || 'manana',
        fecha_fin: sec.fecha_fin,
        turno_fin: sec.turno_fin || 'completo'
      });
      if (isMatch && !uniqueSecCutIds.has(sec.id)) {
        uniqueSecCutIds.add(sec.id);
        total_entregas_previas += Number(sec.monto_entregado || 0);
      }
    });
  });

  const efectivo_restante_disponible = Math.max(0, total_efectivo_generado - total_entregas_previas);

  res.json({
    total_cortes_primarios: targetCuts.length,
    total_efectivo_generado,
    total_ya_entregado: total_entregas_previas,
    efectivo_restante_disponible,
    monto_sugerido: efectivo_restante_disponible,
    turnos_desglosados: targetCuts.map(c => ({ id: c.id, fecha: c.fecha, turno: c.turno, efectivo: c.efectivo_final }))
  });
});

// Obtener bitácora de auditoría de retiros
router.get('/audit-logs', auth, async (req, res) => {
  await db.read();
  const logs = (db.data.activity_logs || [])
    .filter(l => l.entidad === 'secondary_cuts' || l.entidad === 'cut_recipients')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(logs);
});

// Listar cortes secundarios
router.get('/', auth, async (req, res) => {
  await db.read();
  let list = db.data.secondary_cuts || [];
  const { fecha, destinatario_nombre } = req.query;

  if (fecha) {
    list = list.filter(s => s.fecha_corte === fecha || (s.fecha_inicio <= fecha && s.fecha_fin >= fecha));
  }
  if (destinatario_nombre) {
    list = list.filter(s => s.destinatario_nombre.toLowerCase().includes(destinatario_nombre.toLowerCase()));
  }

  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list);
});

// Obtener un corte secundario por ID
router.get('/:id', auth, async (req, res) => {
  await db.read();
  const cut = (db.data.secondary_cuts || []).find(s => s.id === parseInt(req.params.id));
  if (!cut) return res.status(404).json({ error: 'Corte secundario no encontrado' });
  res.json(cut);
});

// Crear nuevo corte secundario (Entrega de Fondo en Efectivo)
router.post('/', auth, async (req, res) => {
  const {
    destinatario_nombre,
    modalidad,
    fecha,
    turno,
    fecha_inicio,
    turno_inicio,
    fecha_fin,
    turno_fin,
    monto_entregado,
    observaciones
  } = req.body;

  if (!destinatario_nombre || !destinatario_nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del destinatario es requerido' });
  }
  if (monto_entregado === undefined || Number(monto_entregado) <= 0) {
    return res.status(400).json({ error: 'El monto entregado debe ser mayor a $0.00' });
  }

  await db.read();
  if (!db.data.secondary_cuts) db.data.secondary_cuts = [];
  if (!db.data.activity_logs) db.data.activity_logs = [];

  const id = db.data.secondary_cuts.length > 0 ? Math.max(...db.data.secondary_cuts.map(s => s.id)) + 1 : 1;

  const newSecondaryCut = {
    id,
    branch_id: 1,
    destinatario_nombre: destinatario_nombre.trim(),
    modalidad: modalidad || 'dia_especifico',
    fecha_corte: fecha || null,
    turno: turno || 'completo',
    fecha_inicio: fecha_inicio || null,
    turno_inicio: turno_inicio || 'manana',
    fecha_fin: fecha_fin || null,
    turno_fin: turno_fin || 'completo',
    tipo_cuenta: 'efectivo', // Siempre en efectivo por regla de negocio
    monto_entregado: Number(monto_entregado),
    observaciones: observaciones ? observaciones.trim() : '',
    registrado_por: req.user.id,
    registrado_por_nombre: req.user.nombre || req.user.username || 'Usuario',
    created_at: new Date().toISOString()
  };

  db.data.secondary_cuts.push(newSecondaryCut);

  // Registro de auditoría
  const logId = db.data.activity_logs.length > 0 ? Math.max(...db.data.activity_logs.map(l => l.id)) + 1 : 1;
  const periodoTexto = modalidad === 'rango_fechas' 
    ? `Del ${fecha_inicio} (${turno_inicio === 'tarde' ? 'Turno Tarde' : 'Mañana'}) al ${fecha_fin} (${turno_fin === 'manana' ? 'Turno Mañana' : 'Día Completo'})`
    : `Día ${fecha} (Turno: ${turno === 'completo' ? 'Día Completo' : turno})`;

  db.data.activity_logs.push({
    id: logId,
    usuario_id: req.user.id,
    usuario_nombre: req.user.nombre || req.user.username || 'Usuario',
    accion: 'CREAR_CORTE_SECUNDARIO',
    entidad: 'secondary_cuts',
    entidad_id: id,
    detalles: `Entrega de Efectivo #${id} por $${Number(monto_entregado).toFixed(2)} a ${destinatario_nombre.trim()}. Periodo: ${periodoTexto}`,
    timestamp: new Date().toISOString()
  });

  await db.write();
  res.json({ id, message: 'Entrega de efectivo registrada con éxito', secondaryCut: newSecondaryCut });
});

module.exports = router;
