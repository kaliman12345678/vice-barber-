import React, { useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, KeyRound, Building } from 'lucide-react';

export default function AdminConfig({ shopConfig, onConfigActualizada }) {
  const [form, setForm] = useState({
    nombre_barberia: shopConfig?.nombre_barberia || 'The Barber Club',
    telefono_barberia: shopConfig?.telefono_barberia || '+57 300 123 4567',
    direccion_barberia: shopConfig?.direccion_barberia || 'Calle Principal # 10 - 20',
    pin_admin: ''
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    setError('');

    try {
      const payload = { ...form };
      if (!payload.pin_admin) delete payload.pin_admin; // no sobreescribir si lo dejó vacío

      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar la configuración');
        return;
      }

      setMensaje('Configuración guardada correctamente.');
      setForm(prev => ({ ...prev, pin_admin: '' }));
      onConfigActualizada();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Ajustes de la Barbería
        </h3>
        <p className="text-xs text-slate-400">
          Personaliza los datos de tu establecimiento y el PIN de acceso administrativo.
        </p>
      </div>

      {mensaje && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleGuardar} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Nombre de la Barbería
          </label>
          <input
            type="text"
            required
            value={form.nombre_barberia}
            onChange={(e) => setForm({ ...form, nombre_barberia: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Teléfono / WhatsApp Oficial de la Barbería
          </label>
          <input
            type="text"
            required
            placeholder="+57 300 123 4567"
            value={form.telefono_barberia}
            onChange={(e) => setForm({ ...form, telefono_barberia: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            A este número los clientes enviarán su confirmación automática al reservar.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Dirección del Local
          </label>
          <input
            type="text"
            value={form.direccion_barberia}
            onChange={(e) => setForm({ ...form, direccion_barberia: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            Cambiar PIN de Acceso Administrador
          </label>
          <input
            type="password"
            placeholder="Dejar en blanco para mantener el actual"
            value={form.pin_admin}
            onChange={(e) => setForm({ ...form, pin_admin: e.target.value })}
            className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-sm font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            PIN numérico para ingresar al panel de control (ej: 1234).
          </p>
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          <Save className="w-4 h-4" />
          <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </form>
    </div>
  );
}
