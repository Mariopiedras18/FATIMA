const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

const userName = (id) => (db.data.users.find(u => u.id === id) || {}).nombre;

router.get('/', auth, async (req, res) => {
  const { tipo, estatus, prioridad } = req.query;
  await db.read();
  let list = db.data.assets || [];
  if (tipo) list = list.filter(a => a.tipo === tipo);
  if (estatus) list = list.filter(a => a.estatus === estatus);
  if (prioridad) list = list.filter(a => a.prioridad === prioridad);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(a => ({ ...a, responsable_nombre: userName(a.responsable_id) })));
});

router.post('/', auth, async (req, res) => {
  const { nombre, tipo, descripcion, estado_actual, accion_requerida, prioridad, responsable_id, costo_estimado, evidencia_url } = req.body;
  if (!nombre || !tipo || !descripcion || !accion_requerida) return res.status(400).json({ error: 'Nombre, tipo, descripción y acción requerida son requeridos' });

  await db.read();
  const id = db.data.assets.length > 0 ? Math.max(...db.data.assets.map(a => a.id)) + 1 : 1;
  db.data.assets.push({ id, branch_id: 1, nombre, tipo, descripcion, estado_actual: estado_actual || 'regular', accion_requerida, prioridad: prioridad || 'media', responsable_id: responsable_id || null, costo_estimado: costo_estimado || null, evidencia_url: evidencia_url || null, estatus: 'reportado', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  await db.write();
  res.json({ id, message: 'Equipo registrado' });
});

router.put('/:id', auth, async (req, res) => {
  const { estatus, prioridad, responsable_id, costo_estimado } = req.body;
  await db.read();
  const item = db.data.assets.find(a => a.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  if (estatus) item.estatus = estatus;
  if (prioridad) item.prioridad = prioridad;
  if (responsable_id) item.responsable_id = responsable_id;
  if (costo_estimado !== undefined) item.costo_estimado = costo_estimado;
  item.updated_at = new Date().toISOString();
  await db.write();
  res.json({ message: 'Equipo actualizado' });
});

module.exports = router;