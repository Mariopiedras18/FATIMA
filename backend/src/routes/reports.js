const express = require('express');
const router = express.Router();
const { getAll } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/ventas', auth, async (req, res) => {
  try {
    const { desde, hasta, turno, folio_desde, folio_hasta } = req.query;
    let list = await getAll('ticket_records');
    if (desde) list = list.filter(t => t.fecha >= desde);
    if (hasta) list = list.filter(t => t.fecha <= hasta);
    if (turno) list = list.filter(t => t.turno === turno);
    if (folio_desde) list = list.filter(t => t.folio_4 && Number(t.folio_4) >= Number(folio_desde));
    if (folio_hasta) list = list.filter(t => t.folio_4 && Number(t.folio_4) <= Number(folio_hasta));

    const grouped = {};
    list.forEach(t => {
      const key = `${t.fecha}_${t.turno}`;
      if (!grouped[key]) grouped[key] = { fecha: t.fecha, turno: t.turno, tickets: 0, efectivo: 0, tarjeta: 0, combinado: 0, total: 0, folios: [] };
      grouped[key].tickets++;
      grouped[key].total += Number(t.monto_total || 0);
      if (t.folio_4) grouped[key].folios.push(t.folio_4);
      if (t.forma_pago === 'efectivo') grouped[key].efectivo += Number(t.monto_total || 0);
      else if (t.forma_pago === 'tarjeta') grouped[key].tarjeta += Number(t.monto_total || 0);
      else if (t.forma_pago === 'combinado') { grouped[key].combinado += Number(t.monto_total || 0); grouped[key].efectivo += Number(t.monto_efectivo || 0); grouped[key].tarjeta += Number(t.monto_tarjeta || 0); }
    });

    const result = Object.values(grouped).map(g => ({
      ...g,
      folio_min: g.folios.length ? Math.min(...g.folios.map(Number)) : '-',
      folio_max: g.folios.length ? Math.max(...g.folios.map(Number)) : '-'
    })).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.turno.localeCompare(a.turno));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
});

router.get('/cortes', auth, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let list = await getAll('cash_cuts');
    if (desde) list = list.filter(c => c.fecha >= desde);
    if (hasta) list = list.filter(c => c.fecha <= hasta);

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(c => ({ ...c, responsable_nombre: userMap[c.responsable_id] || null })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reporte de cortes' });
  }
});

router.get('/gastos', auth, async (req, res) => {
  try {
    const { desde, hasta, turno } = req.query;
    let list = await getAll('branch_expenses');
    if (desde) list = list.filter(e => e.fecha >= desde);
    if (hasta) list = list.filter(e => e.fecha <= hasta);
    if (turno) list = list.filter(e => e.turno === turno);

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(e => ({ ...e, registrado_por_nombre: userMap[e.registrado_por] || null })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reporte de gastos' });
  }
});

router.get('/incidencias', auth, async (req, res) => {
  try {
    const { desde, hasta, estatus } = req.query;
    let list = await getAll('incidents');
    if (req.user.rol !== 'admin') list = list.filter(i => !i.es_privado);
    if (desde) list = list.filter(i => i.fecha >= desde);
    if (hasta) list = list.filter(i => i.fecha <= hasta);
    if (estatus) list = list.filter(i => i.estatus === estatus);

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(i => ({ ...i, reportado_por_nombre: userMap[i.reportado_por] || null, responsable_nombre: userMap[i.responsable_id] || null })).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reporte de incidencias' });
  }
});

module.exports = router;