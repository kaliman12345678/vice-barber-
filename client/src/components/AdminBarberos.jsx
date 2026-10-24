import React, { useState } from 'react';
import { User, Plus, Edit2, Trash2, Check, X, Phone, Clock, Percent, ShieldCheck, AlertCircle, Upload } from 'lucide-react';
import { formatTime12 } from '../utils/helpers';

const DIAS_SEMANA = [
  { id: 1, nombre: 'Lun' },
  { id: 2, nombre: 'Mar' },
  { id: 3, nombre: 'Mié' },
  { id: 4, nombre: 'Jue' },
  { id: 5, nombre: 'Vie' },
  { id: 6, nombre: 'Sáb' },
  { id: 7, nombre: 'Dom' }
];

export default function AdminBarberos({ barberos, onRecargar }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [barberoEditando, setBarberoEditando] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    foto_url: '',
    porcentaje_comision: 50,
    horario_inicio: '09:00',
    horario_fin: '20:00',
    dias_laborales: '1,2,3,4,5,6'
  });

  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState('');

  // Edición rápida de porcentajes individuales en tarjetas
  const [porcentajesEditables, setPorcentajesEditables] = useState({});
  const [guardandoComisionId, setGuardandoComisionId] = useState(null);

  async function handleGuardarComisionRapida(barberoId, nuevoPorcentaje) {
    const val = Number(nuevoPorcentaje);
    if (isNaN(val) || val < 0 || val > 100) return;

    setGuardandoComisionId(barberoId);
    try {
      const res = await fetch(`/api/barberos/${barberoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ porcentaje_comision: val })
      });
      if (res.ok) {
        if (onRecargar) onRecargar();
        setPorcentajesEditables(prev => {
          const copy = { ...prev };
          delete copy[barberoId];
          return copy;
        });
      }
    } catch (err) {
      console.error('Error guardando comisión:', err);
    } finally {
      setGuardandoComisionId(null);
    }
  }

  async function handleSubirFotoBarbero(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoFoto(true);
    setError('');

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al subir foto');
        return;
      }
      setForm(prev => ({ ...prev, foto_url: data.url }));
    } catch (err) {
      setError('Error de conexión al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  }

  function abrirModalNuevo() {
    setBarberoEditando(null);
    setForm({
      nombre: '',
      telefono: '',
      foto_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&h=300&fit=crop&crop=faces',
      porcentaje_comision: 50,
      horario_inicio: '09:00',
      horario_fin: '20:00',
      dias_laborales: '1,2,3,4,5,6'
    });
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(b) {
    setBarberoEditando(b);
    setForm({
      nombre: b.nombre,
      telefono: b.telefono || '',
      foto_url: b.foto_url || '',
      porcentaje_comision: b.porcentaje_comision || 50,
      horario_inicio: b.horario_inicio || '09:00',
      horario_fin: b.horario_fin || '20:00',
      dias_laborales: b.dias_laborales || '1,2,3,4,5,6'
    });
    setError('');
    setModalAbierto(true);
  }

  function toggleDia(id) {
    const seleccionados = form.dias_laborales ? form.dias_laborales.split(',').map(Number) : [];
    let nuevos;
    if (seleccionados.includes(id)) {
      nuevos = seleccionados.filter(d => d !== id);
    } else {
      nuevos = [...seleccionados, id].sort();
    }
    setForm({ ...form, dias_laborales: nuevos.join(',') });
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre del barbero es obligatorio');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const url = barberoEditando ? `/api/barberos/${barberoEditando.id}` : '/api/barberos';
      const method = barberoEditando ? 'PUT' : 'POST';

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

  async function handleToggleActivo(b) {
    const nuevoEstado = b.activo ? 0 : 1;
    try {
      await fetch(`/api/barberos/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
      onRecargar();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Seguro que deseas eliminar o desactivar a este barbero? Si tiene citas pasadas, su historial se conservará pero no aparecerá para nuevas reservas.')) return;
    try {
      const res = await fetch(`/api/barberos/${id}`, { method: 'DELETE' });
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
            Equipo de Barberos
          </h3>
          <p className="text-xs text-slate-400">
            Administra a tu personal, horarios de atención y su porcentaje (%) de comisión para pagos.
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Barbero</span>
        </button>
      </div>

      {/* Mensaje de comisiones individuales */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-300">
        <Percent className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <span className="font-bold block text-white text-sm">Comisiones Individuales por Barbero</span>
          <span>Cada barbero gana un porcentaje personalizado según su experiencia o acuerdo. Modifícalo directamente en la tarjeta de cada uno o en el botón de editar.</span>
        </div>
      </div>

      {/* Lista de Barberos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {barberos.map((b) => {
          const dias = b.dias_laborales ? b.dias_laborales.split(',').map(Number) : [];
          return (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                b.activo
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={b.foto_url || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=faces'}
                    alt={b.nombre}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base truncate">
                        {b.nombre}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.activo ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {b.telefono && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>{b.telefono}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Detalles: Comisión Individual y Horario */}
                <div className="space-y-2.5 text-xs bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center bg-slate-900/90 p-2 rounded-xl border border-amber-500/20">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-400" />
                      Comisión Individual:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={porcentajesEditables[b.id] ?? b.porcentaje_comision}
                        onChange={(e) => setPorcentajesEditables(prev => ({ ...prev, [b.id]: e.target.value }))}
                        className="w-14 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-2 py-1 text-center font-black text-amber-400 text-xs focus:outline-none"
                      />
                      <span className="text-amber-400 font-bold text-xs">%</span>
                      {porcentajesEditables[b.id] !== undefined && Number(porcentajesEditables[b.id]) !== b.porcentaje_comision && (
                        <button
                          type="button"
                          disabled={guardandoComisionId === b.id}
                          onClick={() => handleGuardarComisionRapida(b.id, porcentajesEditables[b.id])}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black transition-all shadow-md shadow-amber-500/20"
                        >
                          {guardandoComisionId === b.id ? '...' : 'Guardar'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Horario:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {formatTime12(b.horario_inicio)} - {formatTime12(b.horario_fin)}
                    </span>
                  </div>

                  {/* Días laborales */}
                  <div className="pt-1 border-t border-slate-800/60 flex items-center gap-1">
                    <span className="text-slate-500 text-[10px] mr-1">Días:</span>
                    {DIAS_SEMANA.map((d) => (
                      <span
                        key={d.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          dias.includes(d.id)
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        {d.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleActivo(b)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    b.activo
                      ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                      : 'text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {b.activo ? 'Pausar / Inactivar' : 'Reactivar'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirModalEditar(b)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Editar información"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEliminar(b.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Eliminar barbero"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR BARBERO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              {barberoEditando ? 'Editar Barbero' : 'Nuevo Barbero'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configura sus datos de contacto, horario laboral y su porcentaje de comisión para liquidaciones.
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
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mateo Gómez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 315 222 3344"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    % Comisión *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="Ej. 50"
                    value={form.porcentaje_comision}
                    onChange={(e) => setForm({ ...form, porcentaje_comision: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase">
                  Foto de Perfil del Barbero
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {form.foto_url ? (
                      <img src={form.foto_url} alt="Barbero" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="foto-barbero-upload"
                      accept="image/*"
                      className="hidden"
                      disabled={subiendoFoto}
                      onChange={handleSubirFotoBarbero}
                    />
                    <label
                      htmlFor="foto-barbero-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
                    >
                      <Upload className={`w-3.5 h-3.5 ${subiendoFoto ? 'animate-bounce' : ''}`} />
                      <span>{subiendoFoto ? 'Subiendo...' : 'Subir foto desde celular/PC'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="O pegar URL de imagen..."
                      value={form.foto_url}
                      onChange={(e) => setForm({ ...form, foto_url: e.target.value })}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Hora Entrada
                  </label>
                  <input
                    type="time"
                    value={form.horario_inicio}
                    onChange={(e) => setForm({ ...form, horario_inicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Hora Salida
                  </label>
                  <input
                    type="time"
                    value={form.horario_fin}
                    onChange={(e) => setForm({ ...form, horario_fin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Días laborales */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Días de la semana que atiende citas
                </label>
                <div className="flex gap-2">
                  {DIAS_SEMANA.map((d) => {
                    const activos = form.dias_laborales ? form.dias_laborales.split(',').map(Number) : [];
                    const isChecked = activos.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDia(d.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isChecked
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {d.nombre}
                      </button>
                    );
                  })}
                </div>
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
                  {guardando ? 'Guardando...' : 'Guardar Barbero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
