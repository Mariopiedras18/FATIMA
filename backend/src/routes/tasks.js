const express = require('express');
const router = express.Router();
const { db, saveDB } = require('../database/connection');
const { auth } = require('../middleware/auth');

const ROLL_LIMPIEZA_DE_CAJON = {
  1: { // Lunes
    manana: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño'],
    tarde: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas']
  },
  2: { // Martes
    manana: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas'],
    tarde: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería']
  },
  3: { // Miércoles
    manana: ['Limpieza profunda de freidora y horno'],
    tarde: ['Limpieza profunda de toranis y barra']
  },
  4: { // Jueves
    manana: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas'],
    tarde: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño']
  },
  5: { // Viernes
    manana: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería'],
    tarde: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas']
  },
  6: { // Sábado
    manana: ['Limpieza profunda de toranis y barra', 'Lavar baño (Turno Matutino)'],
    tarde: ['Limpieza profunda de freidora y horno']
  },
  0: { // Domingo
    manana: [],
    tarde: ['Lavar baño (Turno Vespertino)']
  }
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
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    dt.setDate(dt.getDate() + 1);
  }
  return dates;
};

const ensureDefaultTasksForDate = async (fecha) => {
  if (!db.data.tasks) db.data.tasks = [];
  const dayIdx = getDayIndex(fecha);
  const rollDay = ROLL_LIMPIEZA_DE_CAJON[dayIdx] || { manana: [], tarde: [] };

  const existingForDate = db.data.tasks.filter(t => t.fecha === fecha);
  let maxId = db.data.tasks.length > 0 ? Math.max(...db.data.tasks.map(t => t.id)) : 0;
  let added = false;

  ['manana', 'tarde'].forEach(turno => {
    const defaultList = rollDay[turno] || [];
    defaultList.forEach(titulo => {
      const exists = existingForDate.some(t => t.turno === turno && t.titulo === titulo);
      if (!exists) {
        maxId++;
        db.data.tasks.push({
          id: maxId,
          branch_id: 1,
          fecha,
          turno,
          titulo,
          tipo: 'cajon', // 'cajon' (Roll de limpieza fijo) | 'adicional' (Creado por usuario)
          estatus: 'pendiente',
          completada_por: null,
          completada_at: null,
          created_at: new Date().toISOString()
        });
        added = true;
      }
    });
  });

  if (added) {
    await saveDB();
  }
};

router.get('/', auth, async (req, res) => {
  const { fecha, desde, hasta, turno } = req.query;
  await db.read();
  const hoy = new Date().toISOString().split('T')[0];
  const targetFecha = fecha || hoy;

  if (desde && hasta) {
    const datesRange = getDatesRange(desde, hasta);
    for (const dStr of datesRange) {
      await ensureDefaultTasksForDate(dStr);
    }
  } else {
    await ensureDefaultTasksForDate(targetFecha);
  }

  let list = db.data.tasks || [];

  if (desde && hasta) {
    list = list.filter(t => t.fecha >= desde && t.fecha <= hasta);
  } else if (fecha) {
    list = list.filter(t => t.fecha === fecha);
  }

  if (turno) {
    list = list.filter(t => t.turno === turno);
  }

  res.json(list.map(t => ({
    ...t,
    completada_por_nombre: t.completada_por ? (db.data.users.find(u => u.id === t.completada_por) || {}).nombre : null
  })));
});

router.post('/', auth, async (req, res) => {
  const { fecha, turno, titulo, observaciones } = req.body;
  if (!fecha || !turno || !titulo) return res.status(400).json({ error: 'Fecha, turno y título son requeridos' });

  await db.read();
  const id = db.data.tasks.length > 0 ? Math.max(...db.data.tasks.map(t => t.id)) + 1 : 1;

  const newTask = {
    id,
    branch_id: 1,
    fecha,
    turno,
    titulo,
    tipo: 'adicional',
    estatus: 'pendiente',
    observaciones: observaciones || null,
    completada_por: null,
    completada_at: null,
    created_at: new Date().toISOString()
  };

  db.data.tasks.push(newTask);
  await saveDB();
  res.json({ id, message: 'Pendiente adicional registrado', task: newTask });
});

router.put('/:id/toggle', auth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    await db.read();
    if (!db.data.tasks) db.data.tasks = [];
    const task = db.data.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Pendiente no encontrado' });

    if (task.estatus === 'completada') {
      task.estatus = 'pendiente';
      task.completada_por = null;
      task.completada_at = null;
    } else {
      task.estatus = 'completada';
      task.completada_por = req.user ? req.user.id : 1;
      task.completada_at = new Date().toISOString();
    }

    await saveDB();
    const user = (db.data.users || []).find(u => u.id === task.completada_por);
    res.json({
      message: 'Estado actualizado',
      task: {
        ...task,
        completada_por_nombre: user ? user.nombre : null
      }
    });
  } catch (err) {
    console.error('Error en toggle task:', err);
    res.status(500).json({ error: 'Error al alternar estado del pendiente' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await db.read();
  const idx = db.data.tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Pendiente no encontrado' });
  
  if (db.data.tasks[idx].tipo === 'cajon') {
    return res.status(400).json({ error: 'Las tareas fijas del día no se pueden eliminar' });
  }

  db.data.tasks.splice(idx, 1);
  await saveDB();
  res.json({ message: 'Pendiente eliminado' });
});

module.exports = router;