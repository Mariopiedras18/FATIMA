const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/connection');
const { auth, adminOnly } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'tutti_bocado_fatima_2026_secret_key';

router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  await db.read();
  const user = db.data.users.find(u => u.usuario === usuario && u.activo);
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = jwt.sign({ id: user.id, nombre: user.nombre, rol: user.rol }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
});

router.get('/users', auth, adminOnly, async (req, res) => {
  await db.read();
  const users = db.data.users.map(({ password, ...u }) => u);
  res.json(users);
});

router.post('/users', auth, adminOnly, async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;
  if (!nombre || !usuario || !password) return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });

  await db.read();
  if (db.data.users.find(u => u.usuario === usuario)) return res.status(400).json({ error: 'El usuario ya existe' });

  const hash = bcrypt.hashSync(password, 10);
  const id = db.data.users.length > 0 ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1;
  db.data.users.push({ id, nombre, usuario, password: hash, rol: rol || 'encargado', activo: true, created_at: new Date().toISOString() });
  await db.write();
  res.json({ id, message: 'Usuario creado' });
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  const { nombre, rol, activo } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (nombre) user.nombre = nombre;
  if (rol) user.rol = rol;
  if (activo !== undefined) user.activo = activo;
  user.updated_at = new Date().toISOString();
  await db.write();
  res.json({ message: 'Usuario actualizado' });
});

module.exports = router;