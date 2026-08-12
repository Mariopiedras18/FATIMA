const express = require('express');
const router = express.Router();
const { getAll } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [allTickets, allExpenses, allIncidents, allTasks] = await Promise.all([
      getAll('ticket_records'),
      getAll('branch_expenses'),
      getAll('incidents'),
      getAll('tasks')
    ]);

    const tickets = allTickets.filter(t => t.fecha === hoy);
    const efectivo = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + Number(t.monto_total || 0), 0)
      + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_efectivo || 0), 0);
    const tarjeta = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + Number(t.monto_total || 0), 0)
      + tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_tarjeta || 0), 0);
    const gastos = allExpenses.filter(e => e.fecha === hoy).reduce((s, e) => s + Number(e.monto || 0), 0);
    const incidencias = allIncidents.filter(i => i.estatus === 'pendiente' || i.estatus === 'en_proceso').length;
    const pendientes = allTasks.filter(t => t.estatus === 'pendiente' || t.estatus === 'en_proceso').length;

    res.json({
      fecha: hoy,
      ventas: {
        total_tickets: tickets.length,
        efectivo_bruto: efectivo,
        tarjeta_bruto: tarjeta,
        total_vendido: tickets.reduce((s, t) => s + Number(t.monto_total || 0), 0),
        gastos,
        efectivo_final: efectivo - gastos,
        total_final: (efectivo - gastos) + tarjeta
      },
      incidencias_abiertas: incidencias,
      pendientes_abiertos: pendientes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
});

module.exports = router;