const db = require('./connection');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'operativo' CHECK(rol IN ('admin', 'encargado', 'operativo')),
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ticket_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      fecha TEXT NOT NULL,
      turno TEXT NOT NULL CHECK(turno IN ('manana', 'tarde')),
      registrado_por INTEGER NOT NULL,
      folio_4 TEXT NOT NULL,
      monto_total REAL NOT NULL CHECK(monto_total > 0),
      forma_pago TEXT NOT NULL CHECK(forma_pago IN ('efectivo', 'tarjeta', 'combinado')),
      monto_efectivo REAL DEFAULT 0,
      monto_tarjeta REAL DEFAULT 0,
      observaciones TEXT,
      corte_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (registrado_por) REFERENCES users(id),
      FOREIGN KEY (corte_id) REFERENCES cash_cuts(id)
    );

    CREATE TABLE IF NOT EXISTS cash_cuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      fecha TEXT NOT NULL,
      turno TEXT NOT NULL CHECK(turno IN ('manana', 'tarde')),
      responsable_id INTEGER NOT NULL,
      total_efectivo_bruto REAL DEFAULT 0,
      total_tarjeta REAL DEFAULT 0,
      total_vendido REAL DEFAULT 0,
      total_gastos REAL DEFAULT 0,
      efectivo_final REAL DEFAULT 0,
      total_final REAL DEFAULT 0,
      efectivo_contado REAL,
      tarjeta_terminal REAL,
      diferencia_efectivo REAL DEFAULT 0,
      diferencia_tarjeta REAL DEFAULT 0,
      estatus TEXT NOT NULL DEFAULT 'abierto' CHECK(estatus IN ('abierto', 'con_diferencia', 'cerrado')),
      observaciones TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS branch_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      fecha TEXT NOT NULL,
      turno TEXT NOT NULL CHECK(turno IN ('manana', 'tarde')),
      concepto TEXT NOT NULL,
      monto REAL NOT NULL CHECK(monto > 0),
      registrado_por INTEGER NOT NULL,
      responsable_gasto TEXT,
      observacion TEXT,
      evidencia_url TEXT,
      cash_cut_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (registrado_por) REFERENCES users(id),
      FOREIGN KEY (cash_cut_id) REFERENCES cash_cuts(id)
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      fecha TEXT NOT NULL,
      turno TEXT CHECK(turno IN ('manana', 'tarde')),
      reportado_por INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('caja', 'operacion', 'atencion_cliente', 'sistema', 'limpieza', 'equipo', 'otro')),
      descripcion TEXT NOT NULL,
      prioridad TEXT NOT NULL DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta')),
      responsable_id INTEGER,
      fecha_compromiso TEXT,
      estatus TEXT NOT NULL DEFAULT 'pendiente' CHECK(estatus IN ('pendiente', 'en_proceso', 'resuelta', 'cancelada')),
      evidencia_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (reportado_por) REFERENCES users(id),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS improvements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      fecha TEXT NOT NULL,
      propuesto_por INTEGER NOT NULL,
      categoria TEXT NOT NULL CHECK(categoria IN ('eventos', 'atencion_cliente', 'tiempos_atencion', 'procesos_internos', 'limpieza_orden', 'comunicacion_interna', 'capacitacion', 'seguimiento_pendientes', 'reduccion_errores', 'control_diario')),
      descripcion TEXT NOT NULL,
      beneficio TEXT,
      prioridad TEXT NOT NULL DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta')),
      responsable_id INTEGER,
      estatus TEXT NOT NULL DEFAULT 'propuesta' CHECK(estatus IN ('propuesta', 'en_revision', 'aprobada', 'en_proceso', 'implementada', 'descartada')),
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (propuesto_por) REFERENCES users(id),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('mobiliario', 'equipo', 'caja', 'refrigeracion', 'limpieza', 'infraestructura', 'otro')),
      descripcion TEXT NOT NULL,
      estado_actual TEXT NOT NULL DEFAULT 'regular' CHECK(estado_actual IN ('bueno', 'regular', 'danado', 'fuera_servicio', 'requiere_cambio')),
      accion_requerida TEXT NOT NULL CHECK(accion_requerida IN ('revisar', 'reparar', 'renovar', 'comprar', 'dar_baja')),
      prioridad TEXT NOT NULL DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta')),
      responsable_id INTEGER,
      costo_estimado REAL,
      evidencia_url TEXT,
      estatus TEXT NOT NULL DEFAULT 'reportado' CHECK(estatus IN ('reportado', 'en_revision', 'en_proceso', 'resuelto', 'cancelado')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL DEFAULT 1,
      titulo TEXT NOT NULL,
      origen_tipo TEXT CHECK(origen_tipo IN ('incidencia', 'mejora', 'mobiliario', 'corte', 'otro')),
      origen_id INTEGER,
      responsable_id INTEGER NOT NULL,
      prioridad TEXT NOT NULL DEFAULT 'media' CHECK(prioridad IN ('baja', 'media', 'alta')),
      fecha_compromiso TEXT,
      estatus TEXT NOT NULL DEFAULT 'pendiente' CHECK(estatus IN ('pendiente', 'en_proceso', 'terminado', 'cancelado')),
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      accion TEXT NOT NULL,
      descripcion TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    INSERT OR IGNORE INTO branches (id, nombre) VALUES (1, 'Fátima');
  `);

  console.log('Base de datos inicializada correctamente');
}

module.exports = initDatabase;