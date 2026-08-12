const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

const userName = (id) => (db.data.users.find(u => u.id === id) || {}).nombre;

router.get('/', auth, async (req, res) => {
  const { fecha, turno, estatus, prioridad } = req.query;
  await db.read();
  let list = db.data.incidents || [];
  if (req.user.rol !== 'admin') {
    list = list.filter(i => !i.es_privado);
  }
  if (fecha) list = list.filter(i => i.fecha === fecha);
  if (turno) list = list.filter(i => i.turno === turno);
  if (estatus) list = list.filter(i => i.estatus === estatus);
  if (prioridad) list = list.filter(i => i.prioridad === prioridad);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(i => ({ ...i, reportado_por_nombre: userName(i.reportado_por), responsable_nombre: userName(i.responsable_id) })));
});

router.get('/:id', auth, async (req, res) => {
  await db.read();
  const item = db.data.incidents.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Incidencia no encontrada' });
  if (item.es_privado && req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  res.json({ ...item, reportado_por_nombre: userName(item.reportado_por), responsable_nombre: userName(item.responsable_id) });
});

router.post('/', auth, async (req, res) => {
  const { fecha, turno, tipo, descripcion, prioridad, responsable_id, fecha_compromiso, evidencia_url, es_privado } = req.body;
  if (!fecha || !tipo || !descripcion) return res.status(400).json({ error: 'Fecha, tipo y descripción requeridos' });

  await db.read();
  const id = db.data.incidents.length > 0 ? Math.max(...db.data.incidents.map(i => i.id)) + 1 : 1;
  db.data.incidents.push({ id, branch_id: 1, fecha, turno: turno || null, reportado_por: req.user.id, tipo, descripcion, prioridad: prioridad || 'media', responsable_id: responsable_id || null, fecha_compromiso: fecha_compromiso || null, estatus: 'pendiente', evidencia_url: evidencia_url || null, es_privado: Boolean(es_privado), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  await db.write();
  res.json({ id, message: 'Incidencia registrada' });
});

router.put('/:id', auth, async (req, res) => {
  const { estatus, prioridad, responsable_id, fecha_compromiso, descripcion } = req.body;
  await db.read();
  const item = db.data.incidents.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'No encontrada' });
  if (estatus) item.estatus = estatus;
  if (prioridad) item.prioridad = prioridad;
  if (responsable_id) item.responsable_id = responsable_id;
  if (fecha_compromiso) item.fecha_compromiso = fecha_compromiso;
  if (descripcion) item.descripcion = descripcion;
  item.updated_at = new Date().toISOString();
  await db.write();
  res.json({ message: 'Incidencia actualizada' });
});

module.exports = router;