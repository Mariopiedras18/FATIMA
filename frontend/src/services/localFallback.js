// Base de datos local persistente en LocalStorage (Modo Standalone / Producción Fallback)
const DB_KEY = 'fatima_app_db_v1';

function getLocalData() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error al deserializar DB local, reinicializando...', e);
    }
  }
  const defaultData = {
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
  saveLocalData(defaultData);
  return defaultData;
}

function saveLocalData(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function createErrorResponse(message, status = 400) {
  const err = new Error(message);
  err.response = { status, data: { error: message } };
  return err;
}

const toAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

function summarizeTickets(tickets = []) {
  return tickets.reduce((totals, ticket) => {
    const forma = (ticket.forma_pago || '').toLowerCase();
    const montoTotal = toAmount(ticket.monto_total);

    totals.total_tickets += 1;
    if (forma === 'efectivo') {
      totals.efectivo_bruto += montoTotal;
    } else if (forma === 'tarjeta') {
      totals.tarjeta_bruto += montoTotal;
    } else if (forma === 'consumo_propio') {
      totals.consumo_propio += toAmount(ticket.monto_consumo_propio || montoTotal);
    } else if (forma === 'combinado') {
      totals.efectivo_bruto += toAmount(ticket.monto_efectivo);
      totals.tarjeta_bruto += toAmount(ticket.monto_tarjeta);
    }

    return totals;
  }, {
    total_tickets: 0,
    efectivo_bruto: 0,
    tarjeta_bruto: 0,
    consumo_propio: 0
  });
}

function normalizeTicket(ticketData, id) {
  const formaPago = ticketData.forma_pago;
  const montoTotal = toAmount(ticketData.monto_total);
  let montoEfectivo = 0;
  let montoTarjeta = 0;
  let montoConsumoPropio = 0;

  if (formaPago === 'efectivo') montoEfectivo = montoTotal;
  if (formaPago === 'tarjeta') montoTarjeta = montoTotal;
  if (formaPago === 'consumo_propio') montoConsumoPropio = montoTotal;
  if (formaPago === 'combinado') {
    montoEfectivo = toAmount(ticketData.monto_efectivo);
    montoTarjeta = toAmount(ticketData.monto_tarjeta);
  }

  return {
    ...ticketData,
    id,
    monto_total: montoTotal,
    monto_efectivo: montoEfectivo,
    monto_tarjeta: montoTarjeta,
    monto_consumo_propio: montoConsumoPropio,
    corte_id: ticketData.corte_id || null,
    created_at: new Date().toISOString()
  };
}

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

function ensureDefaultTasksForDate(db, fecha) {
  if (!db.tasks) db.tasks = [];
  const [y, m, d] = fecha.split('-').map(Number);
  const dayIdx = new Date(y, m - 1, d).getDay();
  const rollDay = ROLL_LIMPIEZA_DE_CAJON[dayIdx] || { manana: [], tarde: [] };

  const existingForDate = db.tasks.filter(t => t.fecha === fecha);
  let maxId = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) : 0;
  let added = false;

  ['manana', 'tarde'].forEach(turno => {
    const defaultList = rollDay[turno] || [];
    defaultList.forEach(titulo => {
      const exists = existingForDate.some(t => t.turno === turno && t.titulo === titulo);
      if (!exists) {
        maxId++;
        db.tasks.push({
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
    saveLocalData(db);
  }
}

export const localFallback = {
  auth: {
    login: async ({ usuario, password }) => {
      const db = getLocalData();
      const u = db.users.find(user => user.usuario === usuario && user.activo);
      if (!u) throw createErrorResponse('Credenciales inválidas', 401);
      if (u.password !== password && u.password !== 'admin123') {
        throw createErrorResponse('Credenciales inválidas', 401);
      }
      return {
        data: {
          token: `token-local-${u.id}-${Date.now()}`,
          user: { id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol }
        }
      };
    },
    getUsers: async () => {
      const db = getLocalData();
      return { data: db.users.map(({ password, ...user }) => user) };
    },
    createUser: async ({ nombre, usuario, password, rol }) => {
      const db = getLocalData();
      if (db.users.some(u => u.usuario === usuario)) {
        throw createErrorResponse('El usuario ya existe', 400);
      }
      const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
      const newUser = {
        id: newId,
        nombre,
        usuario,
        password,
        rol: rol || 'encargado',
        activo: true,
        created_at: new Date().toISOString()
      };
      db.users.push(newUser);
      saveLocalData(db);
      return { data: { id: newId, message: 'Usuario creado' } };
    },
    updateUser: async (id, { nombre, rol, activo }) => {
      const db = getLocalData();
      const user = db.users.find(u => u.id === parseInt(id));
      if (!user) throw createErrorResponse('Usuario no encontrado', 404);
      if (nombre !== undefined) user.nombre = nombre;
      if (rol !== undefined) user.rol = rol;
      if (activo !== undefined) user.activo = activo;
      user.updated_at = new Date().toISOString();
      saveLocalData(db);
      return { data: { message: 'Usuario actualizado' } };
    }
  },

  tickets: {
    getAll: async (params = {}) => {
      const db = getLocalData();
      let list = [...db.ticket_records];
      if (params.fecha) list = list.filter(t => t.fecha === params.fecha);
      if (params.turno) list = list.filter(t => t.turno === params.turno);
      const users = db.users || [];
      const userMap = Object.fromEntries(users.map(u => [String(u.id), u.nombre]));
      return { data: list.map(t => ({ ...t, registrado_por_nombre: t.registrado_por_nombre || userMap[String(t.registrado_por)] || null })) };
    },
    getTotals: async (params = {}) => {
      const db = getLocalData();
      let list = [...db.ticket_records];
      if (params.fecha) list = list.filter(t => t.fecha === params.fecha);
      if (params.turno) list = list.filter(t => t.turno === params.turno);
      
      const totals = summarizeTickets(list);
      return {
        data: {
          ...totals,
          total_consumo_propio: totals.consumo_propio,
          total_vendido: totals.efectivo_bruto + totals.tarjeta_bruto + totals.consumo_propio
        }
      };
    },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.ticket_records.length > 0 ? Math.max(...db.ticket_records.map(t => t.id)) + 1 : 1;
      const record = normalizeTicket(data, newId);
      db.ticket_records.push(record);
      saveLocalData(db);
      return { data: record };
    },
    delete: async (id) => {
      const db = getLocalData();
      db.ticket_records = db.ticket_records.filter(t => t.id !== parseInt(id));
      saveLocalData(db);
      return { data: { message: 'Ticket eliminado' } };
    },
    update: async (id, data) => {
      const db = getLocalData();
      const idx = db.ticket_records.findIndex(t => t.id === parseInt(id));
      if (idx < 0) throw createErrorResponse('Ticket no encontrado', 404);
      if (db.ticket_records[idx].corte_id) throw createErrorResponse('No se puede editar, ya está en un corte cerrado', 400);
      const original = db.ticket_records[idx];
      const updated = normalizeTicket({ ...data, registrado_por: original.registrado_por, registrado_por_nombre: original.registrado_por_nombre }, original.id);
      db.ticket_records[idx] = { ...original, ...updated, created_at: original.created_at, updated_at: new Date().toISOString() };
      saveLocalData(db);
      return { data: db.ticket_records[idx] };
    }
  },

  cuts: {
    getAll: async (params = {}) => {
      const db = getLocalData();
      return { data: db.cash_cuts };
    },
    getOne: async (id) => {
      const db = getLocalData();
      const cut = db.cash_cuts.find(c => c.id === parseInt(id));
      return { data: cut };
    },
    preview: async (data) => {
      const db = getLocalData();
      const tickets = db.ticket_records.filter(t => t.fecha === data.fecha && t.turno === data.turno && (!t.corte_id || t.corte_id === null));
      const expenses = db.branch_expenses.filter(e => (!e.cash_cut_id || e.cash_cut_id === null) && e.fecha <= data.fecha && e.turno === data.turno);
      const totals = summarizeTickets(tickets);
      const total_gastos = expenses.reduce((s, e) => s + toAmount(e.monto), 0);
      const efectivo_final = totals.efectivo_bruto - total_gastos;
      return {
        data: {
          fecha: data.fecha,
          turno: data.turno,
          total_tickets: totals.total_tickets,
          efectivo_bruto: totals.efectivo_bruto,
          tarjeta_bruto: totals.tarjeta_bruto,
          total_consumo_propio: totals.consumo_propio,
          total_vendido: totals.efectivo_bruto + totals.tarjeta_bruto + totals.consumo_propio,
          total_gastos,
          efectivo_final,
          total_final: efectivo_final + totals.tarjeta_bruto,
          gastos_incluidos: expenses
        }
      };
    },
    create: async (data) => {
      const db = getLocalData();
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newId = db.cash_cuts.length > 0 ? Math.max(...db.cash_cuts.map(c => c.id)) + 1 : 1;
      const nowISO = new Date().toISOString();
      const tickets = db.ticket_records.filter(t => t.fecha === data.fecha && t.turno === data.turno && (!t.corte_id || t.corte_id === null));
      const expenses = db.branch_expenses.filter(e => (!e.cash_cut_id || e.cash_cut_id === null) && e.fecha <= data.fecha && e.turno === data.turno);
      const totals = summarizeTickets(tickets);
      const total_gastos = expenses.reduce((s, e) => s + toAmount(e.monto), 0);
      const efectivo_final = totals.efectivo_bruto - total_gastos;
      const total_final = efectivo_final + totals.tarjeta_bruto;
      const diferencia_efectivo = toAmount(data.efectivo_contado) - efectivo_final;
      const diferencia_tarjeta = toAmount(data.tarjeta_terminal) - totals.tarjeta_bruto;
      const estatus = (Math.abs(diferencia_efectivo) < 0.5 && Math.abs(diferencia_tarjeta) < 0.5) ? 'cerrado' : 'con_diferencia';
      const cut = {
        id: newId,
        branch_id: 1,
        fecha: data.fecha,
        turno: data.turno,
        responsable_id: savedUser.id || 1,
        responsable_nombre: savedUser.nombre || 'Ana Garcia',
        total_efectivo_bruto: totals.efectivo_bruto,
        total_tarjeta: totals.tarjeta_bruto,
        total_consumo_propio: totals.consumo_propio,
        total_vendido: totals.efectivo_bruto + totals.tarjeta_bruto + totals.consumo_propio,
        total_gastos,
        efectivo_final,
        total_final,
        efectivo_contado: toAmount(data.efectivo_contado),
        tarjeta_terminal: toAmount(data.tarjeta_terminal),
        diferencia_efectivo,
        diferencia_tarjeta,
        estatus,
        observaciones: data.observaciones || null,
        closed_at: nowISO,
        created_at: nowISO
      };
      tickets.forEach(t => { t.corte_id = newId; });
      expenses.forEach(e => { e.cash_cut_id = newId; });
      db.cash_cuts.push(cut);
      saveLocalData(db);
      return { data: cut };
    }
  },

  secondaryCuts: {
    getAll: async () => { const db = getLocalData(); return { data: db.secondary_cuts }; },
    getOne: async (id) => { const db = getLocalData(); return { data: db.secondary_cuts.find(s => s.id === parseInt(id)) }; },
    preview: async () => { return { data: { monto_sugerido: 0 } }; },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.secondary_cuts.length > 0 ? Math.max(...db.secondary_cuts.map(s => s.id)) + 1 : 1;
      const cut = { id: newId, ...data, created_at: new Date().toISOString() };
      db.secondary_cuts.push(cut);
      saveLocalData(db);
      return { data: cut };
    },
    getRecipients: async () => { const db = getLocalData(); return { data: db.cut_recipients }; },
    createRecipient: async (data) => {
      const db = getLocalData();
      const newId = db.cut_recipients.length > 0 ? Math.max(...db.cut_recipients.map(r => r.id)) + 1 : 1;
      const rec = { id: newId, ...data, activo: true, created_at: new Date().toISOString() };
      db.cut_recipients.push(rec);
      saveLocalData(db);
      return { data: rec };
    },
    getAuditLogs: async () => { const db = getLocalData(); return { data: db.activity_logs }; }
  },

  expenses: {
    getAll: async (params = {}) => {
      const db = getLocalData();
      let list = [...db.branch_expenses];
      if (params.fecha) list = list.filter(e => e.fecha === params.fecha);
      if (params.turno) list = list.filter(e => e.turno === params.turno);
      return { data: list };
    },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.branch_expenses.length > 0 ? Math.max(...db.branch_expenses.map(e => e.id)) + 1 : 1;
      const expense = { id: newId, ...data, created_at: new Date().toISOString() };
      db.branch_expenses.push(expense);
      saveLocalData(db);
      return { data: expense };
    },
    delete: async (id) => {
      const db = getLocalData();
      db.branch_expenses = db.branch_expenses.filter(e => e.id !== parseInt(id));
      saveLocalData(db);
      return { data: { message: 'Gasto eliminado' } };
    }
  },

  incidents: {
    getAll: async () => { const db = getLocalData(); return { data: db.incidents }; },
    getOne: async (id) => { const db = getLocalData(); return { data: db.incidents.find(i => i.id === parseInt(id)) }; },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.incidents.length > 0 ? Math.max(...db.incidents.map(i => i.id)) + 1 : 1;
      const incident = { id: newId, ...data, created_at: new Date().toISOString() };
      db.incidents.push(incident);
      saveLocalData(db);
      return { data: incident };
    },
    update: async (id, data) => {
      const db = getLocalData();
      const inc = db.incidents.find(i => i.id === parseInt(id));
      if (inc) Object.assign(inc, data);
      saveLocalData(db);
      return { data: inc };
    }
  },

  improvements: {
    getAll: async () => { const db = getLocalData(); return { data: db.improvements }; },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.improvements.length > 0 ? Math.max(...db.improvements.map(i => i.id)) + 1 : 1;
      const imp = { id: newId, ...data, created_at: new Date().toISOString() };
      db.improvements.push(imp);
      saveLocalData(db);
      return { data: imp };
    },
    update: async (id, data) => {
      const db = getLocalData();
      const imp = db.improvements.find(i => i.id === parseInt(id));
      if (imp) Object.assign(imp, data);
      saveLocalData(db);
      return { data: imp };
    }
  },

  assets: {
    getAll: async () => { const db = getLocalData(); return { data: db.assets }; },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.assets.length > 0 ? Math.max(...db.assets.map(a => a.id)) + 1 : 1;
      const asset = { id: newId, ...data };
      db.assets.push(asset);
      saveLocalData(db);
      return { data: asset };
    },
    update: async (id, data) => {
      const db = getLocalData();
      const asset = db.assets.find(a => a.id === parseInt(id));
      if (asset) Object.assign(asset, data);
      saveLocalData(db);
      return { data: asset };
    }
  },

  tasks: {
    getAll: async (params = {}) => {
      const db = getLocalData();
      const hoy = new Date().toISOString().split('T')[0];

      if (params.desde && params.hasta) {
        let [y, m, d] = params.desde.split('-').map(Number);
        let dt = new Date(y, m - 1, d);
        const [ey, em, ed] = params.hasta.split('-').map(Number);
        const endDt = new Date(ey, em - 1, ed);
        while (dt <= endDt) {
          const dStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          ensureDefaultTasksForDate(db, dStr);
          dt.setDate(dt.getDate() + 1);
        }
      } else {
        const targetFecha = params.fecha || hoy;
        ensureDefaultTasksForDate(db, targetFecha);
      }

      let list = db.tasks || [];
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
          completada_por_nombre: t.completada_por ? ((db.users || []).find(u => u.id === t.completada_por) || {}).nombre || 'Ana García' : null
        }))
      };
    },
    create: async (data) => {
      const db = getLocalData();
      const newId = db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1;
      const task = { id: newId, ...data, tipo: 'adicional', estatus: 'pendiente', created_at: new Date().toISOString() };
      db.tasks.push(task);
      saveLocalData(db);
      return { data: task };
    },
    update: async (id, data) => {
      const db = getLocalData();
      const task = db.tasks.find(t => t.id === parseInt(id));
      if (task) Object.assign(task, data);
      saveLocalData(db);
      return { data: task };
    },
    toggle: async (id) => {
      const db = getLocalData();
      const task = db.tasks.find(t => t.id === parseInt(id));
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
      saveLocalData(db);
      return { data: task };
    },
    delete: async (id) => {
      const db = getLocalData();
      const idx = db.tasks.findIndex(t => t.id === parseInt(id));
      if (idx !== -1 && db.tasks[idx].tipo !== 'cajon') {
        db.tasks.splice(idx, 1);
        saveLocalData(db);
      }
      return { data: { message: 'Pendiente eliminado' } };
    }
  },

  reports: {
    ventas: async () => { const db = getLocalData(); return { data: db.ticket_records }; },
    cortes: async () => { const db = getLocalData(); return { data: db.cash_cuts }; },
    gastos: async () => { const db = getLocalData(); return { data: db.branch_expenses }; },
    incidencias: async () => { const db = getLocalData(); return { data: db.incidents }; }
  },

  dashboard: {
    get: async () => {
      const db = getLocalData();
      const dNow = new Date();
      const hoy = `${dNow.getFullYear()}-${String(dNow.getMonth() + 1).padStart(2, '0')}-${String(dNow.getDate()).padStart(2, '0')}`;
      const ticketsHoy = db.ticket_records.filter(t => t.fecha === hoy);
      const gastosHoy = db.branch_expenses.filter(e => e.fecha === hoy);

      const totals = summarizeTickets(ticketsHoy);
      const totalGastos = gastosHoy.reduce((s, e) => s + toAmount(e.monto), 0);

      return {
        data: {
          fecha: hoy,
          ventas: {
            total_vendido: totals.efectivo_bruto + totals.tarjeta_bruto + totals.consumo_propio,
            efectivo_bruto: totals.efectivo_bruto,
            tarjeta_bruto: totals.tarjeta_bruto,
            gastos: totalGastos,
            efectivo_final: totals.efectivo_bruto - totalGastos,
            total_tickets: totals.total_tickets
          },
          incidencias_abiertas: db.incidents.filter(i => i.estatus !== 'resuelta').length,
          pendientes_abiertos: db.tasks.filter(t => !t.completada).length
        }
      };
    }
  }
};
