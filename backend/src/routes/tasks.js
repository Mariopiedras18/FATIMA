const express = require('express');
const router = express.Router();
const { getAll, addDoc, nextId, getById, updateDoc, deleteDoc, getFirestore } = require('../database/firestore');
const { auth } = require('../middleware/auth');

const ROLL_LIMPIEZA_DE_CAJON = {
  1: { manana: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño'], tarde: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas'] },
  2: { manana: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas'], tarde: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería'] },
  3: { manana: ['Limpieza profunda de freidora y horno'], tarde: ['Limpieza profunda de toranis y barra'] },
  4: { manana: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas'], tarde: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño'] },
  5: { manana: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería'], tarde: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas'] },
  6: { manana: ['Limpieza profunda de toranis y barra', 'Lavar baño (Turno Matutino)'], tarde: ['Limpieza profunda de freidora y horno'] },
  0: { manana: [], tarde: ['Lavar baño (Turno Vespertino)'] }
};

const getDayIndex = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

const getDatesRange = (startDateStr, endDateStr) => {
  const dates = [];
  let [y, m, d] = startDateStr.split('-').map(Number);
  let dt = new Date(y, m - 1, d);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const endDt = new Date(ey, em - 1, ed);
  while (dt <= endDt) {
    dates.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
    dt.setDate(dt.getDate() + 1);
  }
  return dates;
};

const ensureDefaultTasksForDate = async (fecha) => {
  const allTasks = await getAll('tasks');
  const dayIdx = getDayIndex(fecha);
  const rollDay = ROLL_LIMPIEZA_DE_CAJON[dayIdx] || { manana: [], tarde: [] };
  const existingForDate = allTasks.filter(t => t.fecha === fecha);

  let maxId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) : 0;
  const batch = getFirestore().batch();
  let added = false;

  for (const turno of ['manana', 'tarde']) {
    const defaultList = rollDay[turno] || [];
    for (const titulo of defaultList) {
      const exists = existingForDate.some(t => t.turno === turno && t.titulo === titulo);
      if (!exists) {
        maxId++;
        const newTask = {
          id: maxId, branch_id: 1, fecha, turno, titulo,
          tipo: 'cajon', estatus: 'pendiente',
          completada_por: null, completada_at: null,
          created_at: new Date().toISOString()
        };
        batch.set(getFirestore().collection('tasks').doc(String(maxId)), newTask);
        added = true;
      }
    }
  }
  if (added) await batch.commit();
};

router.get('/', auth, async (req, res) => {
  try {
    const { fecha, desde, hasta, turno } = req.query;
    const hoy = new Date().toISOString().split('T')[0];
    const targetFecha = fecha || hoy;

    if (desde && hasta) {
      const datesRange = getDatesRange(desde, hasta);
      for (const dStr of datesRange) await ensureDefaultTasksForDate(dStr);
    } else {
      await ensureDefaultTasksForDate(targetFecha);
    }

    let list = await getAll('tasks');
    if (desde && hasta) list = list.filter(t => t.fecha >= desde && t.fecha <= hasta);
    else if (fecha) list = list.filter(t => t.fecha === fecha);
    if (turno) list = list.filter(t => t.turno === turno);

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    res.json(list.map(t => ({ ...t, completada_por_nombre: t.completada_por ? (userMap[t.completada_por] || null) : null })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { fecha, turno, titulo, observaciones } = req.body;
    if (!fecha || !turno || !titulo) return res.status(400).json({ error: 'Fecha, turno y título son requeridos' });

    const id = await nextId('tasks');
    const newTask = {
      id, branch_id: 1, fecha, turno, titulo, tipo: 'adicional',
      estatus: 'pendiente', observaciones: observaciones || null,
      completada_por: null, completada_at: null,
      created_at: new Date().toISOString()
    };
    await addDoc('tasks', newTask);
    res.json({ id, message: 'Pendiente adicional registrado', task: newTask });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar tarea' });
  }
});

router.put('/:id/toggle', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = await getById('tasks', id);
    if (!task) return res.status(404).json({ error: 'Pendiente no encontrado' });

    let updates;
    if (task.estatus === 'completada') {
      updates = { estatus: 'pendiente', completada_por: null, completada_at: null };
    } else {
      updates = { estatus: 'completada', completada_por: req.user.id, completada_at: new Date().toISOString() };
    }
    await updateDoc('tasks', id, updates);

    const users = await getAll('users');
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));
    const updatedTask = { ...task, ...updates };
    res.json({ message: 'Estado actualizado', task: { ...updatedTask, completada_por_nombre: updates.completada_por ? (userMap[updates.completada_por] || null) : null } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al alternar estado del pendiente' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = await getById('tasks', id);
    if (!task) return res.status(404).json({ error: 'Pendiente no encontrado' });
    if (task.tipo === 'cajon') return res.status(400).json({ error: 'Las tareas fijas del día no se pueden eliminar' });
    await deleteDoc('tasks', id);
    res.json({ message: 'Pendiente eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

module.exports = router;