import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  User, 
  History,
  Boxes
} from 'lucide-react';
import { formatCOP, getTodayStr } from '../utils/helpers';

export default function AdminProductos({ barberos = [] }) {
  // Pestañas: 'productos' o 'ventas'
  const [tab, setTab] = useState('productos');

  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Modal para Crear/Editar Producto
  const [modalProducto, setModalProducto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [formProd, setFormProd] = useState({
    nombre: '',
    foto_url: '',
    stock: 10,
    precio_venta: '',
    costo_compra: '',
    porcentaje_comision: 10,
    categoria: 'Cuidado Capilar',
    descripcion: ''
  });

  // Modal para Registrar Venta
  const [modalVenta, setModalVenta] = useState(false);
  const [productoParaVender, setProductoParaVender] = useState(null);
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [barberoVendedorId, setBarberoVendedorId] = useState('');
  const [metodoPagoVenta, setMetodoPagoVenta] = useState('Efectivo');
  const [fechaVenta, setFechaVenta] = useState(getTodayStr());
  const [notasVenta, setNotasVenta] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarProductos();
    cargarVentas();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    try {
      const res = await fetch('/api/productos?todos=true');
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  async function cargarVentas() {
    try {
      const res = await fetch('/api/ventas-productos');
      const data = await res.json();
      setVentas(data);
    } catch (err) {
      console.error(err);
    }
  }

  function abrirNuevoProducto() {
    setEditando(null);
    setFormProd({
      nombre: '',
      foto_url: 'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=300&h=300&fit=crop',
      stock: 10,
      precio_venta: '',
      costo_compra: '',
      porcentaje_comision: 10,
      categoria: 'Cuidado Capilar',
      descripcion: ''
    });
    setError('');
    setModalProducto(true);
  }

  function abrirEditarProducto(p) {
    setEditando(p);
    setFormProd({
      nombre: p.nombre,
      foto_url: p.foto_url || '',
      stock: p.stock,
      precio_venta: p.precio_venta,
      costo_compra: p.costo_compra || 0,
      porcentaje_comision: p.porcentaje_comision || 10,
      categoria: p.categoria || 'General',
      descripcion: p.descripcion || ''
    });
    setError('');
    setModalProducto(true);
  }

  async function handleSubirFoto(e) {
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
        setError(data.error || 'Error al subir imagen');
        return;
      }
      setFormProd(prev => ({ ...prev, foto_url: data.url }));
    } catch (err) {
      setError('Error de conexión al subir imagen');
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function handleGuardarProducto(e) {
    e.preventDefault();
    if (!formProd.nombre.trim() || formProd.precio_venta === '') {
      setError('Nombre y precio de venta son obligatorios');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const url = editando ? `/api/productos/${editando.id}` : '/api/productos';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formProd)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar producto');
        return;
      }

      setModalProducto(false);
      setMensajeExito(editando ? 'Producto actualizado' : 'Producto creado con inventario');
      setTimeout(() => setMensajeExito(''), 4000);
      cargarProductos();
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarProducto(id) {
    if (!confirm('¿Deseas eliminar este producto del inventario?')) return;
    try {
      await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      cargarProductos();
    } catch (err) {
      console.error(err);
    }
  }

  // Abrir Modal de Venta Rápida
  function abrirModalVender(prod) {
    setProductoParaVender(prod);
    setCantidadVenta(1);
    setBarberoVendedorId(barberos[0]?.id || '');
    setMetodoPagoVenta('Efectivo');
    setFechaVenta(getTodayStr());
    setNotasVenta('');
    setError('');
    setModalVenta(true);
  }

  async function handleRegistrarVenta(e) {
    e.preventDefault();
    if (!productoParaVender || cantidadVenta <= 0) return;

    if (cantidadVenta > productoParaVender.stock) {
      setError(`Stock insuficiente. Solo hay ${productoParaVender.stock} unidades disponibles.`);
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const res = await fetch('/api/ventas-productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: productoParaVender.id,
          cantidad: Number(cantidadVenta),
          barbero_id: barberoVendedorId || null,
          metodo_pago: metodoPagoVenta,
          fecha: fechaVenta,
          notas: notasVenta.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al registrar venta');
        return;
      }

      setModalVenta(false);
      setMensajeExito(`¡Venta registrada con éxito! Ingreso sumado a caja y comisión calculada.`);
      setTimeout(() => setMensajeExito(''), 4500);
      cargarProductos();
      cargarVentas();
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  // Cálculos en vivo para el modal de venta
  const totalVentaPreview = (productoParaVender?.precio_venta || 0) * Number(cantidadVenta || 1);
  const comisionVendedorPreview = barberoVendedorId 
    ? Math.round(totalVentaPreview * ((productoParaVender?.porcentaje_comision || 0) / 100))
    : 0;
  const margenBarberiaPreview = totalVentaPreview - ((productoParaVender?.costo_compra || 0) * Number(cantidadVenta || 1)) - comisionVendedorPreview;

  return (
    <div className="space-y-6">
      
      {/* Encabezado y pestañas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            Productos, Inventario & Ventas
          </h3>
          <p className="text-xs text-slate-400">
            Control de stock en estantería, costos, precio de venta y comisiones para los barberos por vender productos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTab('productos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tab === 'productos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Catálogo & Stock ({productos.length})
            </button>
            <button
              onClick={() => setTab('ventas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                tab === 'ventas' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Historial de Ventas ({ventas.length})
            </button>
          </div>

          {tab === 'productos' && (
            <button
              onClick={abrirNuevoProducto}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 1: CATÁLOGO Y STOCK DE PRODUCTOS */}
      {/* ========================================================= */}
      {tab === 'productos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {productos.map((prod) => {
            const margenGanancia = prod.precio_venta - (prod.costo_compra || 0);
            const montoComisionUnit = Math.round(prod.precio_venta * ((prod.porcentaje_comision || 0) / 100));

            return (
              <div
                key={prod.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Foto del Producto & Badge de Stock */}
                  <div className="relative aspect-[4/3] bg-black overflow-hidden border-b border-slate-800">
                    <img
                      src={prod.foto_url || 'https://images.unsplash.com/photo-1598452963314-b09f397a5c48?w=300&h=300&fit=crop'}
                      alt={prod.nombre}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                        prod.stock > 5 
                          ? 'bg-emerald-500/90 text-white' 
                          : prod.stock > 0 
                          ? 'bg-amber-500/90 text-slate-950 font-black' 
                          : 'bg-rose-600/90 text-white'
                      }`}>
                        {prod.stock > 0 ? `Stock: ${prod.stock} unids` : 'Agotado'}
                      </span>
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 border border-white/10 uppercase">
                        {prod.categoria || 'Producto'}
                      </span>
                    </div>
                  </div>

                  {/* Detalles del Producto */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-white text-base line-clamp-1">
                        {prod.nombre}
                      </h4>
                      {prod.descripcion && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {prod.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Precios y Costos */}
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Precio de Venta al Público:</span>
                        <span className="text-base font-extrabold text-amber-400 font-serif">
                          {formatCOP(prod.precio_venta)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-400">
                        <span>Costo de Compra (Barbería):</span>
                        <span className="font-semibold text-slate-300">
                          {formatCOP(prod.costo_compra)}
                        </span>
                      </div>

                      <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-emerald-400 font-semibold">
                        <span>Margen Bruto de Ganancia:</span>
                        <span>{formatCOP(margenGanancia)}</span>
                      </div>

                      <div className="flex justify-between items-center text-amber-300/90 font-medium pt-0.5">
                        <span className="flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          Comisión por Venta ({prod.porcentaje_comision}%):
                        </span>
                        <span className="font-bold">{formatCOP(montoComisionUnit)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    disabled={prod.stock <= 0}
                    onClick={() => abrirModalVender(prod)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{prod.stock > 0 ? 'Registrar Venta' : 'Sin Stock'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditarProducto(prod)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar producto o inventario"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEliminarProducto(prod.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: HISTORIAL DE VENTAS DE PRODUCTOS */}
      {/* ========================================================= */}
      {tab === 'ventas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {ventas.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No se han registrado ventas de productos todavía.</p>
              <p className="text-xs mt-1">Cuando registres una venta, descontará stock y calculará comisiones automáticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Fecha</th>
                    <th className="py-3 px-4 font-semibold">Producto</th>
                    <th className="py-3 px-4 font-semibold text-center">Cant.</th>
                    <th className="py-3 px-4 font-semibold">Vendedor</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Venta</th>
                    <th className="py-3 px-4 font-semibold text-right">Comisión Barbero</th>
                    <th className="py-3 px-4 font-semibold text-right">Ganancia Barbería</th>
                    <th className="py-3 px-4 font-semibold">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {ventas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap font-medium">
                        {v.fecha}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold whitespace-nowrap flex items-center gap-2">
                        {v.producto_foto && (
                          <img src={v.producto_foto} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        )}
                        <span>{v.producto_nombre}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                        {v.cantidad}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {v.barbero_nombre ? `👤 ${v.barbero_nombre}` : <span className="text-slate-500">Recepción / Local</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right text-white font-black whitespace-nowrap">
                        {formatCOP(v.total_venta)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400 font-bold whitespace-nowrap">
                        {v.monto_comision > 0 ? formatCOP(v.monto_comision) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-bold whitespace-nowrap">
                        {formatCOP(v.ganancia_neta)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {v.metodo_pago}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {/* ========================================================= */}
      {modalProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              {editando ? 'Editar Producto & Inventario' : 'Nuevo Producto para la Venta'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configura el precio de venta, el costo de compra, el stock disponible y la comisión para quien lo venda.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGuardarProducto} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cera Modeladora Mate, Aceite para Barba..."
                  value={formProd.nombre}
                  onChange={(e) => setFormProd({ ...formProd, nombre: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Foto del Producto con Subida Directa */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-amber-400 uppercase">
                  Foto del Producto
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formProd.foto_url ? (
                      <img src={formProd.foto_url} alt="Producto" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="foto-prod-upload"
                      accept="image/*"
                      className="hidden"
                      disabled={subiendoFoto}
                      onChange={handleSubirFoto}
                    />
                    <label
                      htmlFor="foto-prod-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
                    >
                      <Upload className={`w-3.5 h-3.5 ${subiendoFoto ? 'animate-bounce' : ''}`} />
                      <span>{subiendoFoto ? 'Subiendo foto...' : 'Subir foto desde celular/PC'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder="O pegar URL de imagen..."
                      value={formProd.foto_url}
                      onChange={(e) => setFormProd({ ...formProd, foto_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Precios y Stock en columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                    Precio Venta (COP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="Ej. 35000"
                    value={formProd.precio_venta}
                    onChange={(e) => setFormProd({ ...formProd, precio_venta: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Costo Compra (COP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    placeholder="Ej. 18000"
                    value={formProd.costo_compra}
                    onChange={(e) => setFormProd({ ...formProd, costo_compra: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-amber-400" />
                    Inventario (Stock Inicial) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ej. 15"
                    value={formProd.stock}
                    onChange={(e) => setFormProd({ ...formProd, stock: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-extrabold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    % Comisión al Vendedor *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    required
                    placeholder="Ej. 10"
                    value={formProd.porcentaje_comision}
                    onChange={(e) => setFormProd({ ...formProd, porcentaje_comision: e.target.value })}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    value={formProd.categoria}
                    onChange={(e) => setFormProd({ ...formProd, categoria: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cuidado Capilar">Cuidado Capilar</option>
                    <option value="Cuidado de Barba">Cuidado de Barba</option>
                    <option value="Afeitado Clásico">Afeitado Clásico</option>
                    <option value="Accesorios & Cuidado">Accesorios & Cuidado</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Descripción Corta
                  </label>
                  <input
                    type="text"
                    placeholder="Detalles del producto..."
                    value={formProd.descripcion}
                    onChange={(e) => setFormProd({ ...formProd, descripcion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalProducto(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL REGISTRAR VENTA RÁPIDA */}
      {/* ========================================================= */}
      {modalVenta && productoParaVender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 font-serif flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              Registrar Venta de Producto
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Descuenta inventario automáticamente y asigna la comisión al barbero vendedor.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegistrarVenta} className="space-y-3.5 text-sm">
              
              {/* Resumen del Producto */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
                <img
                  src={productoParaVender.foto_url}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <h4 className="font-bold text-white truncate">{productoParaVender.nombre}</h4>
                  <p className="text-amber-400 font-extrabold">{formatCOP(productoParaVender.precio_venta)} c/u</p>
                  <p className="text-slate-400 text-[11px]">Stock actual: {productoParaVender.stock} unidades</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cantidad a Vender *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={productoParaVender.stock}
                    required
                    value={cantidadVenta}
                    onChange={(e) => setCantidadVenta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-400 uppercase mb-1">
                    ¿Quién lo Vendió? *
                  </label>
                  <select
                    value={barberoVendedorId}
                    onChange={(e) => setBarberoVendedorId(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">🏢 Venta de la Barbería (Sin comisión)</option>
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>👤 {b.nombre} ({productoParaVender.porcentaje_comision}% com.)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPagoVenta}
                    onChange={(e) => setMetodoPagoVenta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Efectivo">Efectivo en caja</option>
                    <option value="Transferencia / Nequi">Transferencia / Nequi</option>
                    <option value="Tarjeta / Datáfono">Tarjeta / Datáfono</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaVenta}
                    onChange={(e) => setFechaVenta(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cálculo en vivo de la venta */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total a cobrar:</span>
                  <span className="font-extrabold text-white text-sm">{formatCOP(totalVentaPreview)}</span>
                </div>
                {barberoVendedorId && (
                  <div className="flex justify-between text-amber-400">
                    <span>Comisión para el barbero ({productoParaVender.porcentaje_comision}%):</span>
                    <span className="font-bold">{formatCOP(comisionVendedorPreview)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Ganancia neta para la barbería:</span>
                  <span>{formatCOP(margenBarberiaPreview)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalVenta(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{guardando ? 'Guardando...' : 'Confirmar Venta'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
