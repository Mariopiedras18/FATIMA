const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, deleteDoc, getById } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    let list = await getAll('branch_expenses');
    if (fecha) list = list.filter(e => e.fecha === fecha);
    if (turno) list = list.filter(e => e.turno === turno);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(e => ({ ...e, registrado_por_nombre: userMap[e.registrado_por] || null })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, turno, concepto, monto, responsable_gasto, observacion, evidencia_url } = req.body;
    if (!fecha || !turno || !concepto || !monto) return res.status(400).json({ error: 'Fecha, turno, concepto y monto requeridos' });
    if (monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a cero' });

    const id = await nextId('branch_expenses');
    const newExpense = {
      id, branch_id: 1, fecha, turno, concepto,
      monto: Number(monto),
      registrado_por: req.user.id,
      responsable_gasto: responsable_gasto || null,
      observacion: observacion || null,
      evidencia_url: evidencia_url || null,
      cash_cut_id: null,
      created_at: new Date().toISOString()
    };
    await addDoc('branch_expenses', newExpense);
    res.json({ id, message: 'Gasto registrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const expense = await getById('branch_expenses', id);
    if (!expense) return res.status(404).json({ error: 'Gasto no encontrado' });
    if (expense.cash_cut_id) return res.status(400).json({ error: 'No se puede eliminar, ya está en un corte cerrado' });
    await deleteDoc('branch_expenses', id);
    res.json({ message: 'Gasto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

module.exports = router;