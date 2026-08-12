const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, updateDoc } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { fecha, turno, estatus, prioridad } = req.query;
    let list = await getAll('incidents');

    if (req.user.rol !== 'admin') list = list.filter(i => !i.es_privado);
    if (fecha) list = list.filter(i => i.fecha === fecha);
    if (turno) list = list.filter(i => i.turno === turno);
    if (estatus) list = list.filter(i => i.estatus === estatus);
    if (prioridad) list = list.filter(i => i.prioridad === prioridad);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(i => ({ ...i, reportado_por_nombre: userMap[i.reportado_por] || null, responsable_nombre: userMap[i.responsable_id] || null })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener incidencias' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await getById('incidents', id);
    if (!item) return res.status(404).json({ error: 'Incidencia no encontrada' });
    if (item.es_privado && req.user.rol !== 'admin') return res.status(403).json({ error: 'Acceso no autorizado' });

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json({ ...item, reportado_por_nombre: userMap[item.reportado_por] || null, responsable_nombre: userMap[item.responsable_id] || null });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener incidencia' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, turno, tipo, descripcion, prioridad, responsable_id, fecha_compromiso, evidencia_url, es_privado } = req.body;
    if (!fecha || !tipo || !descripcion) return res.status(400).json({ error: 'Fecha, tipo y descripción requeridos' });

    const id = await nextId('incidents');
    const newIncident = {
      id, branch_id: 1, fecha,
      turno: turno || null,
      reportado_por: req.user.id,
      tipo, descripcion,
      prioridad: prioridad || 'media',
      responsable_id: responsable_id || null,
      fecha_compromiso: fecha_compromiso || null,
      estatus: 'pendiente',
      evidencia_url: evidencia_url || null,
      es_privado: Boolean(es_privado),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc('incidents', newIncident);
    res.json({ id, message: 'Incidencia registrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar incidencia' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await getById('incidents', id);
    if (!item) return res.status(404).json({ error: 'No encontrada' });

    const { estatus, prioridad, responsable_id, fecha_compromiso, descripcion } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (estatus) updates.estatus = estatus;
    if (prioridad) updates.prioridad = prioridad;
    if (responsable_id) updates.responsable_id = responsable_id;
    if (fecha_compromiso) updates.fecha_compromiso = fecha_compromiso;
    if (descripcion) updates.descripcion = descripcion;
    await updateDoc('incidents', id, updates);
    res.json({ message: 'Incidencia actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar incidencia' });
  }
});

module.exports = router;