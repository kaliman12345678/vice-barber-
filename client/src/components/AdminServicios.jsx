import React, { useState } from 'react';
import { Scissors, Plus, Edit2, Trash2, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { formatCOP } from '../utils/helpers';

export default function AdminServicios({ servicios, onRecargar }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    precio_cop: '',
    duracion_minutos: 45,
    descripcion: ''
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  function abrirModalNuevo() {
    setServicioEditando(null);
    setForm({
      nombre: '',
      precio_cop: '',
      duracion_minutos: 45,
      descripcion: ''
    });
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(s) {
    setServicioEditando(s);
    setForm({
      nombre: s.nombre,
      precio_cop: s.precio_cop,
      duracion_minutos: s.duracion_minutos || 45,
      descripcion: s.descripcion || ''
    });
    setError('');
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.precio_cop) {
      setError('Nombre y precio son obligatorios');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const url = servicioEditando ? `/api/servicios/${servicioEditando.id}` : '/api/servicios';
      const method = servicioEditando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error al guardar');
        return;
      }

      setModalAbierto(false);
      onRecargar();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Deseas eliminar este servicio? Si ya tiene citas, se mantendrá en el historial pero ya no se ofrecerá para nuevas citas.')) return;
    try {
      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRecargar();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado y botón nuevo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-serif">
            Catálogo de Servicios
          </h3>
          <p className="text-xs text-slate-400">
            Define los cortes, peinados, barbas y combos con sus tarifas y duración.
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Lista de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicios.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="font-bold text-white text-base">
                  {s.nombre}
                </h4>
                <span className="text-amber-400 font-extrabold text-base whitespace-nowrap bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {formatCOP(s.precio_cop)}
                </span>
              </div>

              {s.descripcion && (
                <p className="text-xs text-slate-400 mb-3">
                  {s.descripcion}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Tiempo de atención estimado:</span>
                <span className="font-bold text-slate-200">{s.duracion_minutos} minutos</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-1 text-xs">
              <button
                onClick={() => abrirModalEditar(s)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Editar servicio"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEliminar(s.id)}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Eliminar servicio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR / EDITAR SERVICIO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              {servicioEditando ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Establece el precio en COP y la duración para el cálculo de horarios.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Corte Clásico + Barba"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Ej. 25000"
                    value={form.precio_cop}
                    onChange={(e) => setForm({ ...form, precio_cop: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    step="5"
                    required
                    value={form.duracion_minutos}
                    onChange={(e) => setForm({ ...form, duracion_minutos: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles de lo que incluye el servicio..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
