const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { fecha, turno } = req.query;
  await db.read();
  let list = db.data.branch_expenses || [];
  if (fecha) list = list.filter(e => e.fecha === fecha);
  if (turno) list = list.filter(e => e.turno === turno);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(e => ({ ...e, registrado_por_nombre: (db.data.users.find(u => u.id === e.registrado_por) || {}).nombre })));
});

router.post('/', auth, async (req, res) => {
  const { fecha, turno, concepto, monto, responsable_gasto, observacion, evidencia_url } = req.body;
  if (!fecha || !turno || !concepto || !monto) return res.status(400).json({ error: 'Fecha, turno, concepto y monto requeridos' });
  if (monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a cero' });

  await db.read();
  const id = db.data.branch_expenses.length > 0 ? Math.max(...db.data.branch_expenses.map(e => e.id)) + 1 : 1;
  db.data.branch_expenses.push({ id, branch_id: 1, fecha, turno, concepto, monto, registrado_por: req.user.id, responsable_gasto: responsable_gasto || null, observacion: observacion || null, evidencia_url: evidencia_url || null, cash_cut_id: null, created_at: new Date().toISOString() });
  await db.write();
  res.json({ id, message: 'Gasto registrado' });
});

router.delete('/:id', auth, async (req, res) => {
  await db.read();
  const idx = db.data.branch_expenses.findIndex(e => e.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Gasto no encontrado' });
  if (db.data.branch_expenses[idx].cash_cut_id) return res.status(400).json({ error: 'No se puede eliminar, ya está en un corte cerrado' });
  db.data.branch_expenses.splice(idx, 1);
  await db.write();
  res.json({ message: 'Gasto eliminado' });
});

module.exports = router;