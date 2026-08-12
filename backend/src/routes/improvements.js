const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

const userName = (id) => (db.data.users.find(u => u.id === id) || {}).nombre;

router.get('/', auth, async (req, res) => {
  const { categoria, estatus, prioridad } = req.query;
  await db.read();
  let list = db.data.improvements || [];
  if (categoria) list = list.filter(i => i.categoria === categoria);
  if (estatus) list = list.filter(i => i.estatus === estatus);
  if (prioridad) list = list.filter(i => i.prioridad === prioridad);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(i => ({ ...i, propuesto_por_nombre: userName(i.propuesto_por), responsable_nombre: userName(i.responsable_id) })));
});

router.post('/', auth, async (req, res) => {
  const { fecha, categoria, descripcion, beneficio, prioridad, responsable_id } = req.body;
  if (!fecha || !categoria || !descripcion) return res.status(400).json({ error: 'Fecha, categoría y descripción requeridos' });

  await db.read();
  const id = db.data.improvements.length > 0 ? Math.max(...db.data.improvements.map(i => i.id)) + 1 : 1;
  db.data.improvements.push({ id, branch_id: 1, fecha, propuesto_por: req.user.id, categoria, descripcion, beneficio: beneficio || null, prioridad: prioridad || 'media', responsable_id: responsable_id || null, estatus: 'propuesta', observaciones: null, created_at: new Date().toISOString() });
  await db.write();
  res.json({ id, message: 'Mejora registrada' });
});

router.put('/:id', auth, async (req, res) => {
  const { estatus, prioridad, responsable_id, observaciones } = req.body;
  await db.read();
  const item = db.data.improvements.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'No encontrada' });
  if (estatus) item.estatus = estatus;
  if (prioridad) item.prioridad = prioridad;
  if (responsable_id) item.responsable_id = responsable_id;
  if (observaciones) item.observaciones = observaciones;
  await db.write();
  res.json({ message: 'Mejora actualizada' });
});

module.exports = router;