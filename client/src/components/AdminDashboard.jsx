import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Ban, 
  Users, 
  Scissors, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Settings,
  Sparkles
} from 'lucide-react';
import InstagramIcon from './InstagramIcon';
import AdminAgenda from './AdminAgenda';
import AdminBloqueos from './AdminBloqueos';
import AdminBarberos from './AdminBarberos';
import AdminServicios from './AdminServicios';
import AdminCostos from './AdminCostos';
import AdminLiquidaciones from './AdminLiquidaciones';
import AdminBalance from './AdminBalance';
import AdminConfig from './AdminConfig';
import AdminMediaManager from './AdminMediaManager';

export default function AdminDashboard({ shopConfig, onConfigActualizada }) {
  const [activeTab, setActiveTab] = useState('agenda');
  const [barberos, setBarberos] = useState([]);
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      const [resB, resS] = await Promise.all([
        fetch('/api/barberos?todos=true'),
        fetch('/api/servicios?todos=true')
      ]);
      const dataB = await resB.json();
      const dataS = await resS.json();
      setBarberos(dataB);
      setServicios(dataS);
    } catch (err) {
      console.error(err);
    }
  }

  const tabs = [
    { id: 'agenda', label: 'Agenda & Citas', icon: Calendar },
    { id: 'bloqueos', label: 'Bloquear Horarios', icon: Ban },
    { id: 'liquidaciones', label: 'Plantilla de Pagos (%)', icon: Percent, badge: 'Principal' },
    { id: 'costos', label: 'Costos y Egresos', icon: DollarSign },
    { id: 'barberos', label: 'Barberos', icon: Users },
    { id: 'servicios', label: 'Servicios', icon: Scissors },
    { id: 'media', label: 'Galería & Redes', icon: InstagramIcon, badge: 'Social' },
    { id: 'balance', label: 'Balance Financiero', icon: TrendingUp },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navegación por pestañas (scrollable en móviles) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="animate-fadeIn">
        {activeTab === 'agenda' && (
          <AdminAgenda 
            barberos={barberos.filter(b => b.activo)} 
            servicios={servicios.filter(s => s.activo)} 
          />
        )}

        {activeTab === 'bloqueos' && (
          <AdminBloqueos 
            barberos={barberos} 
          />
        )}

        {activeTab === 'liquidaciones' && (
          <AdminLiquidaciones 
            barberos={barberos} 
            shopConfig={shopConfig} 
          />
        )}

        {activeTab === 'costos' && (
          <AdminCostos />
        )}

        {activeTab === 'barberos' && (
          <AdminBarberos 
            barberos={barberos} 
            onRecargar={cargarCatalogos} 
          />
        )}

        {activeTab === 'servicios' && (
          <AdminServicios 
            servicios={servicios} 
            onRecargar={cargarCatalogos} 
          />
        )}

        {activeTab === 'media' && (
          <AdminMediaManager 
            barberos={barberos} 
          />
        )}

        {activeTab === 'balance' && (
          <AdminBalance />
        )}

        {activeTab === 'config' && (
          <AdminConfig 
            shopConfig={shopConfig} 
            onConfigActualizada={onConfigActualizada} 
          />
        )}
      </div>

    </div>
  );
}
