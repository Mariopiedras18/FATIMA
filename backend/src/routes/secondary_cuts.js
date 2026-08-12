const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, getFirestore } = require('../database/firestore');
const { auth } = require('../middleware/auth');

// Helper: Comprobar si un corte primario cae dentro del filtro
function matchesFilter(cut, filter) {
  const { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin } = filter;
  if (modalidad === 'dia_especifico') {
    if (cut.fecha !== fecha) return false;
    if (turno && turno !== 'completo' && cut.turno !== turno) return false;
    return true;
  }
  if (modalidad === 'rango_fechas') {
    if (cut.fecha < fecha_inicio || cut.fecha > fecha_fin) return false;
    if (cut.fecha === fecha_inicio && turno_inicio === 'tarde' && cut.turno === 'manana') return false;
    if (cut.fecha === fecha_fin && turno_fin === 'manana' && cut.turno === 'tarde') return false;
    return true;
  }
  return false;
}

// Obtener destinatarios
router.get('/destinatarios', auth, async (req, res) => {
  try {
    const list = (await getAll('cut_recipients')).filter(r => r.activo !== false);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener destinatarios' });
  }
});

// Registrar nuevo destinatario
router.post('/destinatarios', auth, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre del destinatario es obligatorio' });

    const all = await getAll('cut_recipients');
    const exists = all.find(r => r.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (exists) return res.json(exists);

    const id = await nextId('cut_recipients');
    const newRecipient = { id, nombre: nombre.trim(), activo: true, created_at: new Date().toISOString() };
    await addDoc('cut_recipients', newRecipient);

    // Auditoría
    const logId = await nextId('activity_logs');
    await addDoc('activity_logs', {
      id: logId, usuario_id: req.user.id,
      usuario_nombre: req.user.nombre || 'Usuario',
      accion: 'CREAR_DESTINATARIO', entidad: 'cut_recipients', entidad_id: id,
      detalles: `Se registró nuevo destinatario: "${nombre.trim()}"`,
      timestamp: new Date().toISOString()
    });

    res.json(newRecipient);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear destinatario' });
  }
});

// Vista previa
router.post('/preview', auth, async (req, res) => {
  try {
    const { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin } = req.body;
    const allCuts = await getAll('cash_cuts');
    const filter = { modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin };
    const targetCuts = allCuts.filter(c => matchesFilter(c, filter));
    const total_efectivo_generado = targetCuts.reduce((sum, c) => sum + Number(c.efectivo_final || c.efectivo_contado || 0), 0);

    const allSecCuts = await getAll('secondary_cuts');
    const uniqueSecCutIds = new Set();
    let total_entregas_previas = 0;
    targetCuts.forEach(primaryCut => {
      allSecCuts.forEach(sec => {
        const isMatch = matchesFilter(primaryCut, {
          modalidad: sec.modalidad, fecha: sec.fecha_corte, turno: sec.turno,
          fecha_inicio: sec.fecha_inicio, turno_inicio: sec.turno_inicio || 'manana',
          fecha_fin: sec.fecha_fin, turno_fin: sec.turno_fin || 'completo'
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular preview secundario' });
  }
});

// Obtener bitácora de auditoría
router.get('/audit-logs', auth, async (req, res) => {
  try {
    const logs = (await getAll('activity_logs'))
      .filter(l => l.entidad === 'secondary_cuts' || l.entidad === 'cut_recipients')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener auditoría' });
  }
});

// Listar cortes secundarios
router.get('/', auth, async (req, res) => {
  try {
    let list = await getAll('secondary_cuts');
    const { fecha, destinatario_nombre } = req.query;
    if (fecha) list = list.filter(s => s.fecha_corte === fecha || (s.fecha_inicio <= fecha && s.fecha_fin >= fecha));
    if (destinatario_nombre) list = list.filter(s => s.destinatario_nombre.toLowerCase().includes(destinatario_nombre.toLowerCase()));
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cortes secundarios' });
  }
});

// Obtener corte secundario por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cut = await getById('secondary_cuts', parseInt(req.params.id));
    if (!cut) return res.status(404).json({ error: 'Corte secundario no encontrado' });
    res.json(cut);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener corte secundario' });
  }
});

// Crear nuevo corte secundario
router.post('/', auth, async (req, res) => {
  try {
    const { destinatario_nombre, modalidad, fecha, turno, fecha_inicio, turno_inicio, fecha_fin, turno_fin, monto_entregado, observaciones } = req.body;
    if (!destinatario_nombre || !destinatario_nombre.trim()) return res.status(400).json({ error: 'El nombre del destinatario es requerido' });
    if (monto_entregado === undefined || Number(monto_entregado) <= 0) return res.status(400).json({ error: 'El monto entregado debe ser mayor a $0.00' });

    const id = await nextId('secondary_cuts');
    const newSecondaryCut = {
      id, branch_id: 1,
      destinatario_nombre: destinatario_nombre.trim(),
      modalidad: modalidad || 'dia_especifico',
      fecha_corte: fecha || null,
      turno: turno || 'completo',
      fecha_inicio: fecha_inicio || null,
      turno_inicio: turno_inicio || 'manana',
      fecha_fin: fecha_fin || null,
      turno_fin: turno_fin || 'completo',
      tipo_cuenta: 'efectivo',
      monto_entregado: Number(monto_entregado),
      observaciones: observaciones ? observaciones.trim() : '',
      registrado_por: req.user.id,
      registrado_por_nombre: req.user.nombre || 'Usuario',
      created_at: new Date().toISOString()
    };
    await addDoc('secondary_cuts', newSecondaryCut);

    // Auditoría
    const periodoTexto = modalidad === 'rango_fechas'
      ? `Del ${fecha_inicio} al ${fecha_fin}`
      : `Día ${fecha} (Turno: ${turno === 'completo' ? 'Día Completo' : turno})`;
    const logId = await nextId('activity_logs');
    await addDoc('activity_logs', {
      id: logId, usuario_id: req.user.id,
      usuario_nombre: req.user.nombre || 'Usuario',
      accion: 'CREAR_CORTE_SECUNDARIO', entidad: 'secondary_cuts', entidad_id: id,
      detalles: `Entrega de Efectivo #${id} por $${Number(monto_entregado).toFixed(2)} a ${destinatario_nombre.trim()}. Periodo: ${periodoTexto}`,
      timestamp: new Date().toISOString()
    });

    res.json({ id, message: 'Entrega de efectivo registrada con éxito', secondaryCut: newSecondaryCut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar entrega de fondo' });
  }
});

module.exports = router;
