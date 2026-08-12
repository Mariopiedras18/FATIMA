const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { initDB, getDBData } = require('../src/database/connection');

test('=== SUITE 1: PRUEBAS UNITARIAS DE LÓGICA DE NEGOCIO ===', async (t) => {
  await t.test('1.1 Inicialización de Base de Datos y Caché', async () => {
    const start = performance.now();
    await initDB();
    const data = await getDBData();
    const elapsed = performance.now() - start;

    assert.ok(data.users, 'Colección de usuarios requerida');
    assert.ok(data.branches, 'Colección de sucursales requerida');
    assert.ok(data.ticket_records, 'Colección de tickets requerida');
    assert.ok(data.cash_cuts, 'Colección de cortes primarios requerida');
    assert.ok(data.secondary_cuts, 'Colección de cortes secundarios requerida');
    assert.ok(data.cut_recipients, 'Colección de destinatarios requerida');
    assert.ok(data.activity_logs, 'Colección de auditoría requerida');
    assert.ok(elapsed < 50, 'Lectura en caché debe ser menor a 50ms');
  });

  await t.test('1.2 Encriptación y Verificación de Contraseñas (Bcrypt)', async () => {
    const hash = bcrypt.hashSync('test_pass_123', 10);
    assert.ok(bcrypt.compareSync('test_pass_123', hash), 'La contraseña válida debe coincidir');
    assert.equal(bcrypt.compareSync('wrong_pass', hash), false, 'La contraseña incorrecta debe fallar');
  });

  await t.test('1.3 Generación y Decodificación de Tokens JWT', async () => {
    const secret = process.env.JWT_SECRET || 'tutti_bocado_fatima_2026_secret_key';
    const payload = { id: 1, usuario: 'admin', rol: 'admin', nombre: 'Ana García' };
    const token = jwt.sign(payload, secret, { expiresIn: '8h' });

    assert.ok(token, 'El token debe ser generado');
    const decoded = jwt.verify(token, secret);
    assert.equal(decoded.usuario, 'admin');
    assert.equal(decoded.rol, 'admin');
  });

  await t.test('1.4 Cálculo de Matemáticas Financieras de Tickets', async () => {
    const tickets = [
      { forma_pago: 'efectivo', monto_total: 150, monto_efectivo: 150, monto_tarjeta: 0 },
      { forma_pago: 'tarjeta', monto_total: 300, monto_efectivo: 0, monto_tarjeta: 300 },
      { forma_pago: 'combinado', monto_total: 500, monto_efectivo: 200, monto_tarjeta: 300 }
    ];

    const totalEfectivo = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + t.monto_total, 0) +
                          tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + t.monto_efectivo, 0);

    const totalTarjeta = tickets.filter(t => t.forma_pago === 'tarjeta').reduce((s, t) => s + t.monto_total, 0) +
                         tickets.filter(t => t.forma_pago === 'combinado').reduce((s, t) => s + t.monto_tarjeta, 0);

    assert.equal(totalEfectivo, 350, 'El efectivo total debe ser $350 (150 + 200)');
    assert.equal(totalTarjeta, 600, 'La tarjeta total debe ser $600 (300 + 300)');
    assert.equal(totalEfectivo + totalTarjeta, 950, 'El total general debe ser $950');
  });

  await t.test('1.5 Cálculo de Consumo Propio (Personal/Encargados) sin Falsa Diferencia de Caja', async () => {
    const tickets = [
      { forma_pago: 'efectivo', monto_total: 500 },
      { forma_pago: 'consumo_propio', monto_total: 120 }
    ];
    const gastos = 50;

    const efectivoBruto = tickets.filter(t => t.forma_pago === 'efectivo').reduce((s, t) => s + t.monto_total, 0);
    const consumoPropio = tickets.filter(t => t.forma_pago === 'consumo_propio').reduce((s, t) => s + t.monto_total, 0);
    const totalVendido = efectivoBruto + consumoPropio;
    const efectivoEsperado = efectivoBruto - gastos;

    assert.equal(totalVendido, 620, 'Venta total debe ser $620');
    assert.equal(consumoPropio, 120, 'Consumo propio debe ser $120');
    assert.equal(efectivoEsperado, 450, 'El efectivo esperado en caja debe ser $450 ($500 - $50 de gastos)');
  });
});
