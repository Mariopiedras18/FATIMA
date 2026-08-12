const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

router.get('/ventas', auth, async (req, res) => {
  const { desde, hasta, turno } = req.query;
  await db.read();
  let list = db.data.ticket_records || [];
  if (desde) list = list.filter(t => t.fecha >= desde);
  if (hasta) list = list.filter(t => t.fecha <= hasta);
  if (turno) list = list.filter(t => t.turno === turno);

  const grouped = {};
  list.forEach(t => {
    const key = `${t.fecha}_${t.turno}`;
    if (!grouped[key]) grouped[key] = { fecha: t.fecha, turno: t.turno, tickets: 0, efectivo: 0, tarjeta: 0, combinado: 0, total: 0 };
    grouped[key].tickets++;
    grouped[key].total += t.monto_total;
    if (t.forma_pago === 'efectivo') grouped[key].efectivo += t.monto_total;
    else if (t.forma_pago === 'tarjeta') grouped[key].tarjeta += t.monto_total;
    else { grouped[key].combinado += t.monto_total; grouped[key].efectivo += t.monto_efectivo || 0; grouped[key].tarjeta += t.monto_tarjeta || 0; }
  });
  res.json(Object.values(grouped).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.turno.localeCompare(a.turno)));
});

router.get('/cortes', auth, async (req, res) => {
  const { desde, hasta } = req.query;
  await db.read();
  let list = db.data.cash_cuts || [];
  if (desde) list = list.filter(c => c.fecha >= desde);
  if (hasta) list = list.filter(c => c.fecha <= hasta);
  res.json(list.map(c => ({ ...c, responsable_nombre: (db.data.users.find(u => u.id === c.responsable_id) || {}).nombre })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
});

router.get('/gastos', auth, async (req, res) => {
  const { desde, hasta, turno } = req.query;
  await db.read();
  let list = db.data.branch_expenses || [];
  if (desde) list = list.filter(e => e.fecha >= desde);
  if (hasta) list = list.filter(e => e.fecha <= hasta);
  if (turno) list = list.filter(e => e.turno === turno);
  res.json(list.map(e => ({ ...e, registrado_por_nombre: (db.data.users.find(u => u.id === e.registrado_por) || {}).nombre })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
});

router.get('/incidencias', auth, async (req, res) => {
  const { desde, hasta, estatus } = req.query;
  await db.read();
  let list = db.data.incidents || [];
  if (desde) list = list.filter(i => i.fecha >= desde);
  if (hasta) list = list.filter(i => i.fecha <= hasta);
  if (estatus) list = list.filter(i => i.estatus === estatus);
  res.json(list.map(i => ({ ...i, reportado_por_nombre: (db.data.users.find(u => u.id === i.reportado_por) || {}).nombre, responsable_nombre: (db.data.users.find(u => u.id === i.responsable_id) || {}).nombre })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
});

module.exports = router;