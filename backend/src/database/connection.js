const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const file = path.join(dataDir, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, {});

let isInitialized = false;

async function initDB() {
  if (isInitialized && db.data) return db;
  await db.read();
  db.data ||= { 
    users: [], 
    branches: [], 
    ticket_records: [], 
    cash_cuts: [], 
    branch_expenses: [], 
    incidents: [], 
    improvements: [], 
    assets: [], 
    tasks: [], 
    activity_logs: [],
    secondary_cuts: [],
    cut_recipients: []
  };

  if (!db.data.secondary_cuts) db.data.secondary_cuts = [];
  if (!db.data.cut_recipients) db.data.cut_recipients = [];
  if (!db.data.activity_logs) db.data.activity_logs = [];

  if (db.data.cut_recipients.length === 0) {
    db.data.cut_recipients.push(
      { id: 1, nombre: 'Lic. Roberto (Socio)', activo: true, created_at: new Date().toISOString() },
      { id: 2, nombre: 'Mario (Administrador)', activo: true, created_at: new Date().toISOString() },
      { id: 3, nombre: 'Caja Chica / Retiro Principal', activo: true, created_at: new Date().toISOString() }
    );
    await db.write();
  }

  if (!db.data.users || db.data.users.length === 0) {
    const bcrypt = require('bcryptjs');
    db.data.users = [
      { id: 1, nombre: 'Ana García', usuario: 'admin', password: bcrypt.hashSync('admin123', 10), rol: 'admin', activo: true, created_at: new Date().toISOString() }
    ];
    await db.write();
  }

  if (db.data.branches.length === 0) {
    db.data.branches.push({ id: 1, nombre: 'Fátima', activo: true });
    await db.write();
  }

  isInitialized = true;
  return db;
}

// Retorna los datos de memoria en sub-milisegundos sin lecturas de disco repetitivas
async function getDBData() {
  if (!isInitialized || !db.data) {
    await initDB();
  }
  return db.data;
}

// Persiste cambios asíncronamente para máxima velocidad en la API
async function saveDB() {
  return db.write();
}

module.exports = { db, initDB, getDBData, saveDB };