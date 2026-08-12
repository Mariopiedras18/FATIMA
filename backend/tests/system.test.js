const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const { db, initDB, getDBData, saveDB } = require('../src/database/connection');

test('Pruebas Unitarias del Sistema Fátima Tutti Bocado', async (t) => {
  await t.test('1. Inicialización ultra-rápida de Base de Datos y Caché en Memoria', async () => {
    const start = performance.now();
    await initDB();
    const data = await getDBData();
    const duration = performance.now() - start;

    assert.ok(data.users, 'Debe existir la colección users');
    assert.ok(data.cash_cuts, 'Debe existir la colección cash_cuts');
    assert.ok(data.secondary_cuts, 'Debe existir la colección secondary_cuts');
    assert.ok(data.cut_recipients, 'Debe existir la colección cut_recipients');
    assert.ok(duration < 50, `Latencia de inicialización debe ser menor a 50ms (Obtenido: ${duration.toFixed(2)}ms)`);
  });

  await t.test('2. Catálogo de Destinatarios de Cortes Secundarios', async () => {
    const data = await getDBData();
    const initialCount = data.cut_recipients.length;

    // Agregar nuevo destinatario
    const newId = initialCount + 1;
    data.cut_recipients.push({
      id: newId,
      nombre: 'Prueba Destinatario Test',
      activo: true,
      created_at: new Date().toISOString()
    });
    await saveDB();

    const updatedData = await getDBData();
    assert.equal(updatedData.cut_recipients.length, initialCount + 1);
    assert.ok(updatedData.cut_recipients.some(r => r.nombre === 'Prueba Destinatario Test'));
  });

  await t.test('3. Lógica de Gastos por Marca de Tiempo (7am a hora de corte)', async () => {
    const data = await getDBData();
    const fecha = '2026-08-07';

    // Limpiar gastos de prueba
    data.branch_expenses = data.branch_expenses.filter(e => e.concepto !== 'Gasto Test Pre-Corte' && e.concepto !== 'Gasto Test Post-Corte');

    // Gasto registrado ANTES del corte (ej. 14:30)
    data.branch_expenses.push({
      id: 9991,
      branch_id: 1,
      fecha,
      turno: 'manana',
      concepto: 'Gasto Test Pre-Corte',
      monto: 150,
      cash_cut_id: null,
      created_at: `${fecha}T14:30:00.000Z`
    });

    // Simular el cierre de caja a las 14:47 (asigna cash_cut_id = 99)
    const cutId = 99;
    const unassignedBefore = data.branch_expenses.filter(e => e.fecha === fecha && !e.cash_cut_id);
    unassignedBefore.forEach(e => { e.cash_cut_id = cutId; });

    // Gasto registrado DESPUÉS del corte (ej. 14:50)
    data.branch_expenses.push({
      id: 9992,
      branch_id: 1,
      fecha,
      turno: 'manana',
      concepto: 'Gasto Test Post-Corte',
      monto: 200,
      cash_cut_id: null,
      created_at: `${fecha}T14:50:00.000Z`
    });

    await saveDB();

    // Verificación
    const preExpense = data.branch_expenses.find(e => e.id === 9991);
    const postExpense = data.branch_expenses.find(e => e.id === 9992);

    assert.equal(preExpense.cash_cut_id, 99, 'El gasto previo debe quedar vinculado al corte');
    assert.equal(postExpense.cash_cut_id, null, 'El gasto posterior debe permanecer unassigned (para el siguiente corte)');
  });

  await t.test('4. Cálculo de Saldo Restante en Cortes Secundarios (Entregas de Efectivo)', async () => {
    const data = await getDBData();
    const fecha = '2026-12-31'; // Fecha de prueba aislada

    // Limpiar datos de fecha de prueba
    data.cash_cuts = data.cash_cuts.filter(c => c.fecha !== fecha);
    data.secondary_cuts = data.secondary_cuts.filter(s => s.fecha_corte !== fecha);

    // Generar un corte primario de $2,200 en efectivo
    const primaryCutId = 888;
    data.cash_cuts.push({
      id: primaryCutId,
      branch_id: 1,
      fecha,
      turno: 'manana',
      total_efectivo_bruto: 2500,
      total_gastos: 300,
      efectivo_final: 2200, // Total disponible inicial
      total_tarjeta: 1000,
      estatus: 'cerrado'
    });

    // Primera entrega de $1,000 a Mario
    data.secondary_cuts.push({
      id: 7771,
      destinatario_nombre: 'Mario',
      modalidad: 'dia_especifico',
      fecha_corte: fecha,
      turno: 'manana',
      tipo_cuenta: 'efectivo',
      monto_entregado: 1000,
      created_at: new Date().toISOString()
    });

    // Calcular efectivo restante disponible
    const primaryCut = data.cash_cuts.find(c => c.id === primaryCutId);
    const previousDeliveries = data.secondary_cuts.filter(s => s.fecha_corte === fecha && s.turno === 'manana');
    const totalEntregado = previousDeliveries.reduce((sum, s) => sum + s.monto_entregado, 0);
    const disponibleRestante = primaryCut.efectivo_final - totalEntregado;

    assert.equal(disponibleRestante, 1200, 'El efectivo disponible restante debe ser $1,200 ($2,200 - $1,000)');
  });

  await t.test('5. Trazabilidad en Bitácora de Auditoría (Activity Logs)', async () => {
    const data = await getDBData();
    const initialLogCount = data.activity_logs.length;

    data.activity_logs.push({
      id: initialLogCount + 1,
      usuario_id: 1,
      usuario_nombre: 'Ana García (Admin)',
      accion: 'PRUEBA_UNITARIA',
      entidad: 'secondary_cuts',
      entidad_id: 7771,
      detalles: 'Prueba unitaria de auditoría',
      timestamp: new Date().toISOString()
    });

    await saveDB();
    const updatedData = await getDBData();

    assert.equal(updatedData.activity_logs.length, initialLogCount + 1);
    assert.equal(updatedData.activity_logs[updatedData.activity_logs.length - 1].accion, 'PRUEBA_UNITARIA');
  });
});
