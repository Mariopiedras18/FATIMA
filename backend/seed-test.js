const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'db.json');

// Fecha de hoy y días anteriores
const hoy = new Date();
const fechaHoy = hoy.toISOString().split('T')[0];

const diaAnterior = new Date(hoy);
diaAnterior.setDate(diaAnterior.getDate() - 1);
const fechaAyer = diaAnterior.toISOString().split('T')[0];

const hace2Dias = new Date(hoy);
hace2Dias.setDate(hace2Dias.getDate() - 2);
const fecha2 = hace2Dias.toISOString().split('T')[0];

const passwordHash = bcrypt.hashSync('admin123', 10);
const password1234 = bcrypt.hashSync('1234', 10);

const data = {
  users: [
    { id: 1, nombre: 'Ana García', usuario: 'admin', password: passwordHash, rol: 'admin', activo: true, created_at: '2026-07-01T08:00:00.000Z' },
    { id: 2, nombre: 'María López', usuario: 'maria', password: password1234, rol: 'encargado', activo: true, created_at: '2026-07-01T08:00:00.000Z' },
    { id: 3, nombre: 'Juan Pérez', usuario: 'juan', password: password1234, rol: 'operativo', activo: true, created_at: '2026-07-05T08:00:00.000Z' },
    { id: 4, nombre: 'Laura Martínez', usuario: 'laura', password: password1234, rol: 'encargado', activo: true, created_at: '2026-07-10T08:00:00.000Z' }
  ],
  branches: [{ id: 1, nombre: 'Fátima', activo: true }],

  // TICKETS - Día de hoy (turno mañana)
  ticket_records: [
    // === HOY - MAÑANA ===
    { id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0012', monto_total: 185, forma_pago: 'efectivo', monto_efectivo: 185, monto_tarjeta: 0, observaciones: null, corte_id: null, created_at: `${fechaHoy}T08:15:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0013', monto_total: 320, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 320, observaciones: null, corte_id: null, created_at: `${fechaHoy}T08:32:00.000Z` },
    { id: 3, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0014', monto_total: 95, forma_pago: 'efectivo', monto_efectivo: 95, monto_tarjeta: 0, observaciones: '2 pan dulces', corte_id: null, created_at: `${fechaHoy}T09:05:00.000Z` },
    { id: 4, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0015', monto_total: 450, forma_pago: 'combinado', monto_efectivo: 200, monto_tarjeta: 250, observaciones: 'Pastel de cumpleaños', corte_id: null, created_at: `${fechaHoy}T09:40:00.000Z` },
    { id: 5, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0016', monto_total: 120, forma_pago: 'efectivo', monto_efectivo: 120, monto_tarjeta: 0, observaciones: null, corte_id: null, created_at: `${fechaHoy}T10:10:00.000Z` },
    { id: 6, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0017', monto_total: 275, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 275, observaciones: null, corte_id: null, created_at: `${fechaHoy}T10:45:00.000Z` },
    { id: 7, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0018', monto_total: 580, forma_pago: 'combinado', monto_efectivo: 300, monto_tarjeta: 280, observaciones: 'Pedido empresa - 30 piezas', corte_id: null, created_at: `${fechaHoy}T11:20:00.000Z` },
    { id: 8, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0019', monto_total: 65, forma_pago: 'efectivo', monto_efectivo: 65, monto_tarjeta: 0, observaciones: 'Café y croissant', corte_id: null, created_at: `${fechaHoy}T11:50:00.000Z` },

    // === HOY - TARDE ===
    { id: 9, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 4, folio_4: '0020', monto_total: 210, forma_pago: 'efectivo', monto_efectivo: 210, monto_tarjeta: 0, observaciones: null, corte_id: null, created_at: `${fechaHoy}T14:05:00.000Z` },
    { id: 10, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 3, folio_4: '0021', monto_total: 380, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 380, observaciones: null, corte_id: null, created_at: `${fechaHoy}T14:30:00.000Z` },
    { id: 11, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 4, folio_4: '0022', monto_total: 150, forma_pago: 'efectivo', monto_efectivo: 150, monto_tarjeta: 0, observaciones: 'Galletas regalo', corte_id: null, created_at: `${fechaHoy}T15:15:00.000Z` },
    { id: 12, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 3, folio_4: '0023', monto_total: 420, forma_pago: 'combinado', monto_efectivo: 170, monto_tarjeta: 250, observaciones: 'Pastel personalizado', corte_id: null, created_at: `${fechaHoy}T15:50:00.000Z` },
    { id: 13, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 4, folio_4: '0024', monto_total: 85, forma_pago: 'efectivo', monto_efectivo: 85, monto_tarjeta: 0, observaciones: null, corte_id: null, created_at: `${fechaHoy}T16:25:00.000Z` },
    { id: 14, branch_id: 1, fecha: fechaHoy, turno: 'tarde', registrado_por: 3, folio_4: '0025', monto_total: 290, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 290, observaciones: null, corte_id: null, created_at: `${fechaHoy}T17:00:00.000Z` },

    // === AYER - MAÑANA (con corte cerrado) ===
    { id: 15, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 2, folio_4: '0001', monto_total: 220, forma_pago: 'efectivo', monto_efectivo: 220, monto_tarjeta: 0, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T08:20:00.000Z` },
    { id: 16, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 3, folio_4: '0002', monto_total: 350, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 350, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T09:00:00.000Z` },
    { id: 17, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 2, folio_4: '0003', monto_total: 180, forma_pago: 'efectivo', monto_efectivo: 180, monto_tarjeta: 0, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T09:45:00.000Z` },
    { id: 18, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 3, folio_4: '0004', monto_total: 520, forma_pago: 'combinado', monto_efectivo: 250, monto_tarjeta: 270, observaciones: 'Pedido boda', corte_id: 1, created_at: `${fechaAyer}T10:30:00.000Z` },
    { id: 19, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 2, folio_4: '0005', monto_total: 95, forma_pago: 'efectivo', monto_efectivo: 95, monto_tarjeta: 0, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T11:15:00.000Z` },

    // === AYER - TARDE (con corte cerrado) ===
    { id: 20, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 4, folio_4: '0006', monto_total: 280, forma_pago: 'efectivo', monto_efectivo: 280, monto_tarjeta: 0, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T14:10:00.000Z` },
    { id: 21, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 3, folio_4: '0007', monto_total: 410, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 410, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T15:00:00.000Z` },
    { id: 22, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 4, folio_4: '0008', monto_total: 165, forma_pago: 'efectivo', monto_efectivo: 165, monto_tarjeta: 0, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T15:45:00.000Z` },
    { id: 23, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 3, folio_4: '0009', monto_total: 330, forma_pago: 'combinado', monto_efectivo: 150, monto_tarjeta: 180, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T16:30:00.000Z` },
  ],

  // CORTES - Ayer (ya cerrados)
  cash_cuts: [
    {
      id: 1, branch_id: 1, fecha: fechaAyer, turno: 'manana', responsable_id: 2,
      total_efectivo_bruto: 745, total_tarjeta: 620, total_vendido: 1365,
      total_gastos: 180, efectivo_final: 565, total_final: 1185,
      efectivo_contado: 560, tarjeta_terminal: 620,
      diferencia_efectivo: -5, diferencia_tarjeta: 0,
      estatus: 'con_diferencia', observaciones: 'Faltante menor en efectivo',
      closed_at: `${fechaAyer}T13:30:00.000Z`, created_at: `${fechaAyer}T08:00:00.000Z`
    },
    {
      id: 2, branch_id: 1, fecha: fechaAyer, turno: 'tarde', responsable_id: 4,
      total_efectivo_bruto: 595, total_tarjeta: 590, total_vendido: 1185,
      total_gastos: 0, efectivo_final: 595, total_final: 1185,
      efectivo_contado: 595, tarjeta_terminal: 590,
      diferencia_efectivo: 0, diferencia_tarjeta: 0,
      estatus: 'cerrado', observaciones: null,
      closed_at: `${fechaAyer}T21:00:00.000Z`, created_at: `${fechaAyer}T14:00:00.000Z`
    }
  ],

  // GASTOS
  branch_expenses: [
    // Gastos de hoy - mañana
    { id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', concepto: 'Leche entera 6L', monto: 96, registrado_por: 2, responsable_gasto: 'María López', observacion: 'Para preparación de pasteles', evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T07:45:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, turno: 'manana', concepto: 'Servilletas de papel (paquete x100)', monto: 45, registrado_por: 3, responsable_gasto: null, observacion: null, evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T08:00:00.000Z` },
    { id: 3, branch_id: 1, fecha: fechaHoy, turno: 'manana', concepto: 'Jabón antibacterial', monto: 38, registrado_por: 2, responsable_gasto: null, observacion: 'Zona de lavado', evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T09:30:00.000Z` },

    // Gastos de hoy - tarde
    { id: 4, branch_id: 1, fecha: fechaHoy, turno: 'tarde', concepto: 'Bolsas para pan dulce (200 piezas)', monto: 85, registrado_por: 4, responsable_gasto: 'Laura Martínez', observacion: null, evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T14:00:00.000Z` },

    // Gastos de ayer - mañana (asociados al corte 1)
    { id: 5, branch_id: 1, fecha: fechaAyer, turno: 'manana', concepto: 'Harina especial pastelería 25kg', monto: 120, registrado_por: 2, responsable_gasto: 'María López', observacion: 'Proveedor: Molinos Fátima', evidencia_url: null, cash_cut_id: 1, created_at: `${fechaAyer}T07:30:00.000Z` },
    { id: 6, branch_id: 1, fecha: fechaAyer, turno: 'manana', concepto: 'Mantequilla sin sal 5kg', monto: 60, registrado_por: 2, responsable_gasto: null, observacion: null, evidencia_url: null, cash_cut_id: 1, created_at: `${fechaAyer}T10:00:00.000Z` },
  ],

  // INCIDENCIAS
  incidents: [
    {
      id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', reportado_por: 2,
      tipo: 'equipo', descripcion: 'La vitrina refrigeradora del exhibidor principal no está manteniendo la temperatura correcta. Los postres se están descongelando.',
      prioridad: 'alta', responsable_id: 1, fecha_compromiso: fechaHoy,
      estatus: 'pendiente', evidencia_url: null,
      created_at: `${fechaHoy}T09:15:00.000Z`, updated_at: `${fechaHoy}T09:15:00.000Z`
    },
    {
      id: 2, branch_id: 1, fecha: fechaHoy, turno: 'manana', reportado_por: 3,
      tipo: 'limpieza', descripcion: 'Se encontró una mancha grande en el piso de la zona de clientes. Se limpió pero queda marca.',
      prioridad: 'baja', responsable_id: 3, fecha_compromiso: null,
      estatus: 'resuelta', evidencia_url: null,
      created_at: `${fechaHoy}T10:30:00.000Z`, updated_at: `${fechaHoy}T11:00:00.000Z`
    },
    {
      id: 3, branch_id: 1, fecha: fechaHoy, turno: 'tarde', reportado_por: 4,
      tipo: 'caja', descripcion: 'La impresora de tickets se atascó 2 veces. Se logró reimprimir los tickets manualmente.',
      prioridad: 'media', responsable_id: 1, fecha_compromiso: fecha2,
      estatus: 'en_proceso', evidencia_url: null,
      created_at: `${fechaHoy}T15:20:00.000Z`, updated_at: `${fechaHoy}T16:00:00.000Z`
    },
    {
      id: 4, branch_id: 1, fecha: fechaAyer, turno: 'manana', reportado_por: 2,
      tipo: 'atencion_cliente', descripcion: 'Un cliente se quejó por demora de 25 minutos en su pedido de pastel personalizado.',
      prioridad: 'media', responsable_id: 2, fecha_compromiso: fechaAyer,
      estatus: 'resuelta', evidencia_url: null,
      created_at: `${fechaAyer}T12:00:00.000Z`, updated_at: `${fechaAyer}T13:00:00.000Z`
    }
  ],

  // MEJORAS
  improvements: [
    {
      id: 1, branch_id: 1, fecha: fechaHoy, propuesto_por: 2,
      categoria: 'procesos_internos',
      descripcion: 'Implementar un sistema de pedidos por WhatsApp para ahorrar tiempo en llamadas telefónicas y tener registro escrito.',
      beneficio: 'Reducir tiempo de atención telefónica en 40%', prioridad: 'alta',
      responsable_id: 1, estatus: 'propuesta', observaciones: null,
      created_at: `${fechaHoy}T11:00:00.000Z`
    },
    {
      id: 2, branch_id: 1, fecha: fechaHoy, propuesto_por: 4,
      categoria: 'limpieza_orden',
      descripcion: 'Colocar etiquetas en todos los contenedores del almacén para facilitar la búsqueda de insumos.',
      beneficio: 'Mejor organización y menor tiempo de búsqueda', prioridad: 'baja',
      responsable_id: 4, estatus: 'en_revision', observaciones: 'Revisar presupuesto para etiquetadora',
      created_at: `${fechaHoy}T14:30:00.000Z`
    },
    {
      id: 3, branch_id: 1, fecha: fechaAyer, propuesto_por: 2,
      categoria: 'capacitacion',
      descripcion: 'Capacitar al personal nuevo en manejo de la vitrina y temperatura de conservación de postres.',
      beneficio: 'Prevenir pérdidas por mal manejo de temperatura', prioridad: 'media',
      responsable_id: 1, estatus: 'aprobada', observaciones: 'Programar para la próxima semana',
      created_at: `${fechaAyer}T10:00:00.000Z`
    }
  ],

  // MOBILIARIO Y EQUIPO
  assets: [
    {
      id: 1, branch_id: 1, nombre: 'Vitrina refrigeradora principal',
      tipo: 'refrigeracion', descripcion: 'No mantiene temperatura. El termostato parece defectuoso. Temperatura sube a 15°C en lugar de 4°C.',
      estado_actual: 'danado', accion_requerida: 'reparar', prioridad: 'alta',
      responsable_id: 1, costo_estimado: 1500, evidencia_url: null,
      estatus: 'en_revision', created_at: `${fechaHoy}T09:20:00.000Z`, updated_at: `${fechaHoy}T10:00:00.000Z`
    },
    {
      id: 2, branch_id: 1, nombre: 'Impresora de tickets térmica',
      tipo: 'equipo', descripcion: 'Se atasca cada 20 tickets aproximadamente. Necesita limpieza de rodillos o reemplazo.',
      estado_actual: 'regular', accion_requerida: 'revisar', prioridad: 'media',
      responsable_id: 1, costo_estimado: 300, evidencia_url: null,
      estatus: 'reportado', created_at: `${fechaHoy}T15:25:00.000Z`, updated_at: `${fechaHoy}T15:25:00.000Z`
    },
    {
      id: 3, branch_id: 1, nombre: 'Sillas de cliente (8 unidades)',
      tipo: 'mobiliario', descripcion: '3 sillas tienen las patas flojas y se mueven. Riesgo de caída para clientes.',
      estado_actual: 'regular', accion_requerida: 'reparar', prioridad: 'baja',
      responsable_id: 4, costo_estimado: 200, evidencia_url: null,
      estatus: 'pendiente', created_at: `${fechaAyer}T16:00:00.000Z`, updated_at: `${fechaAyer}T16:00:00.000Z`
    },
    {
      id: 4, branch_id: 1, nombre: 'Lámpara zona de clientes',
      tipo: 'infraestructura', descripcion: 'La lámpara del centro parpadea intermitentemente.',
      estado_actual: 'regular', accion_requerida: 'revisar', prioridad: 'baja',
      responsable_id: 3, costo_estimado: 150, evidencia_url: null,
      estatus: 'reportado', created_at: `${fecha2}T11:00:00.000Z`, updated_at: `${fecha2}T11:00:00.000Z`
    }
  ],

  // PENDIENTES
  tasks: [
    {
      id: 1, branch_id: 1, titulo: 'Llamar técnico de refrigeración',
      origen_tipo: 'incidencia', origen_id: 1,
      responsable_id: 1, prioridad: 'alta', fecha_compromiso: fechaHoy,
      estatus: 'pendiente', observaciones: 'Técnico disponible hasta las 3pm',
      created_at: `${fechaHoy}T09:30:00.000Z`, updated_at: `${fechaHoy}T09:30:00.000Z`
    },
    {
      id: 2, branch_id: 1, titulo: 'Comprar bombillas LED para lámpara',
      origen_tipo: 'mobiliario', origen_id: 4,
      responsable_id: 3, prioridad: 'baja', fecha_compromiso: fecha2,
      estatus: 'pendiente', observaciones: 'Ir a Home Depot o similar',
      created_at: `${fecha2}T11:30:00.000Z`, updated_at: `${fecha2}T11:30:00.000Z`
    },
    {
      id: 3, branch_id: 1, titulo: 'Programar capacitación de personal',
      origen_tipo: 'mejora', origen_id: 3,
      responsable_id: 1, prioridad: 'media', fecha_compromiso: fecha2,
      estatus: 'en_proceso', observaciones: 'Revisar calendario de todo el personal',
      created_at: `${fechaAyer}T10:30:00.000Z`, updated_at: `${fechaHoy}T08:00:00.000Z`
    },
    {
      id: 4, branch_id: 1, titulo: 'Solicitar presupuesto reparación sillas',
      origen_tipo: 'mobiliario', origen_id: 3,
      responsable_id: 4, prioridad: 'baja', fecha_compromiso: null,
      estatus: 'pendiente', observaciones: null,
      created_at: `${fechaAyer}T16:30:00.000Z`, updated_at: `${fechaAyer}T16:30:00.000Z`
    }
  ],

  activity_logs: []
};

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

console.log('=== BASE DE DATOS CREADA ===');
console.log('');
console.log('USUARIOS:');
console.log('  admin / admin123 (Administrador)');
console.log('  maria / 1234 (Encargado)');
console.log('  juan / 1234 (Operativo)');
console.log('  laura / 1234 (Encargado)');
console.log('');
console.log('DATOS CREADOS:');
console.log(`  - 23 tickets (${fechaAyer} y ${fechaHoy})`);
console.log('  - 2 cortes cerrados (ayer)');
console.log('  - 6 gastos');
console.log('  - 4 incidencias');
console.log('  - 3 mejoras');
console.log('  - 4 mobiliario/equipo');
console.log('  - 4 pendientes');
console.log('');
console.log('RESUMEN HOY (MAÑANA):');
console.log('  8 tickets | Efectivo: $465 | Tarjeta: $595 | Combinado: $580');
console.log('  Gastos: $179');
console.log('');
console.log('RESUMEN HOY (TARDE):');
console.log('  6 tickets | Efectivo: $445 | Tarjeta: $670 | Combinado: $420');
console.log('  Gastos: $85');