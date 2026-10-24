const assert = require('assert');
const http = require('http');

// Start backend server on test port 3009
process.env.PORT = '3009';
const server = require('../server/server');

const BASE_URL = 'http://localhost:3009/api';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando pruebas automatizadas del Sistema de Barbería...');

  // 1. Barberos
  console.log('\n--- 1. Barberos ---');
  const resBarberos = await request('GET', '/barberos');
  assert.strictEqual(resBarberos.status, 200);
  assert.ok(resBarberos.data.length > 0, 'Debe haber al menos 1 barbero');
  const barbero = resBarberos.data[0];
  console.log(`✓ Barberos cargados correctamente. Barbero de prueba: ${barbero.nombre} (%: ${barbero.porcentaje_comision})`);

  // 2. Servicios
  console.log('\n--- 2. Servicios ---');
  const resServicios = await request('GET', '/servicios');
  assert.strictEqual(resServicios.status, 200);
  assert.ok(resServicios.data.length > 0, 'Debe haber servicios');
  const servicio = resServicios.data[0];
  console.log(`✓ Servicios cargados correctamente: ${servicio.nombre} ($${servicio.precio_cop} COP, ${servicio.duracion_minutos} min)`);

  // 3. Disponibilidad y Prevención de Solapamientos
  console.log('\n--- 3. Motor de Disponibilidad y Solapamiento ---');
  // Usar fecha futura garantizada en día hábil (Martes donde todos laboran)
  const testFecha = '2026-11-03'; // Martes (Día 2)
  const resDisp1 = await request('GET', `/disponibilidad?barbero_id=${barbero.id}&fecha=${testFecha}&duracion_minutos=${servicio.duracion_minutos}`);
  assert.strictEqual(resDisp1.status, 200);
  assert.ok(resDisp1.data.slots.length > 0, 'Debe generar slots');
  const slotPrueba = resDisp1.data.slots[0];
  assert.strictEqual(slotPrueba.disponible, true, 'El primer slot debe estar disponible');
  console.log(`✓ Slots generados. Slot prueba: ${slotPrueba.hora_inicio} a ${slotPrueba.hora_fin}`);

  // Agendar cita en ese slot
  const resCita1 = await request('POST', '/citas', {
    barbero_id: barbero.id,
    servicio_id: servicio.id,
    cliente_nombre: 'Cliente de Prueba',
    cliente_telefono: '3001112233',
    fecha: testFecha,
    hora_inicio: slotPrueba.hora_inicio,
    notas: 'Turno de prueba'
  });
  assert.strictEqual(resCita1.status, 201);
  const citaId = resCita1.data.id;
  console.log(`✓ Cita agendada con éxito ID ${citaId}`);

  // Verificar que el slot ahora aparece como ocupado
  const resDisp2 = await request('GET', `/disponibilidad?barbero_id=${barbero.id}&fecha=${testFecha}&duracion_minutos=${servicio.duracion_minutos}`);
  const slotOcupado = resDisp2.data.slots.find(s => s.hora_inicio === slotPrueba.hora_inicio);
  assert.strictEqual(slotOcupado.disponible, false, 'El slot debe estar marcado no disponible');
  console.log(`✓ Verificación de bloqueo en tiempo real: Slot ${slotOcupado.hora_inicio} está bloqueado (${slotOcupado.razon})`);

  // Intentar agendar en el mismo horario ocupado -> debe rechazar con 409
  const resColision = await request('POST', '/citas', {
    barbero_id: barbero.id,
    servicio_id: servicio.id,
    cliente_nombre: 'Segundo Cliente Chocando',
    cliente_telefono: '3109998877',
    fecha: testFecha,
    hora_inicio: slotPrueba.hora_inicio
  });
  assert.strictEqual(resColision.status, 409, 'Debe rechazar con código 409 Conflicto');
  console.log(`✓ Rechazo de colisión confirmado: "${resColision.data.error}"`);

  // 4. Bloqueo de Horarios
  console.log('\n--- 4. Bloqueo de Horarios por el Administrador ---');
  const resBloqueo = await request('POST', '/bloqueos', {
    barbero_id: barbero.id,
    fecha: testFecha,
    hora_inicio: '13:00',
    hora_fin: '14:00',
    motivo: 'Almuerzo Barbero'
  });
  assert.strictEqual(resBloqueo.status, 201);
  console.log(`✓ Horario bloqueado 13:00 - 14:00 por motivo de almuerzo`);

  // Verificar que el slot de las 13:00 aparece bloqueado
  const resDispBloqueo = await request('GET', `/disponibilidad?barbero_id=${barbero.id}&fecha=${testFecha}&duracion_minutos=${servicio.duracion_minutos}`);
  const slotAlmuerzo = resDispBloqueo.data.slots.find(s => s.hora_inicio === '13:00');
  assert.strictEqual(slotAlmuerzo.disponible, false);
  assert.ok(slotAlmuerzo.razon.includes('Almuerzo'));
  console.log(`✓ Slot bloqueado correctamente detectado: "${slotAlmuerzo.razon}"`);

  // 5. Costos y Gastos
  console.log('\n--- 5. Registro de Costos ---');
  const resCosto = await request('POST', '/costos', {
    categoria: 'Insumos / Productos',
    descripcion: 'Espuma de afeitar y toallas desechables',
    monto_cop: 45000,
    fecha: testFecha,
    metodo_pago: 'Efectivo',
    notas: 'Factura droguería'
  });
  assert.strictEqual(resCosto.status, 201);
  console.log(`✓ Costo registrado de $45.000 COP`);

  // 6. Liquidación y Pago por Porcentaje
  console.log('\n--- 6. Plantilla de Liquidación y Pago por Porcentaje ---');
  // Marcar la cita creada como completada
  const resCompletar = await request('PATCH', `/citas/${citaId}/estado`, {
    estado: 'completada'
  });
  assert.strictEqual(resCompletar.status, 200);
  console.log(`✓ Cita ${citaId} marcada como 'completada'`);

  // Auditar y previsualizar liquidación
  const resPreview = await request('GET', `/liquidaciones/preview?barbero_id=${barbero.id}&fecha_inicio=${testFecha}&fecha_fin=${testFecha}`);
  assert.strictEqual(resPreview.status, 200);
  assert.strictEqual(resPreview.data.total_servicios, 1);
  assert.strictEqual(resPreview.data.total_bruto, servicio.precio_cop);
  const comisionEsperada = Math.round(servicio.precio_cop * (barbero.porcentaje_comision / 100));
  assert.strictEqual(resPreview.data.monto_comision, comisionEsperada);
  console.log(`✓ Preview de liquidación calculado exacto: Total bruto: $${resPreview.data.total_bruto}, %: ${resPreview.data.porcentaje_aplicado}%, Comisión: $${resPreview.data.monto_comision}`);

  // Registrar y guardar liquidación
  const resGuardarLiq = await request('POST', '/liquidaciones', {
    barbero_id: barbero.id,
    fecha_inicio: testFecha,
    fecha_fin: testFecha,
    porcentaje_aplicado: barbero.porcentaje_comision,
    deducciones: 5000, // deducción de prueba
    metodo_pago: 'Efectivo',
    notas: 'Pago de prueba',
    citas_ids: [citaId]
  });
  assert.strictEqual(resGuardarLiq.status, 201);
  const liquidacionId = resGuardarLiq.data.id;
  console.log(`✓ Liquidación registrada con éxito N° ${liquidacionId}`);

  // Comprobar que si volvemos a consultar preview para esa fecha, ya NO hay citas pendientes (evita doble pago)
  const resPreview2 = await request('GET', `/liquidaciones/preview?barbero_id=${barbero.id}&fecha_inicio=${testFecha}&fecha_fin=${testFecha}`);
  assert.strictEqual(resPreview2.data.total_servicios, 0, 'No debe haber citas pendientes tras liquidar');
  console.log(`✓ Protección contra pagos duplicados confirmada (0 turnos pendientes)`);

  // 7. Reporte de Balance Financiero
  console.log('\n--- 7. Reporte de Balance Financiero ---');
  const resBalance = await request('GET', '/reportes/balance');
  assert.strictEqual(resBalance.status, 200);
  console.log(`✓ Balance General:`);
  console.log(`   - Total Ingresos Brutos: $${resBalance.data.total_ingresos} COP`);
  console.log(`   - Comisiones Barberos: $${resBalance.data.total_comisiones_pagadas} COP`);
  console.log(`   - Costos Operativos: $${resBalance.data.total_costos_operativos} COP`);
  console.log(`   - Beneficio Neto: $${resBalance.data.ganancia_neta} COP`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
