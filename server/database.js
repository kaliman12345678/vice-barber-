const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'barberia.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS barberos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT,
      foto_url TEXT,
      porcentaje_comision REAL DEFAULT 50.0,
      horario_inicio TEXT DEFAULT '09:00',
      horario_fin TEXT DEFAULT '20:00',
      dias_laborales TEXT DEFAULT '1,2,3,4,5,6', -- 1=Lunes, 7=Domingo
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio_cop INTEGER NOT NULL,
      duracion_minutos INTEGER NOT NULL DEFAULT 45,
      descripcion TEXT,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bloqueos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER, -- NULL significa bloqueo para toda la barbería
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      hora_inicio TEXT NOT NULL, -- HH:mm
      hora_fin TEXT NOT NULL, -- HH:mm
      motivo TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS liquidaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER NOT NULL,
      fecha_inicio TEXT NOT NULL,
      fecha_fin TEXT NOT NULL,
      total_servicios INTEGER NOT NULL,
      total_bruto INTEGER NOT NULL,
      porcentaje_aplicado REAL NOT NULL,
      monto_comision INTEGER NOT NULL,
      deducciones INTEGER DEFAULT 0,
      total_pagado INTEGER NOT NULL,
      metodo_pago TEXT DEFAULT 'Efectivo',
      fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
      notas TEXT,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barbero_id INTEGER NOT NULL,
      servicio_id INTEGER NOT NULL,
      cliente_nombre TEXT NOT NULL,
      cliente_telefono TEXT NOT NULL,
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      hora_inicio TEXT NOT NULL, -- HH:mm
      hora_fin TEXT NOT NULL, -- HH:mm
      estado TEXT DEFAULT 'confirmada', -- confirmada, completada, cancelada, no_asistio
      precio_cobrado INTEGER NOT NULL,
      notas TEXT,
      liquidacion_id INTEGER,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE RESTRICT,
      FOREIGN KEY (servicio_id) REFERENCES servicios (id) ON DELETE RESTRICT,
      FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS costos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL, -- Arriendo, Servicios Públicos, Insumos / Productos, Mantenimiento, Nómina / Fijos, Otros
      descripcion TEXT NOT NULL,
      monto_cop INTEGER NOT NULL,
      fecha TEXT NOT NULL, -- YYYY-MM-DD
      metodo_pago TEXT DEFAULT 'Efectivo',
      notas TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT
    );

    CREATE TABLE IF NOT EXISTS galeria_multimedia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      tipo TEXT DEFAULT 'imagen', -- 'imagen', 'video', 'instagram', 'youtube', 'tiktok'
      url_media TEXT NOT NULL,
      url_red_social TEXT,
      descripcion TEXT,
      barbero_id INTEGER,
      orden INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (barbero_id) REFERENCES barberos (id) ON DELETE SET NULL
    );
  `);

  // Configuración inicial por defecto
  const setConfig = db.prepare(`INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)`);
  setConfig.run('nombre_barberia', 'The Barber Club');
  setConfig.run('telefono_barberia', '+57 300 123 4567');
  setConfig.run('direccion_barberia', 'Calle Principal # 10 - 20');
  setConfig.run('pin_admin', '1234');
  setConfig.run('intervalo_minutos', '30'); // Granularidad del selector de horas
  setConfig.run('hora_apertura', '08:00');
  setConfig.run('hora_cierre', '20:00');

  // Seed de datos de prueba si no hay barberos
  const barberoCount = db.prepare(`SELECT COUNT(*) as count FROM barberos`).get().count;
  if (barberoCount === 0) {
    const insertBarbero = db.prepare(`
      INSERT INTO barberos (nombre, telefono, foto_url, porcentaje_comision, horario_inicio, horario_fin, dias_laborales, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertBarbero.run('Carlos Rodríguez', '3101112233', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop&crop=faces', 50.0, '09:00', '19:00', '1,2,3,4,5,6');
    insertBarbero.run('Mateo Gómez', '3152223344', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop&crop=faces', 55.0, '10:00', '20:00', '2,3,4,5,6,7');
    insertBarbero.run('Sebastián Peña', '3203334455', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces', 50.0, '09:00', '18:00', '1,2,3,4,5');
  }

  // Seed de servicios si no hay
  const servicioCount = db.prepare(`SELECT COUNT(*) as count FROM servicios`).get().count;
  if (servicioCount === 0) {
    const insertServicio = db.prepare(`
      INSERT INTO servicios (nombre, precio_cop, duracion_minutos, descripcion, activo)
      VALUES (?, ?, ?, ?, 1)
    `);

    insertServicio.run('Corte Clásico / Fade', 25000, 45, 'Corte tradicional o degradado con terminación en navaja y peinado.');
    insertServicio.run('Perfilado & Arreglo de Barba', 18000, 30, 'Diseño de barba con vapor ozono, aceites esenciales y navaja.');
    insertServicio.run('Combo Real (Corte + Barba)', 38000, 60, 'El paquete completo: corte a elección, toalla caliente y diseño de barba.');
    insertServicio.run('Diseño / Cejas / Greca', 12000, 20, 'Diseño artístico de grecas o perfilado de cejas con navaja.');
    insertServicio.run('Exfoliación & Mascarilla Negra', 22000, 30, 'Limpieza profunda facial, eliminación de puntos negros y tónico refrescante.');
  }

  // Seed de costos de ejemplo si no hay
  const costoCount = db.prepare(`SELECT COUNT(*) as count FROM costos`).get().count;
  if (costoCount === 0) {
    const insertCosto = db.prepare(`
      INSERT INTO costos (categoria, descripcion, monto_cop, fecha, metodo_pago, notas)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const hoy = new Date().toISOString().split('T')[0];
    insertCosto.run('Insumos / Productos', 'Caja de cuchillas Dorco x100 y Gel de afeitar', 65000, hoy, 'Efectivo', 'Compra droguería central');
    insertCosto.run('Servicios Públicos', 'Factura de Energía Eléctrica', 180000, hoy, 'Transferencia', 'Mes corriente');
  }

  // Seed de multimedia / redes sociales si no hay
  const mediaCount = db.prepare(`SELECT COUNT(*) as count FROM galeria_multimedia`).get().count;
  if (mediaCount === 0) {
    const primerBarbero = db.prepare(`SELECT id FROM barberos LIMIT 1`).get();
    const barberoIdVal = primerBarbero ? primerBarbero.id : null;

    const insertMedia = db.prepare(`
      INSERT INTO galeria_multimedia (titulo, tipo, url_media, url_red_social, descripcion, barbero_id, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertMedia.run(
      'Mid Fade con Textura & Perfilado',
      'imagen',
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Degradado medio con navaja y peinado mate con cera arcillosa.',
      barberoIdVal,
      1
    );

    insertMedia.run(
      'Diseño & Arreglo de Barba con Toalla Caliente',
      'imagen',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Terapia de vapor y perfilado con navaja clásica.',
      barberoIdVal,
      2
    );

    insertMedia.run(
      'Fade Clásico & Barba Estilo Royale',
      'imagen',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop',
      'https://instagram.com',
      'El corte más pedido de la semana en la barbería.',
      barberoIdVal,
      3
    );

    insertMedia.run(
      'Ambiente & Estilo en la Barbería',
      'imagen',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=600&fit=crop',
      'https://instagram.com',
      'Música, café de cortesía y la mejor atención de la ciudad.',
      null,
      4
    );
  }
}

initDatabase();

module.exports = db;
