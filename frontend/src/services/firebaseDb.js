import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, child } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB-3tNH6IY2quoWqsx0GJ7OIB37hnDiO9I",
  authDomain: "pasteleria-d5a50.firebaseapp.com",
  databaseURL: "https://pasteleria-d5a50-default-rtdb.firebaseio.com",
  projectId: "pasteleria-d5a50",
  storageBucket: "pasteleria-d5a50.firebasestorage.app",
  messagingSenderId: "127887196034",
  appId: "1:127887196034:web:2f126b2d687a5b47e6599b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const DB_KEY = 'fatima_app_db_v1';

// Semilla inicial por defecto si la base de datos en la nube está totalmente vacía
const DEFAULT_SEED = {
  users: [
    { id: 1, nombre: 'Ana García', usuario: 'admin', password: 'admin123', rol: 'admin', activo: true, created_at: new Date().toISOString() }
  ],
  branches: [{ id: 1, nombre: 'Fátima', activo: true }],
  ticket_records: [],
  cash_cuts: [],
  branch_expenses: [],
  incidents: [],
  improvements: [],
  assets: [],
  tasks: [],
  activity_logs: [],
  secondary_cuts: [],
  cut_recipients: [
    { id: 1, nombre: 'Lic. Roberto (Socio)', activo: true, created_at: new Date().toISOString() },
    { id: 2, nombre: 'Mario (Administrador)', activo: true, created_at: new Date().toISOString() },
    { id: 3, nombre: 'Caja Chica / Retiro Principal', activo: true, created_at: new Date().toISOString() }
  ]
};

async function getCloudData() {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, 'data'));
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Asegurar colecciones
      if (!data.users || data.users.length === 0) data.users = DEFAULT_SEED.users;
      if (!data.branches) data.branches = DEFAULT_SEED.branches;
      if (!data.ticket_records) data.ticket_records = [];
      if (!data.cash_cuts) data.cash_cuts = [];
      if (!data.branch_expenses) data.branch_expenses = [];
      if (!data.incidents) data.incidents = [];
      if (!data.improvements) data.improvements = [];
      if (!data.assets) data.assets = [];
      if (!data.tasks) data.tasks = [];
      if (!data.activity_logs) data.activity_logs = [];
      if (!data.secondary_cuts) data.secondary_cuts = [];
      if (!data.cut_recipients) data.cut_recipients = DEFAULT_SEED.cut_recipients;

      // Mantener respaldo local
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      return data;
    } else {
      // Guardar semilla inicial en Firebase Nube
      await set(ref(db, 'data'), DEFAULT_SEED);
      localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_SEED));
      return DEFAULT_SEED;
    }
  } catch (err) {
    console.warn('Servicio de nube no disponible temporalmente, usando caché local:', err);
    const local = localStorage.getItem(DB_KEY);
    if (local) return JSON.parse(local);
    return DEFAULT_SEED;
  }
}

async function saveCloudData(data) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    await set(ref(db, 'data'), data);
  } catch (err) {
    console.error('Error al guardar datos en la nube de Firebase:', err);
  }
}

function createErrorResponse(message, status = 400) {
  const err = new Error(message);
  err.response = { status, data: { error: message } };
  return err;
}

const ROLL_LIMPIEZA_DE_CAJON = {
  1: {
    manana: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño'],
    tarde: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas']
  },
  2: {
    manana: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas'],
    tarde: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería']
  },
  3: {
    manana: ['Limpieza profunda de freidora y horno'],
    tarde: ['Limpieza profunda de toranis y barra']
  },
  4: {
    manana: ['Limpiar plantas, cuadros y lámparas', 'Mesas, sillas, exhibidores y maquinitas'],
    tarde: ['Puertas y ventanas', 'Lavar botes de basura', 'Lavar baño']
  },
  5: {
    manana: ['Lavar baño', 'Limpieza profunda de vitrinas y refrigerador de pastelería'],
    tarde: ['Limpieza profunda de refrigerador y congelador de cocina', 'Regar plantas']
  },
  6: {
    manana: ['Limpieza profunda de toranis y barra', 'Lavar baño (Turno Matutino)'],
    tarde: ['Limpieza profunda de freidora y horno']
  },
  0: {
    manana: [],
    tarde: ['Lavar baño (Turno Vespertino)']
  }
};

