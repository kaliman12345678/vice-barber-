const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Directorio para almacenar imágenes y videos subidos por el usuario
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configuración de Multer para carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 60 * 1024 * 1024 } // Hasta 60MB por video o foto
});

// Endpoint para subir archivos multimedia desde celular o PC
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// Servir frontend compilado si existe la carpeta client/dist
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Helper para convertir HH:mm a minutos desde las 00:00
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper para convertir minutos a HH:mm
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Helper para verificar solapamiento entre dos intervalos [inicio1, fin1] y [inicio2, fin2]
function checkOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// ----------------------------------------------------
// 1. CONFIGURACIÓN Y AUTENTICACIÓN
// ----------------------------------------------------
app.get('/api/configuracion', (req, res) => {
  try {
    const rows = db.prepare('SELECT clave, valor FROM configuracion').all();
    const config = {};
    rows.forEach(r => {
      // No exponer el pin_admin directamente
      if (r.clave !== 'pin_admin') {
        config[r.clave] = r.valor;
      }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;
  try {
    const row = db.prepare('SELECT valor FROM configuracion WHERE clave = ?').get('pin_admin');
    const masterPin = row ? row.valor : '1234';
    if (String(pin).trim() === String(masterPin).trim()) {
      res.json({ success: true, token: 'auth-admin-session-token' });
    } else {
      res.status(401).json({ success: false, message: 'PIN incorrecto' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/configuracion', (req, res) => {
  const { nombre_barberia, telefono_barberia, direccion_barberia, pin_admin } = req.body;
  try {
    const update = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');
    if (nombre_barberia) update.run('nombre_barberia', nombre_barberia);
    if (telefono_barberia) update.run('telefono_barberia', telefono_barberia);
    if (direccion_barberia) update.run('direccion_barberia', direccion_barberia);
    if (pin_admin) update.run('pin_admin', pin_admin);
    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. BARBEROS
// ----------------------------------------------------
app.get('/api/barberos', (req, res) => {
  try {
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM barberos ORDER BY nombre ASC'
      : 'SELECT * FROM barberos WHERE activo = 1 ORDER BY nombre ASC';
    const barberos = db.prepare(query).all();
    res.json(barberos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/barberos', (req, res) => {
  const { nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  try {
    const stmt = db.prepare(`
      INSERT INTO barberos (nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      nombre,
      telefono || '',
      foto_url || '',
      porcentaje_comision !== undefined ? Number(porcentaje_comision) : 50.0,
      horario_inicio || '09:00',
      horario_fin || '20:00',
      dias_laborales || '1,2,3,4,5,6'
    );
    res.json({ id: result.lastInsertRowid, message: 'Barbero agregado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE barberos 
      SET nombre = COALESCE(?, nombre),
          telefono = COALESCE(?, telefono),
          foto_url = COALESCE(?, foto_url),
          porcentaje_comision = COALESCE(?, porcentaje_comision),
          horario_inicio = COALESCE(?, horario_inicio),
          horario_fin = COALESCE(?, horario_fin),
          dias_laborales = COALESCE(?, dias_laborales),
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo, id);
    res.json({ success: true, message: 'Barbero actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/barberos/:id', (req, res) => {
  const { id } = req.params;
  try {
    // Si tiene citas registradas, desactivar para no perder historial
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE barbero_id = ?').get(id).count;
    if (citasCount > 0) {
      db.prepare('UPDATE barberos SET activo = 0 WHERE id = ?').run(id);
      res.json({ success: true, message: 'Barbero desactivado (se conservó su historial de citas)' });
    } else {
      db.prepare('DELETE FROM barberos WHERE id = ?').run(id);
      res.json({ success: true, message: 'Barbero eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. SERVICIOS
// ----------------------------------------------------
app.get('/api/servicios', (req, res) => {
  try {
    const todos = req.query.todos === 'true';
    const query = todos 
      ? 'SELECT * FROM servicios ORDER BY precio_cop ASC'
      : 'SELECT * FROM servicios WHERE activo = 1 ORDER BY precio_cop ASC';
    const servicios = db.prepare(query).all();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servicios', (req, res) => {
  const { nombre, precio_cop, duracion_minutos, descripcion } = req.body;
  if (!nombre || !precio_cop) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  try {
    const stmt = db.prepare(`
      INSERT INTO servicios (nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = stmt.run(nombre, Number(precio_cop), Number(duracion_minutos) || 45, descripcion || '');
    res.json({ id: result.lastInsertRowid, message: 'Servicio creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio_cop, duracion_minutos, descripcion, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE servicios 
      SET nombre = COALESCE(?, nombre),
          precio_cop = COALESCE(?, precio_cop),
          duracion_minutos = COALESCE(?, duracion_minutos),
          descripcion = COALESCE(?, descripcion),
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(nombre, precio_cop, duracion_minutos, descripcion, activo, id);
    res.json({ success: true, message: 'Servicio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servicios/:id', (req, res) => {
  const { id } = req.params;
  try {
    const citasCount = db.prepare('SELECT COUNT(*) as count FROM citas WHERE servicio_id = ?').get(id).count;
    if (citasCount > 0) {
      db.prepare('UPDATE servicios SET activo = 0 WHERE id = ?').run(id);
      res.json({ success: true, message: 'Servicio desactivado para conservar historial' });
    } else {
      db.prepare('DELETE FROM servicios WHERE id = ?').run(id);
      res.json({ success: true, message: 'Servicio eliminado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. MOTOR DE DISPONIBILIDAD (PREVENCIÓN DE SOLAPAMIENTOS)
// ----------------------------------------------------
app.get('/api/disponibilidad', (req, res) => {
  const { barbero_id, fecha, duracion_minutos } = req.query;

  if (!barbero_id || !fecha) {
    return res.status(400).json({ error: 'barbero_id y fecha son obligatorios' });
  }

  try {
    const duracion = Number(duracion_minutos) || 45;
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ? AND activo = 1').get(barbero_id);

    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado o inactivo' });
    }

    // Verificar día laboral (1 = Lunes, 7 = Domingo)
    const fechaObj = new Date(`${fecha}T00:00:00`);
    let diaSemana = fechaObj.getDay(); // 0 es Domingo
    if (diaSemana === 0) diaSemana = 7;

    const diasPermitidos = (barbero.dias_laborales || '1,2,3,4,5,6').split(',').map(Number);
    if (!diasPermitidos.includes(diaSemana)) {
      return res.json({
        disponible_dia: false,
        motivo: 'El barbero no labora este día de la semana',
        slots: []
      });
    }

    // Obtener citas activas del barbero en esa fecha
    const citas = db.prepare(`
      SELECT id, hora_inicio, hora_fin, cliente_nombre 
      FROM citas 
      WHERE barbero_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, fecha);

    // Obtener bloqueos de horario que apliquen (al barbero o globales)
    const bloqueos = db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND fecha = ?
    `).all(barbero_id, fecha);

    const inicioMin = timeToMinutes(barbero.horario_inicio || '09:00');
    const finMin = timeToMinutes(barbero.horario_fin || '20:00');
    const step = 30; // Granularidad de 30 minutos para opciones de inicio

    const slots = [];
    for (let m = inicioMin; m + duracion <= finMin; m += step) {
      const slotInicio = minutesToTime(m);
      const slotFin = minutesToTime(m + duracion);

      // Verificar si choca con cita
      const conflictoCita = citas.find(c => checkOverlap(slotInicio, slotFin, c.hora_inicio, c.hora_fin));

      // Verificar si choca con bloqueo
      const conflictoBloqueo = bloqueos.find(b => checkOverlap(slotInicio, slotFin, b.hora_inicio, b.hora_fin));

      let disponible = true;
      let razonOcupado = null;

      if (conflictoCita) {
        disponible = false;
        razonOcupado = 'Horario reservado por otro cliente';
      } else if (conflictoBloqueo) {
        disponible = false;
        razonOcupado = `Bloqueado: ${conflictoBloqueo.motivo}`;
      }

      slots.push({
        hora_inicio: slotInicio,
        hora_fin: slotFin,
        disponible,
        razon: razonOcupado
      });
    }

    res.json({
      disponible_dia: true,
      barbero: { id: barbero.id, nombre: barbero.nombre },
      fecha,
      slots
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. CITAS / TURNOS
// ----------------------------------------------------
app.get('/api/citas', (req, res) => {
  const { fecha, barbero_id, estado, desde, hasta } = req.query;
  try {
    let sql = `
      SELECT c.*, b.nombre as barbero_nombre, b.foto_url as barbero_foto, s.nombre as servicio_nombre, s.duracion_minutos
      FROM citas c
      JOIN barberos b ON c.barbero_id = b.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (fecha) {
      sql += ' AND c.fecha = ?';
      params.push(fecha);
    }
    if (desde && hasta) {
      sql += ' AND c.fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    if (barbero_id) {
      sql += ' AND c.barbero_id = ?';
      params.push(barbero_id);
    }
    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY c.fecha DESC, c.hora_inicio ASC';
    const citas = db.prepare(sql).all(...params);
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citas', (req, res) => {
  const { barbero_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, notas } = req.body;

  if (!barbero_id || !servicio_id || !cliente_nombre || !cliente_telefono || !fecha || !hora_inicio) {
    return res.status(400).json({ error: 'Todos los campos marcados son obligatorios' });
  }

  try {
    const servicio = db.prepare('SELECT * FROM servicios WHERE id = ?').get(servicio_id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado' });

    const duracion = servicio.duracion_minutos || 45;
    const startMin = timeToMinutes(hora_inicio);
    const endMin = startMin + duracion;
    const hora_fin = minutesToTime(endMin);

    // 1. Validar colisión con citas existentes que no estén canceladas
    const citasExistentes = db.prepare(`
      SELECT id, hora_inicio, hora_fin 
      FROM citas 
      WHERE barbero_id = ? AND fecha = ? AND estado != 'cancelada'
    `).all(barbero_id, fecha);

    const hayConflictoCita = citasExistentes.some(c => checkOverlap(hora_inicio, hora_fin, c.hora_inicio, c.hora_fin));
    if (hayConflictoCita) {
      return res.status(409).json({ 
        error: 'El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otro turno.' 
      });
    }

    // 2. Validar colisión con bloqueos
    const bloqueos = db.prepare(`
      SELECT id, hora_inicio, hora_fin, motivo 
      FROM bloqueos 
      WHERE (barbero_id = ? OR barbero_id IS NULL) AND fecha = ?
    `).all(barbero_id, fecha);

    const hayConflictoBloqueo = bloqueos.some(b => checkOverlap(hora_inicio, hora_fin, b.hora_inicio, b.hora_fin));
    if (hayConflictoBloqueo) {
      return res.status(409).json({ 
        error: 'El barbero o la barbería tiene este horario bloqueado para atención.' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO citas (barbero_id, servicio_id, cliente_nombre, cliente_telefono, fecha, hora_inicio, hora_fin, estado, precio_cobrado, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmada', ?, ?)
    `);

    const result = stmt.run(
      barbero_id,
      servicio_id,
      cliente_nombre.trim(),
      cliente_telefono.trim(),
      fecha,
      hora_inicio,
      hora_fin,
      servicio.precio_cop,
      notas || ''
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Turno agendado exitosamente',
      cita: {
        id: result.lastInsertRowid,
        fecha,
        hora_inicio,
        hora_fin,
        precio_cobrado: servicio.precio_cop
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/citas/:id/estado', (req, res) => {
  const { id } = req.params;
  const { estado, precio_cobrado } = req.body;

  if (!['confirmada', 'completada', 'cancelada', 'no_asistio'].includes(estado)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  try {
    if (precio_cobrado !== undefined) {
      db.prepare('UPDATE citas SET estado = ?, precio_cobrado = ? WHERE id = ?').run(estado, Number(precio_cobrado), id);
    } else {
      db.prepare('UPDATE citas SET estado = ? WHERE id = ?').run(estado, id);
    }
    res.json({ success: true, message: `Estado actualizado a ${estado}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citas/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM citas WHERE id = ?').run(id);
    res.json({ success: true, message: 'Cita eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. BLOQUEO DE HORARIOS (DESCANSOS / ALMUERZOS / FERIADOS)
// ----------------------------------------------------
app.get('/api/bloqueos', (req, res) => {
  const { fecha, barbero_id } = req.query;
  try {
    let sql = `
      SELECT b.*, bar.nombre as barbero_nombre 
      FROM bloqueos b
      LEFT JOIN barberos bar ON b.barbero_id = bar.id
      WHERE 1=1
    `;
    const params = [];
    if (fecha) {
      sql += ' AND b.fecha = ?';
      params.push(fecha);
    }
    if (barbero_id) {
      sql += ' AND (b.barbero_id = ? OR b.barbero_id IS NULL)';
      params.push(barbero_id);
    }
    sql += ' ORDER BY b.fecha DESC, b.hora_inicio ASC';

    const bloqueos = db.prepare(sql).all(...params);
    res.json(bloqueos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bloqueos', (req, res) => {
  const { barbero_id, fecha, hora_inicio, hora_fin, motivo } = req.body;

  if (!fecha || !hora_inicio || !hora_fin || !motivo) {
    return res.status(400).json({ error: 'Fecha, hora de inicio, fin y motivo son requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO bloqueos (barbero_id, fecha, hora_inicio, hora_fin, motivo)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(barbero_id ? Number(barbero_id) : null, fecha, hora_inicio, hora_fin, motivo);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Horario bloqueado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bloqueos/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM bloqueos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Bloqueo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. COSTOS Y GASTOS OPERATIVOS
// ----------------------------------------------------
app.get('/api/costos', (req, res) => {
  const { desde, hasta, categoria } = req.query;
  try {
    let sql = 'SELECT * FROM costos WHERE 1=1';
    const params = [];

    if (desde && hasta) {
      sql += ' AND fecha BETWEEN ? AND ?';
      params.push(desde, hasta);
    }
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    sql += ' ORDER BY fecha DESC';
    const costos = db.prepare(sql).all(...params);
    const total = costos.reduce((sum, c) => sum + c.monto_cop, 0);

    res.json({ costos, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/costos', (req, res) => {
  const { categoria, descripcion, monto_cop, fecha, metodo_pago, notas } = req.body;

  if (!categoria || !descripcion || !monto_cop || !fecha) {
    return res.status(400).json({ error: 'Categoría, descripción, monto y fecha requeridos' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO costos (categoria, descripcion, monto_cop, fecha, metodo_pago, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(categoria, descripcion, Number(monto_cop), fecha, metodo_pago || 'Efectivo', notas || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Gasto registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/costos/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM costos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. PLANTILLA DE LIQUIDACIÓN Y PAGOS POR PORCENTAJE
// ----------------------------------------------------
// Cálculo previo de comisiones antes de liquidar
app.get('/api/liquidaciones/preview', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin } = req.query;

  if (!barbero_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'barbero_id, fecha_inicio y fecha_fin son requeridos' });
  }

  try {
    const barbero = db.prepare('SELECT * FROM barberos WHERE id = ?').get(barbero_id);
    if (!barbero) return res.status(404).json({ error: 'Barbero no encontrado' });

    // Citas completadas en el rango que aún NO han sido liquidadas
    const citas = db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.barbero_id = ? 
        AND c.fecha BETWEEN ? AND ? 
        AND c.estado = 'completada'
        AND c.liquidacion_id IS NULL
      ORDER BY c.fecha ASC, c.hora_inicio ASC
    `).all(barbero_id, fecha_inicio, fecha_fin);

    const totalBruto = citas.reduce((sum, c) => sum + (c.precio_cobrado || 0), 0);
    const porcentaje = barbero.porcentaje_comision || 50.0;
    const montoComision = Math.round(totalBruto * (porcentaje / 100));
    const margenBarberia = totalBruto - montoComision;

    res.json({
      barbero,
      fecha_inicio,
      fecha_fin,
      total_servicios: citas.length,
      total_bruto: totalBruto,
      porcentaje_aplicado: porcentaje,
      monto_comision: montoComision,
      margen_barberia: margenBarberia,
      citas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar y cerrar la liquidación
app.post('/api/liquidaciones', (req, res) => {
  const { barbero_id, fecha_inicio, fecha_fin, porcentaje_aplicado, deducciones, metodo_pago, notas, citas_ids } = req.body;

  if (!barbero_id || !fecha_inicio || !fecha_fin || !Array.isArray(citas_ids) || citas_ids.length === 0) {
    return res.status(400).json({ error: 'Faltan datos obligatorios o no hay servicios seleccionados' });
  }

  const transaction = db.transaction(() => {
    // 1. Obtener los servicios correspondientes
    const placeholders = citas_ids.map(() => '?').join(',');
    const citas = db.prepare(`
      SELECT id, precio_cobrado FROM citas WHERE id IN (${placeholders})
    `).all(...citas_ids);

    const totalBruto = citas.reduce((sum, c) => sum + c.precio_cobrado, 0);
    const pct = Number(porcentaje_aplicado);
    const comision = Math.round(totalBruto * (pct / 100));
    const ded = Number(deducciones) || 0;
    const totalPagado = Math.max(0, comision - ded);

    // 2. Insertar liquidación
    const stmt = db.prepare(`
      INSERT INTO liquidaciones (
        barbero_id, fecha_inicio, fecha_fin, total_servicios, total_bruto,
        porcentaje_aplicado, monto_comision, deducciones, total_pagado,
        metodo_pago, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      barbero_id,
      fecha_inicio,
      fecha_fin,
      citas.length,
      totalBruto,
      pct,
      comision,
      ded,
      totalPagado,
      metodo_pago || 'Efectivo',
      notas || ''
    );

    const liquidacionId = result.lastInsertRowid;

    // 3. Vincular citas a esta liquidación
    const updateCitas = db.prepare(`
      UPDATE citas SET liquidacion_id = ? WHERE id IN (${placeholders})
    `);
    updateCitas.run(liquidacionId, ...citas_ids);

    return { liquidacionId, totalPagado };
  });

  try {
    const outcome = transaction();
    res.status(201).json({
      success: true,
      id: outcome.liquidacionId,
      message: 'Liquidación registrada y turnos marcados como pagados'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar historial de liquidaciones
app.get('/api/liquidaciones', (req, res) => {
  const { barbero_id } = req.query;
  try {
    let sql = `
      SELECT l.*, b.nombre as barbero_nombre, b.telefono as barbero_telefono
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE 1=1
    `;
    const params = [];
    if (barbero_id) {
      sql += ' AND l.barbero_id = ?';
      params.push(barbero_id);
    }
    sql += ' ORDER BY l.fecha_pago DESC';
    const liquidaciones = db.prepare(sql).all(...params);
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detalle de liquidación con sus citas
app.get('/api/liquidaciones/:id', (req, res) => {
  const { id } = req.params;
  try {
    const liquidacion = db.prepare(`
      SELECT l.*, b.nombre as barbero_nombre, b.telefono as barbero_telefono
      FROM liquidaciones l
      JOIN barberos b ON l.barbero_id = b.id
      WHERE l.id = ?
    `).get(id);

    if (!liquidacion) return res.status(404).json({ error: 'Liquidación no encontrada' });

    const citas = db.prepare(`
      SELECT c.*, s.nombre as servicio_nombre
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.liquidacion_id = ?
      ORDER BY c.fecha ASC, c.hora_inicio ASC
    `).all(id);

    res.json({ liquidacion, citas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 9. REPORTE FINANCIERO Y BALANCE GENERAL
// ----------------------------------------------------
app.get('/api/reportes/balance', (req, res) => {
  const { desde, hasta } = req.query;
  try {
    // 1. Ingresos brutos por citas completadas
    let sqlCitas = `SELECT SUM(precio_cobrado) as total_ingresos, COUNT(*) as cantidad_servicios FROM citas WHERE estado = 'completada'`;
    const paramsCitas = [];
    if (desde && hasta) {
      sqlCitas += ' AND fecha BETWEEN ? AND ?';
      paramsCitas.push(desde, hasta);
    }
    const citasData = db.prepare(sqlCitas).get(...paramsCitas);
    const totalIngresos = citasData.total_ingresos || 0;
    const totalServicios = citasData.cantidad_servicios || 0;

    // 2. Liquidaciones pagadas a barberos
    let sqlLiq = `SELECT SUM(monto_comision) as total_comisiones FROM liquidaciones WHERE 1=1`;
    const paramsLiq = [];
    if (desde && hasta) {
      sqlLiq += ' AND fecha_pago BETWEEN ? AND ?';
      paramsLiq.push(`${desde} 00:00:00`, `${hasta} 23:59:59`);
    }
    const liqData = db.prepare(sqlLiq).get(...paramsLiq);
    const totalComisiones = liqData.total_comisiones || 0;

    // 3. Gastos y costos operativos
    let sqlCostos = `SELECT SUM(monto_cop) as total_gastos FROM costos WHERE 1=1`;
    const paramsCostos = [];
    if (desde && hasta) {
      sqlCostos += ' AND fecha BETWEEN ? AND ?';
      paramsCostos.push(desde, hasta);
    }
    const costosData = db.prepare(sqlCostos).get(...paramsCostos);
    const totalCostos = costosData.total_gastos || 0;

    // Ganancia neta para el negocio
    const margenBruto = totalIngresos - totalComisiones;
    const gananciaNeta = margenBruto - totalCostos;

    res.json({
      total_ingresos: totalIngresos,
      total_servicios: totalServicios,
      total_comisiones_pagadas: totalComisiones,
      total_costos_operativos: totalCostos,
      margen_barberia: margenBruto,
      ganancia_neta: gananciaNeta
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 10. GALERÍA MULTIMEDIA & REDES SOCIALES
// ----------------------------------------------------
app.get('/api/multimedia', (req, res) => {
  const todos = req.query.todos === 'true';
  try {
    let sql = `
      SELECT m.*, b.nombre as barbero_nombre 
      FROM galeria_multimedia m
      LEFT JOIN barberos b ON m.barbero_id = b.id
    `;
    if (!todos) {
      sql += ' WHERE m.activo = 1';
    }
    sql += ' ORDER BY m.orden ASC, m.creado_en DESC';

    const items = db.prepare(sql).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/multimedia', (req, res) => {
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id } = req.body;

  if (!titulo || !url_media) {
    return res.status(400).json({ error: 'Título y URL de multimedia o red social son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO galeria_multimedia (titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `);
    const result = stmt.run(
      titulo.trim(),
      tipo || 'imagen',
      url_media.trim(),
      url_red_social ? url_red_social.trim() : null,
      descripcion ? descripcion.trim() : '',
      barbero_id ? Number(barbero_id) : null
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Publicación agregada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/multimedia/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, tipo, url_media, url_red_social, descripcion, barbero_id, activo } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE galeria_multimedia
      SET titulo = COALESCE(?, titulo),
          tipo = COALESCE(?, tipo),
          url_media = COALESCE(?, url_media),
          url_red_social = COALESCE(?, url_red_social),
          descripcion = COALESCE(?, descripcion),
          barbero_id = ?,
          activo = COALESCE(?, activo)
      WHERE id = ?
    `);
    stmt.run(
      titulo,
      tipo,
      url_media,
      url_red_social,
      descripcion,
      barbero_id !== undefined ? (barbero_id ? Number(barbero_id) : null) : null,
      activo,
      id
    );
    res.json({ success: true, message: 'Publicación actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/multimedia/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM galeria_multimedia WHERE id = ?').run(id);
    res.json({ success: true, message: 'Publicación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soporte para rutas en SPA frontend
if (fs.existsSync(clientDistPath)) {
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de Barbería corriendo en http://localhost:${PORT}`);
});
