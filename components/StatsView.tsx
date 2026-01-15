"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsProps {
  logs: any[];
  categories: any[];
}

export default function StatsView({ logs, categories }: StatsProps) {
  // 1. Procesar datos: Sumar minutos por categoría
  const chartData = categories.map(cat => {
    const totalMinutes = logs
      .filter(log => log.category_id === cat.id)
      .reduce((acc, log) => {
        const start = new Date(log.start_time).getTime();
        const end = log.end_time ? new Date(log.end_time).getTime() : Date.now();
        return acc + (end - start) / 60000;
      }, 0);

    // Formatear para visualización (ej: 1h 20m)
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    const timeLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;

    return {
      name: cat.name,
      value: Math.round(totalMinutes), // Recharts necesita números para el gráfico
      timeLabel: timeLabel,            // Para la leyenda textual
      color: cat.color || '#8b5cf6',
      emoji: cat.emoji
    };
  }).filter(data => data.value > 0);

  // Estado vacío si no hay logs hoy
  if (chartData.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center min-h-[400px]">
        <span className="text-4xl mb-4 opacity-50">📊</span>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center">
          Sin datos de actividad para este día
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-md min-h-[400px] w-full animate-in fade-in zoom-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* COLUMNA IZQUIERDA: EL GRÁFICO (Visual) */}
        <div className="relative h-[300px] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Inversión</span>
            <span className="text-2xl font-black italic text-white">TOTAL</span>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={85}
                outerRadius={115}
                paddingAngle={8}
                dataKey="value"
                animationBegin={0}
                animationDuration={1200}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    strokeWidth={0}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ fill: 'transparent' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* COLUMNA DERECHA: MÉTRICAS (Detalle) */}
        <div className="space-y-6">
          <header>
            <h3 className="text-purple-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">
              Análisis de Impacto
            </h3>
            <p className="text-zinc-400 text-xs font-medium">Distribución precisa de tus operaciones.</p>
          </header>

          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {chartData.sort((a,b) => b.value - a.value).map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-300 group-hover:text-white transition-colors">
                      {item.name}
                    </p>
                    <div className="w-20 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ width: '100%', backgroundColor: item.color, opacity: 0.6 }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-white">{item.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}