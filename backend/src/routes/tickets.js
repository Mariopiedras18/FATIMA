const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, deleteDoc, getById } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    let list = await getAll('ticket_records');
    if (fecha) list = list.filter(t => t.fecha === fecha);
    if (turno) list = list.filter(t => t.turno === turno);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(t => ({ ...t, registrado_por_nombre: userMap[t.registrado_por] || null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

router.get('/totals', auth, async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    let list = await getAll('ticket_records');
    if (fecha) list = list.filter(t => t.fecha === fecha);
    if (turno) list = list.filter(t => t.turno === turno);

    const total_tickets = list.length;
    const efectivo = list.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + Number(t.monto_total || 0), 0);
    const tarjeta = list.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + Number(t.monto_total || 0), 0);
    const consumo_propio = list.filter(t => t.forma_pago === 'consumo_propio').reduce((s, t) => s + Number(t.monto_total || 0), 0);
    const comb_efectivo = list.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_efectivo || 0), 0);
    const comb_tarjeta = list.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + Number(t.monto_tarjeta || 0), 0);

    res.json({
      total_tickets,
      efectivo_bruto: efectivo + comb_efectivo,
      tarjeta_bruto: tarjeta + comb_tarjeta,
      consumo_propio,
      total_vendido: efectivo + tarjeta + comb_efectivo + comb_tarjeta + consumo_propio
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener totales' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, turno, folio_4, monto_total, forma_pago, monto_efectivo, monto_tarjeta, observaciones } = req.body;
    if (!fecha || !turno || !folio_4 || !monto_total || !forma_pago) {
      return res.status(400).json({ error: 'Fecha, turno, folio, monto y forma de pago son requeridos' });
    }
    if (folio_4.length !== 4 || !/^\d+$/.test(folio_4)) {
      return res.status(400).json({ error: 'Los últimos 4 dígitos deben ser numéricos' });
    }
    if (Number(monto_total) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' });
    }
    if (forma_pago === 'combinado') {
      if (!monto_efectivo || !monto_tarjeta) return res.status(400).json({ error: 'En combinado se requiere monto efectivo y monto tarjeta' });
      if (Math.abs((Number(monto_efectivo) + Number(monto_tarjeta)) - Number(monto_total)) > 0.01) {
        return res.status(400).json({ error: 'La suma de efectivo y tarjeta debe ser igual al monto total' });
      }
    }

    const parsedMontoTotal = Number(monto_total);
    const parsedMontoEfectivo = Number(monto_efectivo || 0);
    const parsedMontoTarjeta = Number(monto_tarjeta || 0);

    let efectivo = 0, tarjeta = 0, consumoPropio = 0;
    if (forma_pago === 'efectivo') efectivo = parsedMontoTotal;
    else if (forma_pago === 'tarjeta') tarjeta = parsedMontoTotal;
    else if (forma_pago === 'combinado') { efectivo = parsedMontoEfectivo; tarjeta = parsedMontoTarjeta; }
    else if (forma_pago === 'consumo_propio') consumoPropio = parsedMontoTotal;

    const id = await nextId('ticket_records');
    const newTicket = {
      id,
      branch_id: 1,
      fecha,
      turno,
      registrado_por: req.user.id,
      folio_4,
      monto_total: parsedMontoTotal,
      forma_pago,
      monto_efectivo: efectivo,
      monto_tarjeta: tarjeta,
      monto_consumo_propio: consumoPropio,
      observaciones: observaciones || null,
      corte_id: null,
      created_at: new Date().toISOString()
    };

    await addDoc('ticket_records', newTicket);
    res.json({ id, message: 'Ticket registrado', ticket: newTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar ticket' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await getById('ticket_records', id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.corte_id) return res.status(400).json({ error: 'No se puede eliminar, ya está en un corte cerrado' });
    await deleteDoc('ticket_records', id);
    res.json({ message: 'Ticket eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar ticket' });
  }
});

module.exports = router;