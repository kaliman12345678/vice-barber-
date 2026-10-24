import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Play, 
  Image as ImageIcon, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Video,
  Sparkles,
  Upload
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';

export default function AdminMediaManager({ barberos }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Formulario nuevo
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'imagen',
    url_media: '',
    url_red_social: '',
    descripcion: '',
    barbero_id: ''
  });

  const [guardando, setGuardando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function handleSubirArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
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
        setError(data.error || 'Error al subir archivo');
        return;
      }

      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)$/i);
      setForm(prev => ({
        ...prev,
        url_media: data.url,
        tipo: isVideo ? 'video' : 'imagen'
      }));
    } catch (err) {
      setError('Error de conexión al subir el archivo');
    } finally {
      setSubiendoArchivo(false);
    }
  }

  useEffect(() => {
    cargarItems();
  }, []);

  async function cargarItems() {
    setCargando(true);
    try {
      const res = await fetch('/api/multimedia?todos=true');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevo() {
    setEditando(null);
    setForm({
      titulo: '',
      tipo: 'imagen',
      url_media: '',
      url_red_social: '',
      descripcion: '',
      barbero_id: ''
    });
    setError('');
    setModalAbierto(true);
  }

  function abrirEditar(item) {
    setEditando(item);
    setForm({
      titulo: item.titulo,
      tipo: item.tipo || 'imagen',
      url_media: item.url_media,
      url_red_social: item.url_red_social || '',
      descripcion: item.descripcion || '',
      barbero_id: item.barbero_id || ''
    });
    setError('');
    setModalAbierto(true);
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url_media.trim()) {
      setError('Título y URL multimedia son obligatorios');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const url = editando ? `/api/multimedia/${editando.id}` : '/api/multimedia';
      const method = editando ? 'PUT' : 'POST';

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
      setMensaje(editando ? 'Publicación actualizada' : 'Publicación agregada con éxito');
      setTimeout(() => setMensaje(''), 4000);
      cargarItems();
    } catch (err) {
      setError('Error al comunicar con el servidor');
    } finally {
      setGuardando(false);
    }
  }

  async function handleToggleActivo(item) {
    const nuevoEstado = item.activo ? 0 : 1;
    try {
      await fetch(`/api/multimedia/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
      cargarItems();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Deseas eliminar esta publicación de la galería?')) return;
    try {
      const res = await fetch(`/api/multimedia/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarItems();
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
          <h3 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            <InstagramIcon className="w-5 h-5 text-pink-400" />
            Galería & Contenido de Redes Sociales
          </h3>
          <p className="text-xs text-slate-400">
            Administra las fotos, videos y enlaces de Instagram/TikTok que tus clientes verán en la página de inicio sin salir de la app.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Publicación</span>
        </button>
      </div>

      {mensaje && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
              item.activo
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                : 'bg-slate-950/60 border-slate-800/60 opacity-60'
            }`}
          >
            <div>
              {/* Vista previa */}
              <div className="relative aspect-video bg-black overflow-hidden">
                {item.tipo === 'video' || item.url_media.endsWith('.mp4') ? (
                  <video
                    src={item.url_media}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={item.url_media}
                    alt={item.titulo}
                    className="w-full h-full object-cover"
                  />
                )}

                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold uppercase text-white border border-white/10">
                  {item.tipo}
                </div>

                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.activo ? 'bg-emerald-500/80 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.activo ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-white text-sm">
                  {item.titulo}
                </h4>
                {item.descripcion && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {item.descripcion}
                  </p>
                )}
                {item.barbero_nombre && (
                  <p className="text-[11px] text-amber-400 font-semibold">
                    ✂️ Barbero: {item.barbero_nombre}
                  </p>
                )}
                {item.url_red_social && (
                  <a
                    href={item.url_red_social}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:underline"
                  >
                    <span>Ver enlace en redes</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs bg-slate-950/40">
              <button
                onClick={() => handleToggleActivo(item)}
                className="text-slate-400 hover:text-white font-medium"
              >
                {item.activo ? 'Ocultar' : 'Mostrar'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => abrirEditar(item)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEliminar(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {items.length === 0 && !cargando && (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl text-slate-500">
          <InstagramIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No hay publicaciones de redes sociales agregadas aún.</p>
          <p className="text-xs mt-1">Agrega fotos de cortes o videos para que tus clientes se inspiren antes de agendar.</p>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PUBLICACIÓN */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1 font-serif">
              {editando ? 'Editar Publicación' : 'Nueva Publicación para la Galería'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Agrega una foto o video de tus cortes para inspirar a tus clientes en el agendamiento.
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
                  Título del Corte / Estilo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Low Fade con Texturizado Mate"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Tipo de Contenido
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="imagen">Foto / Imagen</option>
                    <option value="video">Video (MP4 / WebM)</option>
                    <option value="instagram">Instagram Reel / Post</option>
                    <option value="youtube">YouTube Short / Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Barbero que lo Realizó
                  </label>
                  <select
                    value={form.barbero_id}
                    onChange={(e) => setForm({ ...form, barbero_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">Ninguno / General</option>
                    {barberos.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zona de Subida de Archivo desde Celular / PC */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-amber-400 uppercase">
                  Subir Foto o Video desde tu Dispositivo
                </label>
                <div className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-amber-500/60 transition-colors text-center relative overflow-hidden">
                  <input
                    type="file"
                    id="media-file-upload"
                    accept="image/*,video/*"
                    className="hidden"
                    disabled={subiendoArchivo}
                    onChange={handleSubirArchivo}
                  />
                  <label
                    htmlFor="media-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Upload className={`w-6 h-6 ${subiendoArchivo ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        {subiendoArchivo ? 'Subiendo y guardando...' : 'Seleccionar desde galería o cámara'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Quedará guardado en la carpeta local de la barbería (<code className="text-amber-400">server/uploads</code>)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Vista previa si ya tiene archivo cargado */}
              {form.url_media && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-black overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
                    {form.tipo === 'video' || form.url_media.endsWith('.mp4') ? (
                      <video src={form.url_media} className="w-full h-full object-cover" />
                    ) : (
                      <img src={form.url_media} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="text-emerald-400 font-bold block flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Archivo listo
                    </span>
                    <span className="text-slate-400 text-[11px] truncate block font-mono">
                      {form.url_media}
                    </span>
                  </div>
                </div>
              )}

              {/* Opción alternativa: URL externa directa */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  O pegar enlace web directo (Opcional si subiste archivo)
                </label>
                <input
                  type="text"
                  placeholder="https://... o ruta del archivo"
                  value={form.url_media}
                  onChange={(e) => setForm({ ...form, url_media: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Link de la Publicación en Instagram / Redes (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/p/... o perfil"
                  value={form.url_red_social}
                  onChange={(e) => setForm({ ...form, url_red_social: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Descripción o Recomendación del Corte
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalles del degradado, cera recomendada, tipo de cabello ideal..."
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
                  {guardando ? 'Guardando...' : 'Guardar Publicación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
