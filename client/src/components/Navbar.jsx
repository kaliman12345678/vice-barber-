import React from 'react';
import { Scissors, ShieldCheck, Calendar, LogOut, Phone } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, isAdminLoggedIn, onLogout, shopName = 'The Barber Club', shopPhone = '' }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveView('client')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 text-slate-950 transform -rotate-45" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-slate-100 uppercase block font-serif">
                {shopName}
              </span>
              <span className="text-xs text-amber-400 font-medium tracking-widest block -mt-1">
                RESERVA DE TURNOS
              </span>
            </div>
          </div>

          {/* Menú según el tipo de usuario */}
          {isAdminLoggedIn ? (
            /* Controles exclusivos para el Administrador autenticado */
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveView('client')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeView === 'client'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Vista Cliente</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeView === 'admin'
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Panel Dueño</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión de administrador"
                className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors text-xs font-semibold border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            /* Vista para clientes comunes: SIN BOTÓN DE PANEL DE DUEÑO */
            <div className="flex items-center gap-3">
              {shopPhone && (
                <a
                  href={`https://wa.me/${shopPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{shopPhone}</span>
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Turnos Disponibles</span>
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
