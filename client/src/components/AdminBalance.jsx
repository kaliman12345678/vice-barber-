import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Scissors, ShieldAlert, Sparkles, Calendar } from 'lucide-react';
import { formatCOP, getTodayStr } from '../utils/helpers';

export default function AdminBalance() {
  const [balance, setBalance] = useState({
    total_ingresos: 0,
    total_servicios: 0,
    total_comisiones_pagadas: 0,
    total_costos_operativos: 0,
    margen_barberia: 0,
    ganancia_neta: 0
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarBalance();
  }, []);

  async function cargarBalance() {
    setCargando(true);
    try {
      const res = await fetch('/api/reportes/balance');
      const data = await res.json();
      setBalance(data);
    } catch (err) {
      console.error('Error cargando balance:', err);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6">
      
      <div>
        <h3 className="text-xl font-bold text-white font-serif">
          Balance Financiero y Rentabilidad
        </h3>
        <p className="text-xs text-slate-400">
          Resumen consolidado de ingresos por servicios, comisiones a barberos, costos operativos y beneficio neto.
        </p>
      </div>

      {cargando ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Calculando métricas...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Tarjeta Destacada: Ganancia Neta */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                  Beneficio Neto de la Barbería
                </span>
                <h4 className="text-3xl sm:text-4xl font-black text-white font-serif mt-1">
                  {formatCOP(balance.ganancia_neta)}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Resultado luego de pagar comisiones y descontar los costos operativos del negocio.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-xs space-y-1 sm:text-right">
                <span className="text-slate-400 block">Cortes cobrados:</span>
                <span className="text-xl font-bold text-amber-400">{balance.total_servicios} servicios</span>
              </div>
            </div>
          </div>

          {/* Tarjetas Secundarias */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Ingresos Brutos
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-serif">
                {formatCOP(balance.total_ingresos)}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Recaudación por servicios completados
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Comisiones Barberos
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Scissors className="w-5 h-5" />
                </div>
              </div>
              <span className="text-2xl font-black text-amber-400 font-serif">
                {formatCOP(balance.total_comisiones_pagadas)}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Pagado por liquidaciones de porcentaje
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Costos Operativos
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <span className="text-2xl font-black text-rose-400 font-serif">
                {formatCOP(balance.total_costos_operativos)}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Gastos fijos, insumos y mantenimiento
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
