const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, updateDoc } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { categoria, estatus, prioridad } = req.query;
    let list = await getAll('improvements');
    if (categoria) list = list.filter(i => i.categoria === categoria);
    if (estatus) list = list.filter(i => i.estatus === estatus);
    if (prioridad) list = list.filter(i => i.prioridad === prioridad);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(i => ({ ...i, propuesto_por_nombre: userMap[i.propuesto_por] || null, responsable_nombre: userMap[i.responsable_id] || null })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mejoras' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, categoria, descripcion, beneficio, prioridad, responsable_id } = req.body;
    if (!fecha || !categoria || !descripcion) return res.status(400).json({ error: 'Fecha, categoría y descripción requeridos' });

    const id = await nextId('improvements');
    const newItem = {
      id, branch_id: 1, fecha,
      propuesto_por: req.user.id,
      categoria, descripcion,
      beneficio: beneficio || null,
      prioridad: prioridad || 'media',
      responsable_id: responsable_id || null,
      estatus: 'propuesta',
      observaciones: null,
      created_at: new Date().toISOString()
    };
    await addDoc('improvements', newItem);
    res.json({ id, message: 'Mejora registrada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar mejora' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await getById('improvements', id);
    if (!item) return res.status(404).json({ error: 'No encontrada' });

    const { estatus, prioridad, responsable_id, observaciones } = req.body;
    const updates = {};
    if (estatus) updates.estatus = estatus;
    if (prioridad) updates.prioridad = prioridad;
    if (responsable_id) updates.responsable_id = responsable_id;
    if (observaciones) updates.observaciones = observaciones;
    await updateDoc('improvements', id, updates);
    res.json({ message: 'Mejora actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar mejora' });
  }
});

module.exports = router;