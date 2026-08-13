const admin = require('firebase-admin');

let db;
let isInitialized = false;

function initFirestore() {
  if (isInitialized) return;

  // Attempt Firebase initialization
  if (!admin.apps || !admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountJson, 'base64').toString('utf8')
      );
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      // No service account provided – fall back to local JSON DB
      const path = require('path');
      const fs = require('fs');
      const dataPath = path.resolve(__dirname, '../../data/db.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(raw);
        db = {
          collection: (col) => ({
            async get() {
              const docs = (data[col] || []).map((item, idx) => ({
                data: () => item,
                id: String(item.id || idx + 1)
              }));
              return { docs, empty: docs.length === 0 };
            },
            doc: (id) => ({
              async get() {
                const colData = data[col] || [];
                const item = colData.find((d) => String(d.id) === id);
                return { exists: !!item, data: () => item };
              },
              async set() { /* no‑op fallback */ },
              async update() { /* no‑op fallback */ },
              async delete() { /* no‑op fallback */ }
            })
          })
        };
        isInitialized = true;
        console.log('✅ Fallback DB loaded from data/db.json');
        return db;
      }
      // If no fallback file, initialize empty admin app (will likely fail later)
      admin.initializeApp();
    }
  }

  // If Firebase initialized (or admin app created), use real Firestore
  db = admin.firestore();
  isInitialized = true;
  console.log('✅ Firestore conectado correctamente');
  return db;
}

function getFirestore() {
  if (!db) initFirestore();
  return db;
}

// ─── Helpers para seed inicial ───────────────────────────────────────────────

async function seedInitialData() {
  const firestore = getFirestore();
  const bcrypt = require('bcryptjs');

  // Usuarios
  const usersCol = firestore.collection('users');
  const usersSnap = await usersCol.get();
  if (usersSnap.empty) {
    await usersCol.doc('1').set({
      id: 1,
      nombre: 'Ana García',
      usuario: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      rol: 'admin',
      activo: true,
      created_at: new Date().toISOString()
    });
    console.log('✅ Usuario admin creado');
  }

  // Sucursal
  const branchesCol = firestore.collection('branches');
  const branchSnap = await branchesCol.get();
  if (branchSnap.empty) {
    await branchesCol.doc('1').set({ id: 1, nombre: 'Fátima', activo: true });
    console.log('✅ Sucursal Fátima creada');
  }

  // Destinatarios de cortes
  const recipientsCol = firestore.collection('cut_recipients');
  const recipientsSnap = await recipientsCol.get();
  if (recipientsSnap.empty) {
    const defaults = [
      { id: 1, nombre: 'Lic. Roberto (Socio)', activo: true, created_at: new Date().toISOString() },
      { id: 2, nombre: 'Mario (Administrador)', activo: true, created_at: new Date().toISOString() },
      { id: 3, nombre: 'Caja Chica / Retiro Principal', activo: true, created_at: new Date().toISOString() }
    ];
    for (const r of defaults) {
      await recipientsCol.doc(String(r.id)).set(r);
    }
    console.log('✅ Destinatarios predeterminados creados');
  }
}

// ─── Utilidades CRUD genéricas ────────────────────────────────────────────────

/**
 * Obtiene todos los documentos de una colección como array.
 * @param {string} colName 
 * @returns {Promise<Array>}
 */
async function getAll(colName) {
  const snap = await getFirestore().collection(colName).get();
  return snap.docs.map(d => d.data());
}

/**
 * Obtiene el siguiente ID numérico autoincremental.
 * @param {string} colName 
 * @returns {Promise<number>}
 */
async function nextId(colName) {
  const snap = await getFirestore().collection(colName).orderBy('id', 'desc').limit(1).get();
  if (snap.empty) return 1;
  return (snap.docs[0].data().id || 0) + 1;
}

/**
 * Agrega un documento con id numérico.
 * @param {string} colName 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
async function addDoc(colName, data) {
  await getFirestore().collection(colName).doc(String(data.id)).set(data);
  return data;
}

/**
 * Actualiza campos de un documento por id numérico.
 * @param {string} colName 
 * @param {number} id 
 * @param {Object} updates 
 */
async function updateDoc(colName, id, updates) {
  await getFirestore().collection(colName).doc(String(id)).update(updates);
}

/**
 * Elimina un documento por id numérico.
 * @param {string} colName 
 * @param {number} id 
 */
async function deleteDoc(colName, id) {
  await getFirestore().collection(colName).doc(String(id)).delete();
}

/**
 * Obtiene un documento por id numérico.
 * @param {string} colName 
 * @param {number} id 
 * @returns {Promise<Object|null>}
 */
async function getById(colName, id) {
  const snap = await getFirestore().collection(colName).doc(String(id)).get();
  return snap.exists ? snap.data() : null;
}

/**
 * Busca documentos que cumplan un filtro simple {campo: valor}.
 * @param {string} colName 
 * @param {Object} filters 
 * @returns {Promise<Array>}
 */
async function findWhere(colName, filters) {
  let query = getFirestore().collection(colName);
  for (const [field, value] of Object.entries(filters)) {
    query = query.where(field, '==', value);
  }
  const snap = await query.get();
  return snap.docs.map(d => d.data());
}

module.exports = {
  initFirestore,
  getFirestore,
  seedInitialData,
  getAll,
  nextId,
  addDoc,
  updateDoc,
  deleteDoc,
  getById,
  findWhere
};
