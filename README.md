# 💈 Sistema de Agenda & Gestión de Barbería

Sistema web full-stack integral para barberías, optimizado para celulares y computadores. Permite que los clientes agenden turnos autónomamente, previene solapamientos en tiempo real, bloquea horarios para descansos, gestiona costos y calcula liquidaciones por comisión (%) para los barberos con comprobante imprimible y exportación a WhatsApp.

---

## 🚀 Inicio Rápido

Para iniciar el servidor backend y el portal web en simultáneo con un solo comando:

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install
npm --prefix client install

# 2. Iniciar el sistema en modo desarrollo (Backend + Frontend)
npm run dev
```

La aplicación abrirá:
- **Portal Web**: `http://localhost:3000` (o `http://localhost:3001` si ejecutas el servidor con el build)
- **API Backend**: `http://localhost:3001/api`

---

## 🔐 Acceso al Panel del Administrador (Dueño)

1. En la barra superior, haz clic en **"Panel Dueño"**.
2. Ingresa el PIN maestro de seguridad:
   - **PIN por defecto:** `1234`
   - *(Puedes cambiar el PIN en cualquier momento en la pestaña "Ajustes")*

---

## 🌟 Funcionalidades Principales

### 1. Portal de Reserva para Clientes
- **Paso 1: Selección de Barbero:** Elige entre el equipo disponible con fotos, nombres y horarios.
- **Paso 2: Catálogo de Servicios:** Precios en **Pesos Colombianos (COP $)** y duración en minutos.
- **Paso 3: Selector Inteligente de Fechas y Horas:**
  - Calcula en tiempo real las horas libres de acuerdo a la duración del servicio.
  - **Bloquea y deshabilita automáticamente las horas ya reservadas por otros clientes o congeladas por el administrador.**
  - **Protección contra colisiones:** El servidor rechaza con código `409 Conflicto` si dos personas intentan tomar el mismo turno a la vez.
- **Paso 4: Datos del Cliente:** Nombre y WhatsApp.
- **Paso 5: Confirmación Inmediata con WhatsApp:** Botón que abre WhatsApp con el mensaje pre-redactado con los datos del turno para confirmar directamente con la barbería.

### 2. Panel del Administrador (Dueño)
- **📅 Agenda & Citas:**
  - Vista diaria por fecha con navegación rápida ("Hoy", "Ayer", "Mañana").
  - Filtro por Barbero.
  - Estados interactivos: `Confirmada`, `Completada / Cobrada`, `Cancelada`, `No Asistió`.
  - Botón para **"Agendar Presencial (Walk-in)"** para clientes que llegan directamente al local.
- **🚫 Bloqueo de Horarios:**
  - Permite congelar lapsos (ej: de 1:00 PM a 2:00 PM) para almuerzos, citas personales o descansos.
  - Opción de bloquear a un barbero individual o aplicar bloqueo global a toda la barbería (feriados/mantenimiento).
- **✂️ Gestión de Barberos:**
  - Agregar, editar o retirar barberos.
  - Configuración de horarios laborales de entrada/salida y días de la semana.
  - **Configuración individual del Porcentaje de Comisión (%)** (ej: 50%, 55%, 60%).
- **🏷️ Catálogo de Servicios:**
  - Crear o editar servicios, precio en COP y duración en minutos.
- **💰 Control de Costos y Egresos:**
  - Registro de compras de insumos (navajas, geles, toallas), arriendo, energía, agua, internet o mantenimiento.
  - Total acumulado de gastos operativos.
- **📑 Plantilla de Pagos por Porcentaje a Barberos (Exclusivo Administrador):**
  - Selector de barbero y rango de fechas (Hoy, Esta Semana, Este Mes o personalizado).
  - **Auditoría automática:** Muestra cada uno de los turnos completados y su valor cobrado.
  - **Cálculo de comisión:** `Total Bruto * Porcentaje de Comisión %`.
  - Registro de deducciones / adelantos de dinero.
  - **Cierre y registro de liquidación:** Marca los turnos como pagados para evitar duplicación.
  - **Recibo de liquidación imprimible / PDF:** Formato físico con detalle de cortes y firmas del barbero y la administración.
  - **Envío a WhatsApp:** Genera un resumen directo al WhatsApp del barbero con el desglose y monto neto transferido o entregado.
  - Pestaña de historial para consultar y reimprimir pagos anteriores.
- **📊 Balance Financiero y Margen Neto:**
  - Ingresos brutos vs. Comisiones pagadas vs. Costos operativos = **Ganancia neta real del negocio**.

---

## 🛠️ Arquitectura Tecnológica

- **Frontend:** React 19 + Vite + Tailwind CSS + Lucide Icons + Canvas-Confetti.
- **Backend:** Node.js + Express.
- **Base de Datos:** SQLite (`server/barberia.db`) mediante `better-sqlite3` (rápido, embebido, sin requerir servicios externos, respaldable en un solo archivo).
- **Pruebas:** Suite de pruebas automatizadas en `test/api_test.js`.

---

## 🧪 Ejecutar Pruebas Automatizadas

```bash
npm test
```
Verifica endpoints, creación de citas, colisión de horarios, bloqueos, costos y cálculos de liquidación por porcentaje.