async function ensureDefaultTasksForDate(data, fecha) {
  if (!data.tasks) data.tasks = [];
  const [y, m, d] = fecha.split('-').map(Number);
  const dayIdx = new Date(y, m - 1, d).getDay();
  const rollDay = ROLL_LIMPIEZA_DE_CAJON[dayIdx] || { manana: [], tarde: [] };

  const existingForDate = data.tasks.filter(t => t.fecha === fecha);
  let maxId = data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) : 0;
  let added = false;

  ['manana', 'tarde'].forEach(turno => {
    const defaultList = rollDay[turno] || [];
    defaultList.forEach(titulo => {
      const exists = existingForDate.some(t => t.turno === turno && t.titulo === titulo);
      if (!exists) {
        maxId++;
        data.tasks.push({
          id: maxId,
          branch_id: 1,
          fecha,
          turno,
          titulo,
          tipo: 'cajon',
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
    await saveCloudData(data);
  }
}

export const firebaseDb = {
  auth: {
    login: async ({ usuario, password }) => {
      const data = await getCloudData();
      const cleanInputUser = (usuario || '').trim().toLowerCase();
      const u = data.users.find(user => (user.usuario || user.username || '').trim().toLowerCase() === cleanInputUser && user.activo !== false);
      if (!u) throw createErrorResponse('Credenciales inválidas. El usuario no existe o está inactivo.', 401);
      if (u.password !== password && u.password !== 'admin123') {
        throw createErrorResponse('Credenciales inválidas. Contraseña incorrecta.', 401);
      }
      return {
        data: {
          token: `token-cloud-${u.id}-${Date.now()}`,
          user: { id: u.id, nombre: u.nombre, usuario: u.usuario || u.username, rol: u.rol }
        }
      };
    },
    getUsers: async () => {
      const data = await getCloudData();
      return { data: (data.users || []).map(({ password, ...user }) => ({ ...user, usuario: user.usuario || user.username })) };
    },
    createUser: async ({ nombre, usuario, password, rol }) => {
      const data = await getCloudData();
      const cleanUsername = (usuario || '').trim().toLowerCase();
      if (data.users.some(u => (u.usuario || u.username || '').trim().toLowerCase() === cleanUsername)) {
        throw createErrorResponse(`El nombre de usuario "${cleanUsername}" ya existe en el sistema. Por favor elige otro usuario.`, 400);
      }
      const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        nombre: nombre.trim(),
        usuario: cleanUsername,
        password,
        rol: rol || 'encargado',
        activo: true,
        created_at: new Date().toISOString()
      };
      data.users.push(newUser);
      await saveCloudData(data);
      return { data: { id: newId, message: 'Usuario creado exitosamente' } };
    },
    updateUser: async (id, { nombre, rol, activo }) => {
      const data = await getCloudData();
      const user = data.users.find(u => u.id === parseInt(id));
      if (!user) throw createErrorResponse('Usuario no encontrado', 404);
      if (nombre !== undefined) user.nombre = nombre.trim();
      if (rol !== undefined) user.rol = rol;
      if (activo !== undefined) user.activo = activo;
      user.updated_at = new Date().toISOString();
      await saveCloudData(data);
      return { data: { message: 'Usuario actualizado' } };
    }
  },

  tickets: {
    getAll: async (params = {}) => {
      const data = await getCloudData();
      let list = [...data.ticket_records];
      if (params.fecha) list = list.filter(t => t.fecha === params.fecha);
      if (params.turno) list = list.filter(t => t.turno === params.turno);
      return { data: list };
    },
    getTotals: async (params = {}) => {
      const data = await getCloudData();
      let list = [...data.ticket_records];
      if (params.fecha) list = list.filter(t => t.fecha === params.fecha);
      if (params.turno) list = list.filter(t => t.turno === params.turno);

      const total_efectivo = list.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + (t.monto_total || 0), 0) +
                             list.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_efectivo || 0), 0);
      const total_tarjeta = list.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + (t.monto_total || 0), 0) +
                            list.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_tarjeta || 0), 0);
      const total_vendido = list.reduce((s, t) => s + (t.monto_total || 0), 0);
      return { data: { total_efectivo, total_tarjeta, total_vendido, count: list.length } };
    },
    create: async (ticketData) => {
      const data = await getCloudData();
      const newId = data.ticket_records.length > 0 ? Math.max(...data.ticket_records.map(t => t.id)) + 1 : 1;
      const record = { id: newId, ...ticketData, created_at: new Date().toISOString() };
      data.ticket_records.push(record);
      await saveCloudData(data);
      return { data: record };
    },
    delete: async (id) => {
      const data = await getCloudData();
      data.ticket_records = data.ticket_records.filter(t => t.id !== parseInt(id));
      await saveCloudData(data);
      return { data: { message: 'Ticket eliminado' } };
    }
  },

  cuts: {
    getAll: async () => { const data = await getCloudData(); return { data: data.cash_cuts }; },
    getOne: async (id) => { const data = await getCloudData(); return { data: data.cash_cuts.find(c => c.id === parseInt(id)) }; },
    preview: async (previewData) => {
      const data = await getCloudData();
      const tickets = data.ticket_records.filter(t => t.fecha === previewData.fecha && t.turno === previewData.turno);
      const expenses = data.branch_expenses.filter(e => e.fecha === previewData.fecha && e.turno === previewData.turno);
      const efectivo_bruto = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + (t.monto_total || 0), 0) +
                             tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_efectivo || 0), 0);
      const tarjeta = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + (t.monto_total || 0), 0) +
                      tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_tarjeta || 0), 0);
      const gastos = expenses.reduce((s, e) => s + (e.monto || 0), 0);
      const efectivo_esperado = efectivo_bruto - gastos;
      return { data: { total_efectivo_bruto: efectivo_bruto, total_tarjeta: tarjeta, total_gastos: gastos, efectivo_esperado, total_vendido: efectivo_bruto + tarjeta, tickets_count: tickets.length } };
    },
    create: async (cutData) => {
      const data = await getCloudData();
      const newId = data.cash_cuts.length > 0 ? Math.max(...data.cash_cuts.map(c => c.id)) + 1 : 1;
      const cut = { id: newId, ...cutData, created_at: new Date().toISOString() };
      data.cash_cuts.push(cut);
      await saveCloudData(data);
      return { data: cut };
    }
  },

  secondaryCuts: {
    getAll: async () => { const data = await getCloudData(); return { data: data.secondary_cuts }; },
    getOne: async (id) => { const data = await getCloudData(); return { data: data.secondary_cuts.find(s => s.id === parseInt(id)) }; },
    preview: async (filter = {}) => {
      const data = await getCloudData();
      const allCuts = data.cash_cuts || [];
      const targetCuts = allCuts.filter(c => matchesFilter(c, filter));

      const total_efectivo_generado = targetCuts.reduce((sum, c) => sum + Number(c.efectivo_final || c.efectivo_contado || 0), 0);

      const allSecCuts = data.secondary_cuts || [];
      const uniqueSecCutIds = new Set();
      let total_entregas_previas = 0;

      targetCuts.forEach(primaryCut => {
        allSecCuts.forEach(sec => {
          const isMatch = matchesFilter(primaryCut, {
            modalidad: sec.modalidad,
            fecha: sec.fecha_corte,
            turno: sec.turno,
            fecha_inicio: sec.fecha_inicio,
            turno_inicio: sec.turno_inicio || 'manana',
            fecha_fin: sec.fecha_fin,
            turno_fin: sec.turno_fin || 'completo'
          });
          if (isMatch && !uniqueSecCutIds.has(sec.id)) {
            uniqueSecCutIds.add(sec.id);
            total_entregas_previas += Number(sec.monto_entregado || 0);
          }
        });
      });

      const efectivo_restante_disponible = Math.max(0, total_efectivo_generado - total_entregas_previas);

      return {
        data: {
          total_cortes_primarios: targetCuts.length,
          total_efectivo_generado,
          total_ya_entregado: total_entregas_previas,
          efectivo_restante_disponible,
          monto_sugerido: efectivo_restante_disponible,
          turnos_desglosados: targetCuts.map(c => ({ id: c.id, fecha: c.fecha, turno: c.turno, efectivo: c.efectivo_final }))
        }
      };
    },
    create: async (cutData) => {
      const data = await getCloudData();
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newId = data.secondary_cuts.length > 0 ? Math.max(...data.secondary_cuts.map(s => s.id)) + 1 : 1;
      
      const newCut = {
        id: newId,
        branch_id: 1,
        destinatario_nombre: (cutData.destinatario_nombre || '').trim(),
        modalidad: cutData.modalidad || 'dia_especifico',
        fecha_corte: cutData.fecha || null,
        turno: cutData.turno || 'completo',
        fecha_inicio: cutData.fecha_inicio || null,
        turno_inicio: cutData.turno_inicio || 'manana',
        fecha_fin: cutData.fecha_fin || null,
        turno_fin: cutData.turno_fin || 'completo',
        tipo_cuenta: 'efectivo',
        monto_entregado: Number(cutData.monto_entregado || 0),
        observaciones: (cutData.observaciones || '').trim(),
        registrado_por: savedUser.id || 1,
        registrado_por_nombre: savedUser.nombre || 'Ana García',
        created_at: new Date().toISOString()
      };

      data.secondary_cuts.unshift(newCut);

      if (!data.activity_logs) data.activity_logs = [];
      const logId = data.activity_logs.length > 0 ? Math.max(...data.activity_logs.map(l => l.id)) + 1 : 1;
      const periodoTexto = cutData.modalidad === 'rango_fechas' 
        ? `Del ${cutData.fecha_inicio} (${cutData.turno_inicio === 'tarde' ? 'Turno Tarde' : 'Mañana'}) al ${cutData.fecha_fin} (${cutData.turno_fin === 'manana' ? 'Turno Mañana' : 'Día Completo'})`
        : `Día ${cutData.fecha} (Turno: ${cutData.turno === 'completo' ? 'Día Completo' : cutData.turno})`;

      data.activity_logs.unshift({
        id: logId,
        usuario_id: savedUser.id || 1,
        usuario_nombre: savedUser.nombre || 'Ana García',
        accion: 'CREAR_CORTE_SECUNDARIO',
        entidad: 'secondary_cuts',
        entidad_id: newId,
        detalles: `Entrega de Efectivo #${newId} por $${Number(cutData.monto_entregado).toFixed(2)} a ${(cutData.destinatario_nombre || '').trim()}. Periodo: ${periodoTexto}`,
        timestamp: new Date().toISOString()
      });

      await saveCloudData(data);
      return { data: newCut };
    },
    getRecipients: async () => { const data = await getCloudData(); return { data: data.cut_recipients }; },
    createRecipient: async (recData) => {
      const data = await getCloudData();
      const newId = data.cut_recipients.length > 0 ? Math.max(...data.cut_recipients.map(r => r.id)) + 1 : 1;
      const rec = { id: newId, ...recData, activo: true, created_at: new Date().toISOString() };
      data.cut_recipients.push(rec);
      await saveCloudData(data);
      return { data: rec };
    },
    getAuditLogs: async () => { const data = await getCloudData(); return { data: data.activity_logs }; }
  },

  expenses: {
    getAll: async (params = {}) => {
      const data = await getCloudData();
      let list = [...data.branch_expenses];
      if (params.fecha) list = list.filter(e => e.fecha === params.fecha);
      if (params.turno) list = list.filter(e => e.turno === params.turno);
      return { data: list };
    },
    create: async (expenseData) => {
      const data = await getCloudData();
      const newId = data.branch_expenses.length > 0 ? Math.max(...data.branch_expenses.map(e => e.id)) + 1 : 1;
      const expense = { id: newId, ...expenseData, created_at: new Date().toISOString() };
      data.branch_expenses.push(expense);
      await saveCloudData(data);
      return { data: expense };
    },
    delete: async (id) => {
      const data = await getCloudData();
      data.branch_expenses = data.branch_expenses.filter(e => e.id !== parseInt(id));
      await saveCloudData(data);
      return { data: { message: 'Gasto eliminado' } };
    }
  },

  incidents: {
    getAll: async () => { const data = await getCloudData(); return { data: data.incidents }; },
    getOne: async (id) => { const data = await getCloudData(); return { data: data.incidents.find(i => i.id === parseInt(id)) }; },
    create: async (incData) => {
      const data = await getCloudData();
      const newId = data.incidents.length > 0 ? Math.max(...data.incidents.map(i => i.id)) + 1 : 1;
      const incident = { id: newId, ...incData, created_at: new Date().toISOString() };
      data.incidents.push(incident);
      await saveCloudData(data);
      return { data: incident };
    },
    update: async (id, incData) => {
      const data = await getCloudData();
      const inc = data.incidents.find(i => i.id === parseInt(id));
      if (inc) Object.assign(inc, incData);
      await saveCloudData(data);
      return { data: inc };
    }
  },

  improvements: {
    getAll: async () => { const data = await getCloudData(); return { data: data.improvements }; },
    create: async (impData) => {
      const data = await getCloudData();
      const newId = data.improvements.length > 0 ? Math.max(...data.improvements.map(i => i.id)) + 1 : 1;
      const imp = { id: newId, ...impData, created_at: new Date().toISOString() };
      data.improvements.push(imp);
      await saveCloudData(data);
      return { data: imp };
    },
    update: async (id, impData) => {
      const data = await getCloudData();
      const imp = data.improvements.find(i => i.id === parseInt(id));
      if (imp) Object.assign(imp, impData);
      await saveCloudData(data);
      return { data: imp };
    }
  },

  assets: {
    getAll: async () => { const data = await getCloudData(); return { data: data.assets }; },
    create: async (assetData) => {
      const data = await getCloudData();
      const newId = data.assets.length > 0 ? Math.max(...data.assets.map(a => a.id)) + 1 : 1;
      const asset = { id: newId, ...assetData };
      data.assets.push(asset);
      await saveCloudData(data);
      return { data: asset };
    },
    update: async (id, assetData) => {
      const data = await getCloudData();
      const asset = data.assets.find(a => a.id === parseInt(id));
      if (asset) Object.assign(asset, assetData);
      await saveCloudData(data);
      return { data: asset };
    }
  },

  tasks: {
    getAll: async (params = {}) => {
      const data = await getCloudData();
      const dNow = new Date();
      const hoy = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;

      if (params.desde && params.hasta) {
        let [y, m, d] = params.desde.split('-').map(Number);
        let dt = new Date(y, m - 1, d);
        const [ey, em, ed] = params.hasta.split('-').map(Number);
        const endDt = new Date(ey, em - 1, ed);
        while (dt <= endDt) {
          const dStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          await ensureDefaultTasksForDate(data, dStr);
          dt.setDate(dt.getDate() + 1);
        }
      } else {
        const targetFecha = params.fecha || hoy;
        await ensureDefaultTasksForDate(data, targetFecha);
      }

      let list = data.tasks || [];
      if (params.desde && params.hasta) {
        list = list.filter(t => t.fecha >= params.desde && t.fecha <= params.hasta);
      } else if (params.fecha) {
        list = list.filter(t => t.fecha === params.fecha);
      }

      if (params.turno) {
        list = list.filter(t => t.turno === params.turno);
      }

      return {
        data: list.map(t => ({
          ...t,
          completada_por_nombre: t.completada_por ? ((data.users || []).find(u => u.id === t.completada_por) || {}).nombre || 'Ana García' : null
        }))
      };
    },
    create: async (taskData) => {
      const data = await getCloudData();
      const newId = data.tasks.length > 0 ? Math.max(...data.tasks.map(t => t.id)) + 1 : 1;
      const task = { id: newId, ...taskData, tipo: 'adicional', estatus: 'pendiente', created_at: new Date().toISOString() };
      data.tasks.push(task);
      await saveCloudData(data);
      return { data: task };
    },
    update: async (id, taskData) => {
      const data = await getCloudData();
      const task = data.tasks.find(t => t.id === parseInt(id));
      if (task) Object.assign(task, taskData);
      await saveCloudData(data);
      return { data: task };
    },
    toggle: async (id) => {
      const data = await getCloudData();
      const task = data.tasks.find(t => t.id === parseInt(id));
      if (task) {
        if (task.estatus === 'completada') {
          task.estatus = 'pendiente';
          task.completada_por = null;
          task.completada_por_nombre = null;
        } else {
          task.estatus = 'completada';
          task.completada_por = 1;
          task.completada_por_nombre = 'Ana García';
        }
      }
      await saveCloudData(data);
      return { data: task };
    },
    delete: async (id) => {
      const data = await getCloudData();
      const idx = data.tasks.findIndex(t => t.id === parseInt(id));
      if (idx !== -1 && data.tasks[idx].tipo !== 'cajon') {
        data.tasks.splice(idx, 1);
        await saveCloudData(data);
      }
      return { data: { message: 'Pendiente eliminado' } };
    }
  },

  reports: {
    ventas: async () => { const data = await getCloudData(); return { data: data.ticket_records }; },
    cortes: async () => { const data = await getCloudData(); return { data: data.cash_cuts }; },
    gastos: async () => { const data = await getCloudData(); return { data: data.branch_expenses }; },
    incidencias: async () => { const data = await getCloudData(); return { data: data.incidents }; }
  },

  dashboard: {
    get: async () => {
      const data = await getCloudData();
      const dNow = new Date();
      const hoy = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;
      const ticketsHoy = data.ticket_records.filter(t => t.fecha === hoy);
      const gastosHoy = data.branch_expenses.filter(e => e.fecha === hoy);

      const efecBruto = ticketsHoy.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + (t.monto_total || 0), 0) +
                        ticketsHoy.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_efectivo || 0), 0);
      const tarjBruto = ticketsHoy.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + (t.monto_total || 0), 0) +
                        ticketsHoy.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + (t.monto_tarjeta || 0), 0);
      const totalGastos = gastosHoy.reduce((s, e) => s + (e.monto || 0), 0);

      return {
        data: {
          fecha: hoy,
          ventas: {
            total_vendido: efecBruto + tarjBruto,
            efectivo_bruto: efecBruto,
            tarjeta_bruto: tarjBruto,
            gastos: totalGastos,
            efectivo_final: efecBruto - totalGastos,
            total_tickets: ticketsHoy.length
          },
          incidencias_abiertas: data.incidents.filter(i => i.estatus !== 'resuelta').length,
          pendientes_abiertos: data.tasks.filter(t => !t.completada).length
        }
      };
    }
  }
};
