const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
   const hoy = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  await db.read();

  const tickets = (db.data.ticket_records || []).filter(t => t.fecha === hoy);
  const efectivo = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_efectivo || 0), 0);
  const tarjeta = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + Number(t.monto_total || 0), 0) + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_tarjeta || 0), 0);
  const gastos = (db.data.branch_expenses || []).filter(e => e.fecha === hoy).reduce((s, e) => s + Number(e.monto || 0), 0);
  const incidencias = (db.data.incidents || []).filter(i => i.estatus === 'pendiente' || i.estatus === 'en_proceso').length;
  const pendientes = (db.data.tasks || []).filter(t => t.estatus === 'pendiente' || t.estatus === 'en_proceso').length;

  res.json({
    fecha: hoy,
    ventas: { total_tickets: tickets.length, efectivo_bruto: efectivo, tarjeta_bruto: tarjeta, total_vendido: tickets.reduce((s, t) => s + Number(t.monto_total || 0), 0), gastos, efectivo_final: efectivo - gastos, total_final: (efectivo - gastos) + tarjeta },
    incidencias_abiertas: incidencias,
    pendientes_abiertos: pendientes
  });
});

module.exports = router;