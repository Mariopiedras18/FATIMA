const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'db.json');

// Fechas dinámicas para la semilla
const hoy = new Date();
const fechaHoy = hoy.toISOString().split('T')[0];

const dia1 = new Date(hoy); dia1.setDate(dia1.getDate() - 1);
const fechaAyer = dia1.toISOString().split('T')[0];

const dia2 = new Date(hoy); dia2.setDate(dia2.getDate() - 2);
const fecha2Dias = dia2.toISOString().split('T')[0];

const dia3 = new Date(hoy); dia3.setDate(dia3.getDate() - 3);
const fecha3Dias = dia3.toISOString().split('T')[0];

const passwordAdmin = bcrypt.hashSync('admin123', 10);
const passwordUser = bcrypt.hashSync('1234', 10);

const seedData = {
  users: [
    { id: 1, nombre: 'Ana García', usuario: 'admin', password: passwordAdmin, rol: 'admin', activo: true, created_at: '2026-07-01T08:00:00.000Z' }
  ],
  branches: [
    { id: 1, nombre: 'Fátima', activo: true }
  ],
  cut_recipients: [
    { id: 1, nombre: 'Lic. Roberto (Socio)', activo: true, created_at: '2026-07-01T08:00:00.000Z' },
    { id: 2, nombre: 'Mario (Administrador)', activo: true, created_at: '2026-07-01T08:00:00.000Z' },
    { id: 3, nombre: 'Caja Chica / Fondo Principal', activo: true, created_at: '2026-07-01T08:00:00.000Z' },
    { id: 4, nombre: 'Depósito Bancario Santander', activo: true, created_at: '2026-07-05T08:00:00.000Z' }
  ],

  // TICKETS RECIENTES (HOY, AYER, ANTEAYER)
  ticket_records: [
    // HOY - MAÑANA (Pendientes de corte)
    { id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0101', monto_total: 250, forma_pago: 'efectivo', monto_efectivo: 250, monto_tarjeta: 0, observaciones: '2 pasteles chicos', corte_id: null, created_at: `${fechaHoy}T08:15:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0102', monto_total: 420, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 420, observaciones: 'Pago con BBVA', corte_id: null, created_at: `${fechaHoy}T08:45:00.000Z` },
    { id: 3, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0103', monto_total: 680, forma_pago: 'combinado', monto_efectivo: 380, monto_tarjeta: 300, observaciones: 'Pedido mesa 4', corte_id: null, created_at: `${fechaHoy}T09:30:00.000Z` },
    { id: 4, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 3, folio_4: '0104', monto_total: 150, forma_pago: 'efectivo', monto_efectivo: 150, monto_tarjeta: 0, observaciones: null, corte_id: null, created_at: `${fechaHoy}T10:20:00.000Z` },
    { id: 5, branch_id: 1, fecha: fechaHoy, turno: 'manana', registrado_por: 2, folio_4: '0105', monto_total: 310, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 310, observaciones: null, corte_id: null, created_at: `${fechaHoy}T11:10:00.000Z` },

    // AYER - MAÑANA (Corte 1)
    { id: 6, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 2, folio_4: '0080', monto_total: 350, forma_pago: 'efectivo', monto_efectivo: 350, monto_tarjeta: 0, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T08:30:00.000Z` },
    { id: 7, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 3, folio_4: '0081', monto_total: 500, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 500, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T09:15:00.000Z` },
    { id: 8, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 2, folio_4: '0082', monto_total: 900, forma_pago: 'combinado', monto_efectivo: 500, monto_tarjeta: 400, observaciones: 'Banquete empresa', corte_id: 1, created_at: `${fechaAyer}T10:40:00.000Z` },
    { id: 9, branch_id: 1, fecha: fechaAyer, turno: 'manana', registrado_por: 3, folio_4: '0083', monto_total: 210, forma_pago: 'efectivo', monto_efectivo: 210, monto_tarjeta: 0, observaciones: null, corte_id: 1, created_at: `${fechaAyer}T11:50:00.000Z` },

    // AYER - TARDE (Corte 2)
    { id: 10, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 4, folio_4: '0084', monto_total: 450, forma_pago: 'efectivo', monto_efectivo: 450, monto_tarjeta: 0, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T14:20:00.000Z` },
    { id: 11, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 3, folio_4: '0085', monto_total: 620, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 620, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T16:10:00.000Z` },
    { id: 12, branch_id: 1, fecha: fechaAyer, turno: 'tarde', registrado_por: 4, folio_4: '0086', monto_total: 300, forma_pago: 'efectivo', monto_efectivo: 300, monto_tarjeta: 0, observaciones: null, corte_id: 2, created_at: `${fechaAyer}T18:00:00.000Z` },

    // HACE 2 DÍAS - DÍA COMPLETO (Corte 3)
    { id: 13, branch_id: 1, fecha: fecha2Dias, turno: 'manana', registrado_por: 2, folio_4: '0060', monto_total: 1200, forma_pago: 'efectivo', monto_efectivo: 1200, monto_tarjeta: 0, observaciones: 'Ventas mañana', corte_id: 3, created_at: `${fecha2Dias}T10:00:00.000Z` },
    { id: 14, branch_id: 1, fecha: fecha2Dias, turno: 'tarde', registrado_por: 4, folio_4: '0061', monto_total: 1500, forma_pago: 'tarjeta', monto_efectivo: 0, monto_tarjeta: 1500, observaciones: 'Ventas tarde', corte_id: 3, created_at: `${fecha2Dias}T17:00:00.000Z` }
  ],

  // GASTOS DE SUCURSAL
  branch_expenses: [
    { id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', concepto: 'Compra de 10L Leche Entera', monto: 180, registrado_por: 2, responsable_gasto: 'María López', observacion: 'Requisición de cocina', evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T07:45:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, turno: 'manana', concepto: 'Paquete de bolsas térmicas', monto: 65, registrado_por: 3, responsable_gasto: null, observacion: null, evidencia_url: null, cash_cut_id: null, created_at: `${fechaHoy}T09:10:00.000Z` },
    { id: 3, branch_id: 1, fecha: fechaAyer, turno: 'manana', concepto: 'Insumos de limpieza', monto: 120, registrado_por: 2, responsable_gasto: 'María López', observacion: 'Jabón y cloro', evidencia_url: null, cash_cut_id: 1, created_at: `${fechaAyer}T08:00:00.000Z` },
    { id: 4, branch_id: 1, fecha: fechaAyer, turno: 'tarde', concepto: 'Gas LP recarga', monto: 250, registrado_por: 4, responsable_gasto: 'Laura Martínez', observacion: 'Tanque auxiliar', evidencia_url: null, cash_cut_id: 2, created_at: `${fechaAyer}T15:00:00.000Z` },
    { id: 5, branch_id: 1, fecha: fecha2Dias, turno: 'manana', concepto: 'Reparación chapa puerta', monto: 200, registrado_por: 2, responsable_gasto: null, observacion: 'Servicio cerrajero', evidencia_url: null, cash_cut_id: 3, created_at: `${fecha2Dias}T11:00:00.000Z` }
  ],

  // CORTES DE CAJA PRIMARIOS (CIERRES DIARIOS / TURNO)
  cash_cuts: [
    {
      id: 1, branch_id: 1, fecha: fechaAyer, turno: 'manana', responsable_id: 2,
      total_efectivo_bruto: 1060, total_tarjeta: 900, total_vendido: 1960,
      total_gastos: 120, efectivo_final: 940, total_final: 1840,
      efectivo_contado: 940, tarjeta_terminal: 900,
      diferencia_efectivo: 0, diferencia_tarjeta: 0,
      estatus: 'cerrado', observaciones: 'Cierre cuadrado perfecto',
      hora_cierre: '13:30', closed_at: `${fechaAyer}T13:30:00.000Z`, created_at: `${fechaAyer}T13:30:00.000Z`
    },
    {
      id: 2, branch_id: 1, fecha: fechaAyer, turno: 'tarde', responsable_id: 4,
      total_efectivo_bruto: 750, total_tarjeta: 620, total_vendido: 1370,
      total_gastos: 250, efectivo_final: 500, total_final: 1120,
      efectivo_contado: 500, tarjeta_terminal: 620,
      diferencia_efectivo: 0, diferencia_tarjeta: 0,
      estatus: 'cerrado', observaciones: null,
      hora_cierre: '21:00', closed_at: `${fechaAyer}T21:00:00.000Z`, created_at: `${fechaAyer}T21:00:00.000Z`
    },
    {
      id: 3, branch_id: 1, fecha: fecha2Dias, turno: 'manana', responsable_id: 2,
      total_efectivo_bruto: 1200, total_tarjeta: 1500, total_vendido: 2700,
      total_gastos: 200, efectivo_final: 1000, total_final: 2500,
      efectivo_contado: 1000, tarjeta_terminal: 1500,
      diferencia_efectivo: 0, diferencia_tarjeta: 0,
      estatus: 'cerrado', observaciones: 'Turno sin incidencias',
      hora_cierre: '14:00', closed_at: `${fecha2Dias}T14:00:00.000Z`, created_at: `${fecha2Dias}T14:00:00.000Z`
    }
  ],

  // CORTES SECUNDARIOS (ENTREGAS DE FONDOS EN EFECTIVO)
  secondary_cuts: [
    {
      id: 1, branch_id: 1, destinatario_nombre: 'Lic. Roberto (Socio)',
      modalidad: 'dia_especifico', fecha_corte: fechaAyer, turno: 'manana',
      tipo_cuenta: 'efectivo', monto_entregado: 600,
      observaciones: 'Retiro parcial de utilidad del turno mañana',
      registrado_por: 1, registrado_por_nombre: 'Ana García',
      created_at: `${fechaAyer}T14:00:00.000Z`
    },
    {
      id: 2, branch_id: 1, destinatario_nombre: 'Mario (Administrador)',
      modalidad: 'dia_especifico', fecha_corte: fechaAyer, turno: 'tarde',
      tipo_cuenta: 'efectivo', monto_entregado: 500,
      observaciones: 'Entrega de efectivo al cierre de la tarde',
      registrado_por: 1, registrado_por_nombre: 'Ana García',
      created_at: `${fechaAyer}T21:15:00.000Z`
    },
    {
      id: 3, branch_id: 1, destinatario_nombre: 'Depósito Bancario Santander',
      modalidad: 'dia_especifico', fecha_corte: fecha2Dias, turno: 'manana',
      tipo_cuenta: 'efectivo', monto_entregado: 1000,
      observaciones: 'Fondo enviado a depósito bancario en efectivo',
      registrado_por: 1, registrado_por_nombre: 'Ana García',
      created_at: `${fecha2Dias}T15:00:00.000Z`
    }
  ],

  // BITÁCORA DE AUDITORÍA (ACTIVITY LOGS)
  activity_logs: [
    {
      id: 1, usuario_id: 1, usuario_nombre: 'Ana García',
      accion: 'CREAR_CORTE_SECUNDARIO', entidad: 'secondary_cuts', entidad_id: 1,
      detalles: `Entrega de Efectivo #1 por $600.00 a Lic. Roberto (Socio). Periodo: Día ${fechaAyer} (Turno: manana)`,
      timestamp: `${fechaAyer}T14:00:00.000Z`
    },
    {
      id: 2, usuario_id: 1, usuario_nombre: 'Ana García',
      accion: 'CREAR_CORTE_SECUNDARIO', entidad: 'secondary_cuts', entidad_id: 2,
      detalles: `Entrega de Efectivo #2 por $500.00 a Mario (Administrador). Periodo: Día ${fechaAyer} (Turno: tarde)`,
      timestamp: `${fechaAyer}T21:15:00.000Z`
    },
    {
      id: 3, usuario_id: 1, usuario_nombre: 'Ana García',
      accion: 'CREAR_CORTE_SECUNDARIO', entidad: 'secondary_cuts', entidad_id: 3,
      detalles: `Entrega de Efectivo #3 por $1,000.00 a Depósito Bancario Santander. Periodo: Día ${fecha2Dias} (Turno: manana)`,
      timestamp: `${fecha2Dias}T15:00:00.000Z`
    }
  ],

  // INCIDENCIAS Y TAREAS
  incidents: [
    { id: 1, branch_id: 1, fecha: fechaAyer, tipo: 'falla_equipo', descripcion: 'Molinillo de café presentó un ruido inusual', prioridad: 'media', registrado_por: 2, registrado_por_nombre: 'María López', responsable_id: 1, responsable_nombre: 'Ana García', estatus: 'resuelta', resolucion: 'Se ajustaron las muelas del molino', created_at: `${fechaAyer}T09:00:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, tipo: 'diferencia_caja', descripcion: 'Faltante ligero de $15 en cambio', prioridad: 'baja', registrado_por: 3, registrado_por_nombre: 'Juan Pérez', responsable_id: 2, responsable_nombre: 'María López', estatus: 'en_proceso', resolucion: null, created_at: `${fechaHoy}T11:00:00.000Z` }
  ],

  improvements: [
    { id: 1, branch_id: 1, fecha: fechaAyer, propuesta: 'Implementar código QR en barras para agilizar cobranza', area: 'caja', impact_esperado: 'Reducir tiempos de fila un 25%', estatus: 'aprobada', registrado_por: 2, registrado_por_nombre: 'María López', created_at: `${fechaAyer}T10:00:00.000Z` }
  ],

  assets: [
    { id: 1, branch_id: 1, nombre: 'Terminal Punto de Venta PAX', codigo: 'EQU-001', estatus: 'operativo', ubicado_en: 'Caja Principal' },
    { id: 2, branch_id: 1, nombre: 'Cafetera Espresso 2 Grupos', codigo: 'EQU-002', estatus: 'operativo', ubicado_en: 'Barra' },
    { id: 3, branch_id: 1, nombre: 'Refrigerador Vertical Exhibidor', codigo: 'EQU-003', estatus: 'operativo', ubicado_en: 'Mostrador' }
  ],

  tasks: [
    { id: 1, branch_id: 1, fecha: fechaHoy, turno: 'manana', titulo: 'Conteo de inventario de panadería', asignado_a: 3, asignado_a_nombre: 'Juan Pérez', completada: true, created_at: `${fechaHoy}T07:30:00.000Z` },
    { id: 2, branch_id: 1, fecha: fechaHoy, turno: 'tarde', titulo: 'Limpieza profunda de filtros de café', asignado_a: 4, asignado_a_nombre: 'Laura Martínez', completada: false, created_at: `${fechaHoy}T14:00:00.000Z` }
  ]
};

// Guardar semilla en db.json
fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2), 'utf-8');
console.log('✅ ¡Semilla de datos cargada con éxito en backend/data/db.json!');