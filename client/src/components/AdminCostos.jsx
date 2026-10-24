import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  CreditCard, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  User
} from 'lucide-react';
import { formatCOP, formatDateReadable, getTodayStr } from '../utils/helpers';

const CATEGORIAS_EGRESO = [
  'Insumos / Productos',
  'Arriendo del Local',
  'Servicios Públicos (Luz, Agua, Internet)',
  'Mantenimiento & Herramientas',
  'Nómina / Sueldos Fijos',
  'Publicidad & Marketing',
  'Otros Gastos'
];

const CATEGORIAS_INGRESO = [
  'Cliente presencial (No agendado en app)',
  'Venta de productos en local',
  'Servicio adicional / Extra',
  'Propina / Bono voluntario',
  'Otros ingresos'
];

export default function AdminCostos({ barberos = [] }) {
  const [movimientos, setMovimientos] = useState([]);
  const [totalEgresos, setTotalEgresos] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [balanceNeto, setBalanceNeto] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'ingreso', 'egreso'

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState('egreso'); // 'egreso' o 'ingreso'
  const [categoria, setCategoria] = useState(CATEGORIAS_EGRESO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [montoCop, setMontoCop] = useState('');
  const [fecha, setFecha] = useState(getTodayStr());
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [barberoId, setBarberoId] = useState('');
  const [notas, setNotas] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarMovimientos();
  }, []);

  async function cargarMovimientos() {
    setCargando(true);
    try {
      const res = await fetch('/api/costos');
      const data = await res.json();
      setMovimientos(data.costos || []);
      setTotalEgresos(data.total_egresos || 0);
      setTotalIngresos(data.total_ingresos || 0);
      setBalanceNeto(data.balance_neto !== undefined ? data.balance_neto : ((data.total_ingresos || 0) - (data.total_egresos || 0)));
    } catch (err) {
      console.error('Error cargando movimientos de caja:', err);
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(tipo) {
    setTipoMovimiento(tipo);
    setCategoria(tipo === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]);
    setDescripcion('');
    setMontoCop('');
    setBarberoId('');
    setNotas('');
    setError('');
    setModalAbierto(true);
  }

  async function handleGuardarMovimiento(e) {
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
          tipo: tipoMovimiento,
          categoria,
          descripcion: descripcion.trim(),
          monto_cop: montoCop,
          fecha,
          metodo_pago: metodoPago,
          barbero_id: barberoId || null,
          notas: notas.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo guardar el movimiento');
        return;
      }

      setModalAbierto(false);
      cargarMovimientos();
    } catch (err) {
      setError('Error de comunicación con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Deseas eliminar este registro de movimiento?')) return;
    try {
      const res = await fetch(`/api/costos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarMovimientos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroTipo === 'todos') return true;
    return (m.tipo || 'egreso') === filtroTipo;
  });

  return (
    <div className="space-y-6">
      
      {/* Encabezado y botones de acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            Control de Caja: Ingresos & Egresos
          </h3>
          <p className="text-xs text-slate-400">
            Registra gastos operativos y también ingresos por clientes presenciales (no agendados), propinas o ventas directas.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => abrirModal('ingreso')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Registrar Ingreso</span>
          </button>

          <button
            onClick={() => abrirModal('egreso')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>- Registrar Egreso</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Ingresos */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-900/40 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Ingresos Registrados (+)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-serif">
            {formatCOP(totalIngresos)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Presenciales, ventas y extras</p>
        </div>

        {/* Total Egresos */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Egresos & Costos (-)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 font-serif">
            {formatCOP(totalEgresos)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Insumos, arriendo y servicios</p>
        </div>

        {/* Balance en Caja */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Balance Neto en Caja (=)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl sm:text-3xl font-black font-serif ${balanceNeto >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {formatCOP(balanceNeto)}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">Diferencia neta en efectivo/caja</p>
        </div>

      </div>

      {/* Filtros de Lista */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setFiltroTipo('todos')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroTipo === 'todos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({movimientos.length})
          </button>
          <button
            onClick={() => setFiltroTipo('ingreso')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroTipo === 'ingreso' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Solo Ingresos (+)
          </button>
          <button
            onClick={() => setFiltroTipo('egreso')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              filtroTipo === 'egreso' ? 'bg-rose-500 text-slate-950' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            Solo Egresos (-)
          </button>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {cargando ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Cargando movimientos...
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No hay movimientos registrados para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tipo</th>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Descripción / Concepto</th>
                  <th className="py-3 px-4 font-semibold">Barbero</th>
                  <th className="py-3 px-4 font-semibold">Método</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {movimientosFiltrados.map((m) => {
                  const esIngreso = m.tipo === 'ingreso';
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          esIngreso
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {esIngreso ? '+ Ingreso' : '- Egreso'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-medium">
                        {m.fecha}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700">
                          {m.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium">
                        <div>
                          <span>{m.descripcion}</span>
                          {m.notas && <p className="text-[11px] text-slate-400 italic mt-0.5">{m.notas}</p>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {m.barbero_nombre ? `👤 ${m.barbero_nombre}` : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {m.metodo_pago}
                      </td>
                      <td className={`py-3.5 px-4 font-extrabold text-right whitespace-nowrap text-sm ${
                        esIngreso ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {esIngreso ? '+' : '-'}{formatCOP(m.monto_cop)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEliminar(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR MOVIMIENTO (INGRESO O EGRESO) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${tipoMovimiento === 'ingreso' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <h3 className="text-lg font-bold text-white font-serif">
                {tipoMovimiento === 'ingreso' ? 'Registrar Ingreso de Caja' : 'Registrar Egreso / Gasto'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {tipoMovimiento === 'ingreso'
                ? 'Registra cobros por clientes presenciales no agendados, venta de insumos o propinas.'
                : 'Ingresa gastos de insumos, servicios, arriendo o mantenimiento.'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGuardarMovimiento} className="space-y-3.5 text-sm">
              
              {/* Selector de Tipo */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTipoMovimiento('ingreso');
                    setCategoria(CATEGORIAS_INGRESO[0]);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tipoMovimiento === 'ingreso' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400'
                  }`}
                >
                  + Ingreso (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoMovimiento('egreso');
                    setCategoria(CATEGORIAS_EGRESO[0]);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tipoMovimiento === 'egreso' ? 'bg-rose-500 text-white shadow' : 'text-slate-400'
                  }`}
                >
                  - Egreso (Gasto)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Categoría / Concepto *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  {(tipoMovimiento === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Descripción del Movimiento *
                </label>
                <input
                  type="text"
                  required
                  placeholder={tipoMovimiento === 'ingreso' ? 'Ej. Cliente Carlos López corte fade directo en local' : 'Ej. Caja de cuchillas Dorco x100'}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase mb-1 ${
                    tipoMovimiento === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    Monto (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Ej. 25000"
                    value={montoCop}
                    onChange={(e) => setMontoCop(e.target.value)}
                    className={`w-full bg-slate-950 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none border ${
                      tipoMovimiento === 'ingreso' ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'
                    }`}
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
                    Barbero (Opcional)
                  </label>
                  <select
                    value={barberoId}
                    onChange={(e) => setBarberoId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Ninguno / Caja General</option>
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia / Nequi / Daviplata">Transferencia / Nequi</option>
                    <option value="Tarjeta / Datáfono">Tarjeta / Datáfono</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Notas adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalles extras o comprobante..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
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
                  className={`flex-1 py-2.5 rounded-xl font-bold text-slate-950 disabled:opacity-50 transition-all ${
                    tipoMovimiento === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {guardando ? 'Guardando...' : `Guardar ${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
