const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAll, addDoc, nextId, updateDoc, findWhere } = require('../database/firestore');
const { auth, adminOnly } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'tutti_bocado_fatima_2026_secret_key';

router.post('/login', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const users = await getAll('users');
    const user = users.find(u => u.usuario === usuario && u.activo);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, nombre: user.nombre, rol: user.rol }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await getAll('users');
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;
    if (!nombre || !usuario || !password) return res.status(400).json({ error: 'Nombre, usuario y contraseña requeridos' });

    const users = await getAll('users');
    if (users.find(u => u.usuario === usuario)) return res.status(400).json({ error: 'El usuario ya existe' });

    const hash = bcrypt.hashSync(password, 10);
    const id = await nextId('users');
    const newUser = { id, nombre, usuario, password: hash, rol: rol || 'encargado', activo: true, created_at: new Date().toISOString() };
    await addDoc('users', newUser);
    res.json({ id, message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, rol, activo } = req.body;
    const id = parseInt(req.params.id);
    const user = await require('../database/firestore').getById('users', id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const updates = { updated_at: new Date().toISOString() };
    if (nombre !== undefined) updates.nombre = nombre;
    if (rol !== undefined) updates.rol = rol;
    if (activo !== undefined) updates.activo = activo;
    await updateDoc('users', id, updates);
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

module.exports = router;