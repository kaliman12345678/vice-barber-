// Formato de moneda para Pesos Colombianos (COP)
export function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Formato de fecha legible en español (ej: "Sábado, 24 de Octubre de 2026")
export function formatDateReadable(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Formato corto (ej: "Sáb, 24 Oct")
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// Formato de hora en 12 horas con AM/PM (ej: "09:30 AM")
export function formatTime12(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Obtener la fecha de hoy en formato YYYY-MM-DD
export function getTodayStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generar lista de próximos N días para el selector
export function getNextDays(count = 14) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      dateStr: `${year}-${month}-${day}`,
      dayName: d.toLocaleDateString('es-CO', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('es-CO', { month: 'short' }),
      isToday: i === 0
    });
  }
  return days;
}
