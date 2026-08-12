const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, updateDoc } = require('../database/firestore');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { tipo, estatus, prioridad } = req.query;
    let list = await getAll('assets');
    if (tipo) list = list.filter(a => a.tipo === tipo);
    if (estatus) list = list.filter(a => a.estatus === estatus);
    if (prioridad) list = list.filter(a => a.prioridad === prioridad);
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(a => ({ ...a, responsable_nombre: userMap[a.responsable_id] || null })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener activos' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { nombre, tipo, descripcion, estado_actual, accion_requerida, prioridad, responsable_id, costo_estimado, evidencia_url } = req.body;
    if (!nombre || !tipo || !descripcion || !accion_requerida) return res.status(400).json({ error: 'Nombre, tipo, descripción y acción requerida son requeridos' });

    const id = await nextId('assets');
    const newAsset = {
      id, branch_id: 1, nombre, tipo, descripcion,
      estado_actual: estado_actual || 'regular',
      accion_requerida,
      prioridad: prioridad || 'media',
      responsable_id: responsable_id || null,
      costo_estimado: costo_estimado || null,
      evidencia_url: evidencia_url || null,
      estatus: 'reportado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc('assets', newAsset);
    res.json({ id, message: 'Equipo registrado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar activo' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await getById('assets', id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });

    const { estatus, prioridad, responsable_id, costo_estimado } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (estatus) updates.estatus = estatus;
    if (prioridad) updates.prioridad = prioridad;
    if (responsable_id) updates.responsable_id = responsable_id;
    if (costo_estimado !== undefined) updates.costo_estimado = costo_estimado;
    await updateDoc('assets', id, updates);
    res.json({ message: 'Equipo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar activo' });
  }
});

module.exports = router;