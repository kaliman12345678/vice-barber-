import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Eye, 
  X, 
  ExternalLink, 
  Scissors, 
  Sparkles, 
  User, 
  Film, 
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';

export default function ClientMediaFeed({ onSeleccionarBarbero }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);

  useEffect(() => {
    cargarMedia();
  }, []);

  async function cargarMedia() {
    setCargando(true);
    try {
      const res = await fetch('/api/multimedia');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error cargando multimedia:', err);
    } finally {
      setCargando(false);
    }
  }

  if (items.length === 0 && !cargando) {
    return null; // Si no hay publicaciones, no mostramos el bloque
  }

  // Helper para detectar si es video directo (mp4/webm) o embed
  function isDirectVideo(url) {
    return url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video'));
  }

  // Helper para convertir links de YouTube a embed
  function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  }

  return (
    <div className="mb-10 animate-fadeIn">
      
      {/* Encabezado de la Galería */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-rose-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Tendencias & Redes Sociales</span>
          </div>
          <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
            Trabajos & Estilos Reales
          </h2>
          <p className="text-xs text-slate-400">
            Mira los últimos cortes realizados por nuestros barberos sin salir de la página
          </p>
        </div>
      </div>

      {/* Carrusel de Miniaturas Interactivas (Deslizable en móvil) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const esVideo = item.tipo === 'video' || isDirectVideo(item.url_media);
          return (
            <div
              key={item.id}
              onClick={() => setItemSeleccionado(item)}
              className="flex-shrink-0 w-64 sm:w-72 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group overflow-hidden shadow-lg hover:shadow-amber-500/10 relative flex flex-col"
            >
              {/* Contenedor Multimedia */}
              <div className="relative aspect-square sm:aspect-[4/3] bg-slate-950 overflow-hidden">
                {esVideo ? (
                  <video
                    src={item.url_media}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                    onMouseLeave={(e) => e.target.pause()}
                  />
                ) : (
                  <img
                    src={item.url_media}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}

                {/* Badge de Tipo */}
                <div className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md text-white border border-white/10 shadow-lg">
                  {esVideo ? (
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ) : item.tipo === 'instagram' ? (
                    <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>

                {/* Overlay hover con botón Ver */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Estilo</span>
                  </span>
                </div>
              </div>

              {/* Información de la publicación */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {item.titulo}
                  </h3>
                  {item.descripcion && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}
                </div>

                {item.barbero_nombre && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-amber-500" />
                      Por: <strong className="text-slate-200">{item.barbero_nombre}</strong>
                    </span>
                    <span className="text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                      Ver →
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / VISOR MULTIMEDIA SIN SALIR DE LA PÁGINA */}
      {itemSeleccionado && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setItemSeleccionado(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button
              onClick={() => setItemSeleccionado(null)}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Contenido Visual (Video o Imagen o Embed) */}
            <div className="relative bg-black flex items-center justify-center max-h-[55vh] sm:max-h-[60vh] overflow-hidden">
              {itemSeleccionado.tipo === 'youtube' ? (
                <iframe
                  src={getYouTubeEmbedUrl(itemSeleccionado.url_media)}
                  title={itemSeleccionado.titulo}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : itemSeleccionado.tipo === 'video' || isDirectVideo(itemSeleccionado.url_media) ? (
                <video
                  src={itemSeleccionado.url_media}
                  controls
                  autoPlay
                  playsInline
                  className="w-full max-h-[55vh] object-contain"
                />
              ) : (
                <img
                  src={itemSeleccionado.url_media}
                  alt={itemSeleccionado.titulo}
                  className="w-full max-h-[55vh] object-contain"
                />
              )}
            </div>

            {/* Detalles & Acciones del Cliente */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                    {itemSeleccionado.titulo}
                  </h3>
                  {itemSeleccionado.barbero_nombre && (
                    <p className="text-xs text-amber-400 mt-1 font-semibold flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5" />
                      Corte realizado por: {itemSeleccionado.barbero_nombre}
                    </p>
                  )}
                </div>

                {itemSeleccionado.url_red_social && (
                  <a
                    href={itemSeleccionado.url_red_social}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/20 text-xs font-semibold transition-colors"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    <span>Ver en Redes</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {itemSeleccionado.descripcion && (
                <p className="text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
                  {itemSeleccionado.descripcion}
                </p>
              )}

              {/* Botón directo para Agendar este Estilo */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    if (itemSeleccionado.barbero_id && onSeleccionarBarbero) {
                      onSeleccionarBarbero(itemSeleccionado.barbero_id);
                    }
                    setItemSeleccionado(null);
                    // Desplazar suavemente hacia la sección de reserva
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Scissors className="w-4 h-4" />
                  <span>¡Me gusta este corte! Agendar mi Turno</span>
                </button>

                <button
                  onClick={() => setItemSeleccionado(null)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Seguir viendo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
