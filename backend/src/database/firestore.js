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

        function saveToFile() {
          try { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8'); } catch (e) { console.error('Error guardando db.json:', e.message); }
        }

        db = {
          _data: data,
          _save: saveToFile,
          collection: (col) => {
            const chainObj = {
              _col: col,
              _filters: [],
              _orderField: null,
              _orderDir: 'asc',
              _limitN: null,
              where(field, op, value) {
                chainObj._filters.push({ field, op, value });
                return chainObj;
              },
              orderBy(field, dir) {
                chainObj._orderField = field;
                chainObj._orderDir = dir || 'asc';
                return chainObj;
              },
              limit(n) {
                chainObj._limitN = n;
                return chainObj;
              },
              async get() {
                if (!data[col]) data[col] = [];
                let docs = [...data[col]];
                for (const f of chainObj._filters) {
                  docs = docs.filter(d => {
                    if (f.op === '==') return d[f.field] === f.value;
                    if (f.op === '!=') return d[f.field] !== f.value;
                    if (f.op === '<') return d[f.field] < f.value;
                    if (f.op === '<=') return d[f.field] <= f.value;
                    if (f.op === '>') return d[f.field] > f.value;
                    if (f.op === '>=') return d[f.field] >= f.value;
                    return true;
                  });
                }
                if (chainObj._orderField) {
                  const dir = chainObj._orderDir === 'desc' ? -1 : 1;
                  docs.sort((a, b) => ((a[chainObj._orderField] || 0) > (b[chainObj._orderField] || 0) ? dir : -dir));
                }
                if (chainObj._limitN !== null) docs = docs.slice(0, chainObj._limitN);
                const result = docs.map((item, idx) => ({
                  data: () => item,
                  id: String(item.id || idx + 1)
                }));
                return { docs: result, empty: result.length === 0 };
              },
              doc(id) {
                return {
                  _col: col,
                  _id: String(id),
                  async get() {
                    if (!data[col]) data[col] = [];
                    const item = data[col].find((d) => String(d.id) === String(id));
                    return { exists: !!item, data: () => item };
                  },
                  async set(docData) {
                    if (!data[col]) data[col] = [];
                    const idx = data[col].findIndex((d) => String(d.id) === String(id));
                    if (idx >= 0) data[col][idx] = { ...data[col][idx], ...docData };
                    else data[col].push(docData);
                    saveToFile();
                  },
                  async update(updates) {
                    if (!data[col]) data[col] = [];
                    const idx = data[col].findIndex((d) => String(d.id) === String(id));
                    if (idx >= 0) { data[col][idx] = { ...data[col][idx], ...updates }; saveToFile(); }
                  },
                  async delete() {
                    if (!data[col]) data[col] = [];
                    data[col] = data[col].filter((d) => String(d.id) !== String(id));
                    saveToFile();
                  }
                };
              }
            };
            return chainObj;
          },
          batch: () => {
            const ops = [];
            return {
              update(ref, updates) {
                ops.push({ col: ref._col, id: ref._id, updates });
              },
              set(ref, docData) {
                ops.push({ col: ref._col, id: ref._id, docData, isSet: true });
              },
              async commit() {
                for (const op of ops) {
                  if (!data[op.col]) data[op.col] = [];
                  const idx = data[op.col].findIndex(d => String(d.id) === String(op.id));
                  if (op.isSet) {
                    if (idx >= 0) data[op.col][idx] = { ...data[op.col][idx], ...op.docData };
                    else data[op.col].push(op.docData);
                  } else if (idx >= 0) {
                    data[op.col][idx] = { ...data[op.col][idx], ...op.updates };
                  }
                }
                saveToFile();
              }
            };
          }
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
