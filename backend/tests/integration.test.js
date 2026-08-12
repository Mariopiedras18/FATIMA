const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');
const { initDB } = require('../src/database/connection');

test('=== SUITE 2: PRUEBAS DE INTEGRACIÓN HTTP ENDPOINTS (SUPERTEST) ===', async (t) => {
  let authToken = '';

  await initDB();

  await t.test('2.1 GET /api/health - Verificación de Estado del Servidor', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  await t.test('2.2 POST /api/auth/login - Autenticación y Emisión de Token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'admin', password: 'admin123' });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'Debe devolver un token JWT');
    assert.equal(res.body.user.rol, 'admin');
    authToken = res.body.token;
  });

  await t.test('2.3 GET /api/auth/users - Catálogo de Usuarios Autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length > 0);
  });

  await t.test('2.4 POST & GET /api/tickets - Creación y Consulta de Tickets de Venta', async () => {
    const testFecha = '2026-12-25';
    const newTicket = {
      fecha: testFecha,
      turno: 'manana',
      folio_4: '9999',
      monto_total: 350,
      forma_pago: 'efectivo',
      monto_efectivo: 350,
      monto_tarjeta: 0,
      observaciones: 'Ticket de prueba de integración'
    };

    const createRes = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newTicket);

    assert.equal(createRes.status, 200);
    assert.ok(createRes.body.id);

    const getRes = await request(app)
      .get(`/api/tickets?fecha=${testFecha}&turno=manana`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(getRes.status, 200);
    assert.ok(Array.isArray(getRes.body));
    assert.ok(getRes.body.some(t => t.folio_4 === '9999'));
  });

  await t.test('2.5 POST & GET /api/expenses - Registro de Gastos de Sucursal', async () => {
    const testFecha = '2026-12-26';
    const newExpense = {
      fecha: testFecha,
      turno: 'manana',
      concepto: 'Supertest Gasto Integración',
      monto: 75,
      observacion: 'Prueba de integración'
    };

    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newExpense);

    assert.equal(createRes.status, 200);
    assert.ok(createRes.body.id);

    const getRes = await request(app)
      .get(`/api/expenses?fecha=${testFecha}`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(getRes.status, 200);
    assert.ok(getRes.body.some(e => e.concepto === 'Supertest Gasto Integración'));
  });

  await t.test('2.6 POST /api/cuts/preview & POST /api/cuts - Cierre de Caja Primario', async () => {
    const testFecha = '2026-12-27';

    // Insertar ticket para asegurar datos en preview
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fecha: testFecha,
        turno: 'manana',
        folio_4: '8888',
        monto_total: 500,
        forma_pago: 'efectivo',
        monto_efectivo: 500,
        monto_tarjeta: 0
      });

    const previewRes = await request(app)
      .post('/api/cuts/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ fecha: testFecha, turno: 'manana' });

    assert.equal(previewRes.status, 200);
    assert.ok(previewRes.body.efectivo_final !== undefined);

    const cutRes = await request(app)
      .post('/api/cuts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fecha: testFecha,
        turno: 'manana',
        efectivo_contado: Number(previewRes.body.efectivo_final || 500),
        tarjeta_terminal: Number(previewRes.body.tarjeta_bruto || 0),
        observaciones: 'Corte primario test de integración'
      });

    assert.equal(cutRes.status, 200);
    assert.ok(cutRes.body.id);
  });

  await t.test('2.7 POST & GET /api/secondary-cuts - Destinatarios, Vista Previa y Registro de Entrega', async () => {
    const testFecha = '2026-12-28';

    // Crear destinatario
    const recRes = await request(app)
      .post('/api/secondary-cuts/destinatarios')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ nombre: 'Socio Test Integración' });

    assert.equal(recRes.status, 200);
    assert.ok(recRes.body.id);

    // Preview
    const previewRes = await request(app)
      .post('/api/secondary-cuts/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        modalidad: 'dia_especifico',
        fecha: testFecha,
        turno: 'manana',
        tipo_cuenta: 'efectivo'
      });

    assert.equal(previewRes.status, 200);
    assert.ok(previewRes.body.efectivo_restante_disponible !== undefined);

    // Registro
    const createRes = await request(app)
      .post('/api/secondary-cuts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        destinatario_nombre: 'Socio Test Integración',
        modalidad: 'dia_especifico',
        fecha: testFecha,
        turno: 'manana',
        tipo_cuenta: 'efectivo',
        monto_entregado: 50,
        observaciones: 'Entrega de prueba integración'
      });

    assert.equal(createRes.status, 200);
    assert.ok(createRes.body.id);

    // Verificar Auditoría
    const auditRes = await request(app)
      .get('/api/secondary-cuts/audit-logs')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(auditRes.status, 200);
    assert.ok(auditRes.body.some(log => log.detalles.includes('Socio Test Integración')));
  });

  await t.test('2.8 GET /api/reports/ventas & GET /api/dashboard - Indicadores y Reportes', async () => {
    const hoy = new Date().toISOString().split('T')[0];

    const reportRes = await request(app)
      .get(`/api/reports/ventas?desde=${hoy}&hasta=${hoy}`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(reportRes.status, 200);
    assert.ok(Array.isArray(reportRes.body));

    const dashRes = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(dashRes.status, 200);
    assert.ok(dashRes.body.ventas);
  });
});
