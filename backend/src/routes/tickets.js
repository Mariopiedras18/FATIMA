const express = require('express');
const router = express.Router();
const { db } = require('../database/connection');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const { fecha, turno } = req.query;
  await db.read();
  let list = db.data.ticket_records || [];
  if (fecha) list = list.filter(t => t.fecha === fecha);
  if (turno) list = list.filter(t => t.turno === turno);
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(list.map(t => ({ ...t, registrado_por_nombre: (db.data.users.find(u => u.id === t.registrado_por) || {}).nombre })));
});

router.get('/totals', auth, async (req, res) => {
  const { fecha, turno } = req.query;
  await db.read();
  let list = db.data.ticket_records || [];
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
});

router.post('/', auth, async (req, res) => {
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

  await db.read();
  const parsedMontoTotal = Number(monto_total);
  const parsedMontoEfectivo = Number(monto_efectivo || 0);
  const parsedMontoTarjeta = Number(monto_tarjeta || 0);

  let efectivo = 0;
  let tarjeta = 0;
  let consumoPropio = 0;

  if (forma_pago === 'efectivo') efectivo = parsedMontoTotal;
  else if (forma_pago === 'tarjeta') tarjeta = parsedMontoTotal;
  else if (forma_pago === 'combinado') {
    efectivo = parsedMontoEfectivo;
    tarjeta = parsedMontoTarjeta;
  } else if (forma_pago === 'consumo_propio') {
    consumoPropio = parsedMontoTotal;
  }

  const id = db.data.ticket_records.length > 0 ? Math.max(...db.data.ticket_records.map(t => t.id)) + 1 : 1;

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

  db.data.ticket_records.push(newTicket);
  await db.write();
  res.json({ id, message: 'Ticket registrado', ticket: newTicket });
});

router.delete('/:id', auth, async (req, res) => {
  await db.read();
  const idx = db.data.ticket_records.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Ticket no encontrado' });
  if (db.data.ticket_records[idx].corte_id) return res.status(400).json({ error: 'No se puede eliminar, ya está en un corte cerrado' });
  db.data.ticket_records.splice(idx, 1);
  await db.write();
  res.json({ message: 'Ticket eliminado' });
});

module.exports = router;