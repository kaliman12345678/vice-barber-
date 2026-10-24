import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Tag, CreditCard, AlertCircle, TrendingDown } from 'lucide-react';
import { formatCOP, formatDateReadable, getTodayStr } from '../utils/helpers';

const CATEGORIAS_GASTO = [
  'Insumos / Productos',
  'Arriendo del Local',
  'Servicios Públicos (Luz, Agua, Internet)',
  'Mantenimiento & Herramientas',
  'Nómina / Sueldos Fijos',
  'Publicidad & Marketing',
  'Otros Gastos'
];

export default function AdminCostos() {
  const [costos, setCostos] = useState([]);
  const [totalCostos, setTotalCostos] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Formulario nuevo gasto
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [montoCop, setMontoCop] = useState('');
  const [fecha, setFecha] = useState(getTodayStr());
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCostos();
  }, []);

  async function cargarCostos() {
    setCargando(true);
    try {
      const res = await fetch('/api/costos');
      const data = await res.json();
      setCostos(data.costos || []);
      setTotalCostos(data.total || 0);
    } catch (err) {
      console.error('Error cargando costos:', err);
    } finally {
      setCargando(false);
    }
  }

  async function handleCrearCosto(e) {
    e.preventDefault();
    if (!descripcion.trim() || !montoCop || !fecha) {
      setError('Descripción, monto y fecha son obligatorios');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const res = await fetch('/api/costos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria,
          descripcion: descripcion.trim(),
          monto_cop: montoCop,
          fecha,
          metodo_pago: metodoPago,
          notas: notas.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar el gasto');
        return;
      }

      setModalAbierto(false);
      setDescripcion('');
      setMontoCop('');
      setNotas('');
      cargarCostos();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Deseas eliminar este registro de gasto?')) return;
    try {
      const res = await fetch(`/api/costos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarCostos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado y resumen de gastos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-serif">
            Área de Costos y Egresos Operativos
          </h3>
          <p className="text-xs text-slate-400">
            Control de insumos, servicios, arriendo y gastos generales de la barbería.
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setModalAbierto(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Tarjeta de Total de Costos */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider block">
              Total Egresos Registrados
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-400 font-serif">
              {formatCOP(totalCostos)}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-medium bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          {costos.length} {costos.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Tabla de Gastos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {cargando ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Cargando gastos...
          </div>
        ) : costos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No hay costos ni gastos registrados todavía.</p>
            <p className="text-xs mt-1">Registra aquí las compras de insumos, facturas o servicios de tu barbería.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Descripción</th>
                  <th className="py-3 px-4 font-semibold">Método</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {costos.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-medium">
                      {c.fecha}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">
                      <div>
                        <span>{c.descripcion}</span>
                        {c.notas && <p className="text-[11px] text-slate-400 italic mt-0.5">{c.notas}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {c.metodo_pago}
                    </td>
                    <td className="py-3.5 px-4 text-rose-400 font-extrabold text-right whitespace-nowrap text-sm">
                      {formatCOP(c.monto_cop)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEliminar(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR GASTO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              Registrar Gasto Operativo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa los detalles del desembolso para el control financiero.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCrearCosto} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIAS_GASTO.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Descripción del Gasto / Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cuchillas Dorco, Factura de energía, Toallas..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-rose-400 uppercase mb-1">
                    Monto (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Ej. 65000"
                    value={montoCop}
                    onChange={(e) => setMontoCop(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-900/60 rounded-xl px-3 py-2 text-white font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia / Nequi / Daviplata">Transferencia / Nequi</option>
                    <option value="Tarjeta / Datáfono">Tarjeta / Datáfono</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Nota o Comprobante
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
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
                  {guardando ? 'Guardando...' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
