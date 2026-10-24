import React, { useState, useEffect } from 'react';
import { Ban, Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { formatDateReadable, formatTime12, getTodayStr } from '../utils/helpers';

export default function AdminBloqueos({ barberos }) {
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Formulario nuevo bloqueo
  const [barberoId, setBarberoId] = useState(''); // vacío = toda la barbería
  const [fecha, setFecha] = useState(getTodayStr());
  const [horaInicio, setHoraInicio] = useState('13:00');
  const [horaFin, setHoraFin] = useState('14:00');
  const [motivo, setMotivo] = useState('Hora de almuerzo');

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarBloqueos();
  }, []);

  async function cargarBloqueos() {
    setCargando(true);
    try {
      const res = await fetch('/api/bloqueos');
      const data = await res.json();
      setBloqueos(data);
    } catch (err) {
      console.error('Error al cargar bloqueos:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleCrearBloqueo(e) {
    e.preventDefault();
    if (!fecha || !horaInicio || !horaFin || !motivo.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setGuardando(true);
    setError('');
    setMensajeExito('');

    try {
      const res = await fetch('/api/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbero_id: barberoId || null,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          motivo: motivo.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo crear el bloqueo');
        return;
      }

      setMensajeExito('Horario bloqueado con éxito. Ningún cliente podrá agendar en este lapso.');
      setTimeout(() => setMensajeExito(''), 4000);
      cargarBloqueos();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarBloqueo(id) {
    if (!confirm('¿Deseas desbloquear este horario para que vuelva a estar disponible?')) return;
    try {
      const res = await fetch(`/api/bloqueos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarBloqueos();
      }
    } catch (err) {
      console.error('Error al eliminar bloqueo:', err);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Explicación de la funcionalidad */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Ban className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200">
          <p className="font-bold text-amber-400">Control de Bloqueo de Horarios</p>
          <p className="mt-0.5 text-slate-300">
            Bloquea turnos para descansos, almuerzos, reuniones o feriados. Los horarios bloqueados aparecerán inhabilitados automáticamente en el portal del cliente impidiendo que se agenden citas en esas horas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORMULARIO PARA CREAR BLOQUEO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit shadow-lg">
          <h3 className="text-lg font-bold text-white mb-1 font-serif flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Nuevo Bloqueo
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Selecciona el barbero o toda la barbería y el rango de horas a congelar.
          </p>

          {mensajeExito && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCrearBloqueo} className="space-y-3.5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                ¿A quién aplica el bloqueo?
              </label>
              <select
                value={barberoId}
                onChange={(e) => setBarberoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">🏢 Toda la Barbería (Cierre / Feriado)</option>
                {barberos.map(b => (
                  <option key={b.id} value={b.id}>👤 Solo {b.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Fecha del bloqueo *
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Hora Inicio *
                </label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Hora Fin *
                </label>
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Motivo del Bloqueo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Almuerzo, Cita médica, Mantenimiento..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <Ban className="w-4 h-4" />
              <span>{guardando ? 'Bloqueando...' : 'Aplicar Bloqueo de Horario'}</span>
            </button>
          </form>
        </div>

        {/* TABLA DE BLOQUEOS EXISTENTES */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-serif">
                Bloqueos Activos y Programados
              </h3>
              <p className="text-xs text-slate-400">
                Lista de intervalos actualmente restringidos para reservas.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {bloqueos.length} {bloqueos.length === 1 ? 'bloqueo' : 'bloqueos'}
            </span>
          </div>

          {cargando ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Cargando bloqueos...
            </div>
          ) : bloqueos.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hay bloqueos de horario registrados.</p>
              <p className="text-xs mt-1">Todos los horarios regulares de los barberos están habilitados.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {bloqueos.map((b) => (
                <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {b.barbero_nombre ? `👤 ${b.barbero_nombre}` : '🏢 Toda la Barbería'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {formatTime12(b.hora_inicio)} - {formatTime12(b.hora_fin)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                      <span>📅 {formatDateReadable(b.fecha)}</span>
                      <span>•</span>
                      <span className="text-rose-400/90 font-medium">Motivo: {b.motivo}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleEliminarBloqueo(b.id)}
                    title="Desbloquear y permitir reservas"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
