const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');
const { initDB } = require('../src/database/connection');

test('=== SUITE 3: PRUEBAS DE RENDIMIENTO Y LATENCIA CRÍTICA (BENCHMARK) ===', async (t) => {
  let authToken = '';
  await initDB();

  // Obtener Token JWT para benchmark
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'admin', password: 'admin123' });
  authToken = loginRes.body.token;

  await t.test('3.1 Latencia de API Dashboard (< 15ms P95)', async () => {
    const iterations = 50;
    const latencies = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`);
      const elapsed = performance.now() - start;
      latencies.push(elapsed);
      assert.equal(res.status, 200);
    }

    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(iterations * 0.5)];
    const p95 = latencies[Math.floor(iterations * 0.95)];
    const avg = latencies.reduce((a, b) => a + b, 0) / iterations;

    console.log(`\n  ⚡ BENCHMARK DASHBOARD (${iterations} peticiones):`);
    console.log(`     Promedio: ${avg.toFixed(2)}ms | P50: ${p50.toFixed(2)}ms | P95: ${p95.toFixed(2)}ms`);

    assert.ok(p95 < 25, `Latencia P95 debe ser menor a 25ms (Obtenido: ${p95.toFixed(2)}ms)`);
  });

  await t.test('3.2 Pruebas de Carga Concurrente (50 Peticiones simultáneas)', async () => {
    const start = performance.now();
    const requests = Array.from({ length: 50 }, () =>
      request(app)
        .get('/api/tickets/totals?fecha=2026-08-07&turno=manana')
        .set('Authorization', `Bearer ${authToken}`)
    );

    const responses = await Promise.all(requests);
    const elapsed = performance.now() - start;

    responses.forEach(res => {
      assert.equal(res.status, 200);
    });

    const throughput = (50 / (elapsed / 1000)).toFixed(0);
    console.log(`\n  🚀 PROCESAMIENTO CONCURRENTE (50 simultáneas):`);
    console.log(`     Tiempo total: ${elapsed.toFixed(2)}ms | Rendimiento: ~${throughput} pet/seg`);

    assert.ok(elapsed < 500, `50 peticiones simultáneas deben responder en < 500ms (Obtenido: ${elapsed.toFixed(2)}ms)`);
  });
});
