const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, updateDoc } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.post('/preview', auth, async (req, res) => {
  try {
    const { fecha, turno } = req.body;
    const hora_cierre = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const allTickets = await getAll('ticket_records');
    const tickets = allTickets.filter(t => t.fecha === fecha && t.turno === turno && (!t.corte_id || t.corte_id === null));

    const allExpenses = await getAll('branch_expenses');
    const expenses = allExpenses.filter(e => (!e.cash_cut_id || e.cash_cut_id === null) && e.fecha <= fecha && e.turno === turno);

    let efectivo = 0;
    let tarjeta = 0;
    let consumo_propio = 0;

    tickets.forEach(t => {
      const monto = Number(t.monto_total || 0);
      const forma = (t.forma_pago || '').toLowerCase();
      if (forma === 'efectivo') efectivo += monto;
      else if (forma === 'tarjeta') tarjeta += monto;
      else if (forma === 'consumo_propio') consumo_propio += monto;
      else if (forma === 'combinado') {
        efectivo += Number(t.monto_efectivo || 0);
        tarjeta += Number(t.monto_tarjeta || 0);
      }
    });

    const total_gastos = expenses.reduce((s, e) => s + Number(e.monto || 0), 0);
    const efectivo_final = efectivo - total_gastos;

    res.json({
      fecha, turno, hora_cierre,
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular preview' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    let list = await getAll('cash_cuts');
    if (fecha) list = list.filter(c => c.fecha === fecha);
    if (turno) list = list.filter(c => c.turno === turno);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(c => ({ ...c, responsable_nombre: userMap[c.responsable_id] || null })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cortes' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const cut = await getById('cash_cuts', id);
    if (!cut) return res.status(404).json({ error: 'Corte no encontrado' });

    const allTickets = await getAll('ticket_records');
    const allExpenses = await getAll('branch_expenses');
    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));

    const tickets = allTickets.filter(t => t.corte_id === id).map(t => ({ ...t, registrado_por_nombre: userMap[t.registrado_por] || null }));
    const expenses = allExpenses.filter(e => e.cash_cut_id === id).map(e => ({ ...e, registrado_por_nombre: userMap[e.registrado_por] || null }));

    res.json({ ...cut, responsable_nombre: userMap[cut.responsable_id] || null, tickets, expenses });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener corte' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, turno, efectivo_contado, tarjeta_terminal, observaciones } = req.body;
    if (!fecha || !turno || efectivo_contado === undefined || tarjeta_terminal === undefined) {
      return res.status(400).json({ error: 'Fecha, turno, efectivo contado y tarjeta terminal requeridos' });
    }

    const nowISO = new Date().toISOString();
    const hora_cierre = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    const allTickets = await getAll('ticket_records');
    const tickets = allTickets.filter(t => t.fecha === fecha && t.turno === turno && (!t.corte_id || t.corte_id === null));

    const allExpenses = await getAll('branch_expenses');
    const expenses = allExpenses.filter(e => (!e.cash_cut_id || e.cash_cut_id === null) && e.fecha <= fecha && e.turno === turno);

    let efectivo_bruto = 0;
    let tarjeta_bruto = 0;
    let consumo_propio = 0;

    tickets.forEach(t => {
      const monto = Number(t.monto_total || 0);
      const forma = (t.forma_pago || '').toLowerCase();
      if (forma === 'efectivo') efectivo_bruto += monto;
      else if (forma === 'tarjeta') tarjeta_bruto += monto;
      else if (forma === 'consumo_propio') consumo_propio += monto;
      else if (forma === 'combinado') {
        efectivo_bruto += Number(t.monto_efectivo || 0);
        tarjeta_bruto += Number(t.monto_tarjeta || 0);
      }
    });

    const total_gastos = expenses.reduce((s, e) => s + Number(e.monto || 0), 0);
    const efectivo_final = efectivo_bruto - total_gastos;
    const total_final = efectivo_final + tarjeta_bruto;
    const dif_efectivo = Number(efectivo_contado) - efectivo_final;
    const dif_tarjeta = Number(tarjeta_terminal) - tarjeta_bruto;
    const estatus = (Math.abs(dif_efectivo) < 0.5 && Math.abs(dif_tarjeta) < 0.5) ? 'cerrado' : 'con_diferencia';

    const id = await nextId('cash_cuts');
    const cutRecord = {
      id, branch_id: 1, fecha, turno, hora_cierre,
      responsable_id: req.user.id,
      total_efectivo_bruto: efectivo_bruto,
      total_tarjeta: tarjeta_bruto,
      total_consumo_propio: consumo_propio,
      total_vendido: efectivo_bruto + tarjeta_bruto + consumo_propio,
      total_gastos, efectivo_final, total_final,
      efectivo_contado: Number(efectivo_contado),
      tarjeta_terminal: Number(tarjeta_terminal),
      diferencia_efectivo: dif_efectivo,
      diferencia_tarjeta: dif_tarjeta,
      estatus,
      observaciones: observaciones || null,
      closed_at: nowISO,
      created_at: nowISO
    };

    await addDoc('cash_cuts', cutRecord);

    // Vincular tickets y gastos al corte
    const { getFirestore } = require('../database/firestore');
    const fsBatch = getFirestore().batch();
    for (const t of tickets) {
      fsBatch.update(getFirestore().collection('ticket_records').doc(String(t.id)), { corte_id: id });
    }
    for (const e of expenses) {
      fsBatch.update(getFirestore().collection('branch_expenses').doc(String(e.id)), { cash_cut_id: id });
    }
    await fsBatch.commit();

    res.json({ id, estatus, message: 'Corte realizado', cut: cutRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear corte' });
  }
});

module.exports = router;