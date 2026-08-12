const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { fecha, turno } = req.query;
  await db.read();
  let list = db.data.cash_cuts || [];
  if (fecha) list = list.filter(c => c.fecha === fecha);
  if (turno) list = list.filter(c => c.turno === turno);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(c => ({ ...c, responsable_nombre: (db.data.users.find(u => u.id === c.responsable_id) || {}).nombre })));
});

router.get('/:id', auth, async (req, res) => {
  await db.read();
  const cut = db.data.cash_cuts.find(c => c.id === parseInt(req.params.id));
  if (!cut) return res.status(404).json({ error: 'Corte no encontrado' });
  const tickets = db.data.ticket_records.filter(t => t.corte_id === cut.id).map(t => ({ ...t, registrado_por_nombre: (db.data.users.find(u => u.id === t.registrado_por) || {}).nombre }));
  const expenses = db.data.branch_expenses.filter(e => e.cash_cut_id === cut.id).map(e => ({ ...e, registrado_por_nombre: (db.data.users.find(u => u.id === e.registrado_por) || {}).nombre }));
  res.json({ ...cut, responsable_nombre: (db.data.users.find(u => u.id === cut.responsable_id) || {}).nombre, tickets, expenses });
});

router.post('/preview', auth, async (req, res) => {
  const { fecha, turno } = req.body;
  await db.read();
  const hora_cierre = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // Tickets no asociados a un corte del turno/fecha
  const tickets = (db.data.ticket_records || []).filter(t => t.fecha === fecha && t.turno === turno && !t.corte_id);
  
  // Gastos no asignados a un corte previo creados hasta este momento exacto
  const expenses = (db.data.branch_expenses || []).filter(e => {
    if (e.cash_cut_id) return false;
    if (e.fecha > fecha) return false;
    return true;
  });

  const efectivo = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_efectivo || 0), 0);
  const tarjeta = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_tarjeta || 0), 0);
  const consumo_propio = tickets.filter(t => t.forma_pago === 'consumo_propio').reduce((s, t) => s + Number(t.monto_total || 0), 0);
  
  const total_gastos = expenses.reduce((s, e) => s + Number(e.monto || 0), 0);
  const efectivo_final = efectivo - total_gastos;

  res.json({
    fecha,
    turno,
    hora_cierre,
    total_tickets: tickets.length,
    efectivo_bruto: efectivo,
    tarjeta_bruto: tarjeta,
    total_consumo_propio: consumo_propio,
    total_vendido: efectivo + tarjeta + consumo_propio,
    total_gastos,
    efectivo_final,
    total_final: efectivo_final + tarjeta,
    gastos_incluidos: expenses
  });
});

router.post('/', auth, async (req, res) => {
  const { fecha, turno, efectivo_contado, tarjeta_terminal, observaciones } = req.body;
  if (!fecha || !turno || efectivo_contado === undefined || tarjeta_terminal === undefined) {
    return res.status(400).json({ error: 'Fecha, turno, efectivo contado y tarjeta terminal requeridos' });
  }

  await db.read();
  const nowISO = new Date().toISOString();
  const hora_cierre = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const tickets = (db.data.ticket_records || []).filter(t => t.fecha === fecha && t.turno === turno && !t.corte_id);
  
  const expenses = (db.data.branch_expenses || []).filter(e => {
    if (e.cash_cut_id) return false;
    if (e.fecha > fecha) return false;
    return true;
  });

  const efectivo_bruto = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_efectivo || 0), 0);
  const tarjeta_bruto = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_tarjeta || 0), 0);
  const consumo_propio = tickets.filter(t => t.forma_pago === 'consumo_propio').reduce((s, t) => s + Number(t.monto_total || 0), 0);
  
  const total_gastos = expenses.reduce((s, e) => s + Number(e.monto || 0), 0);
  const efectivo_final = efectivo_bruto - total_gastos;
  const total_final = efectivo_final + tarjeta_bruto;
  const dif_efectivo = Number(efectivo_contado) - efectivo_final;
  const dif_tarjeta = Number(tarjeta_terminal) - tarjeta_bruto;
  const estatus = (Math.abs(dif_efectivo) < 0.5 && Math.abs(dif_tarjeta) < 0.5) ? 'cerrado' : 'con_diferencia';

  const id = db.data.cash_cuts.length > 0 ? Math.max(...db.data.cash_cuts.map(c => c.id)) + 1 : 1;
  
  const cutRecord = {
    id,
    branch_id: 1,
    fecha,
    turno,
    hora_cierre,
    responsable_id: req.user.id,
    total_efectivo_bruto: efectivo_bruto,
    total_tarjeta: tarjeta_bruto,
    total_consumo_propio: consumo_propio,
    total_vendido: efectivo_bruto + tarjeta_bruto + consumo_propio,
    total_gastos,
    efectivo_final,
    total_final,
    efectivo_contado: Number(efectivo_contado),
    tarjeta_terminal: Number(tarjeta_terminal),
    diferencia_efectivo: dif_efectivo,
    diferencia_tarjeta: dif_tarjeta,
    estatus,
    observaciones: observaciones || null,
    closed_at: nowISO,
    created_at: nowISO
  };

  db.data.cash_cuts.push(cutRecord);

  // Vincular tickets y gastos a este corte exacto
  tickets.forEach(t => { t.corte_id = id; });
  expenses.forEach(e => { e.cash_cut_id = id; });

  await db.write();
  res.json({ id, estatus, message: 'Corte realizado', cut: cutRecord });
});

module.exports = router;