"use client";
import React, { useState, useEffect } from 'react';

interface TimeGridProps {
  logs: any[];
  categories: any[];
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM a 11 PM
const HOUR_HEIGHT = 80; // Píxeles por hora

export default function TimeGrid({ logs, categories }: TimeGridProps) {
  // 1. Cálculo de Posición Vertical
  const getVerticalPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // (Hora actual - 5 AM de inicio) * altura + proporción de minutos
    return (hours - 5) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  // 2. Estado para la línea de "Ahora"
  const [nowPos, setNowPos] = useState(0);

  useEffect(() => {
    const updatePos = () => setNowPos(getVerticalPosition(new Date().toISOString()));
    updatePos();
    const timer = setInterval(updatePos, 60000);
    return () => clearInterval(timer);
  }, []);

  // 3. Cálculos de Progreso Diario (Fuera del loop de logs)
  const totalMinutesInDay = 19 * 60;
  const loggedMinutes = logs.reduce((acc, log) => {
    const start = new Date(log.start_time).getTime();
    const end = log.end_time ? new Date(log.end_time).getTime() : Date.now();
    return acc + (end - start) / 60000;
  }, 0);

  const progressPercentage = Math.min(Math.round((loggedMinutes / totalMinutesInDay) * 100), 100);

  return (
    <div className="flex flex-col gap-4 h-full">
      
      {/* SECCIÓN A: Header de Progreso */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-5 flex items-center justify-between backdrop-blur-sm">
        <div>
          <h4 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Progreso del Día</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{progressPercentage}%</span>
            <span className="text-zinc-500 text-xs font-bold uppercase">utilizado</span>
          </div>
        </div>
        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* SECCIÓN B: La Cuadrícula de Tiempo */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl flex-1 flex flex-col backdrop-blur-md overflow-hidden">
        <h3 className="text-zinc-500 text-[10px] font-black uppercase mb-6 tracking-[0.3em] text-center">
          Línea de Tiempo
        </h3>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
          <div className="relative flex min-h-[1520px]"> {/* 19 horas * 80px */}
            
            {/* 1. Eje Lateral (Horas) */}
            <div className="w-12 flex-shrink-0 border-r border-zinc-800/50">
              {HOURS.map(hour => (
                <div key={hour} style={{ height: HOUR_HEIGHT }} className="relative">
                  <span className="absolute -top-2 left-0 text-[9px] font-black text-zinc-600 uppercase">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* 2. Área de Contenido (Bloques) */}
            <div className="flex-1 relative ml-4">
              {/* Cuadrícula de fondo */}
              {HOURS.map(hour => (
                <div 
                  key={`grid-${hour}`} 
                  style={{ height: HOUR_HEIGHT }} 
                  className="border-b border-zinc-800/30 w-full"
                />
              ))}

              {/* Render de Actividades */}
              {logs.map((log, index) => {
                const category = categories.find(c => c.id === log.category_id);
                const top = getVerticalPosition(log.start_time);
                const endTime = log.end_time || new Date().toISOString();
                const bottom = getVerticalPosition(endTime);
                const height = Math.max(bottom - top, 30); // Un poco más alto para leer bien

                return (
                  <div
                    key={log.id}
                    className="absolute left-0 right-2 rounded-xl border-l-4 p-2 flex flex-col justify-center transition-all shadow-lg overflow-hidden group"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      borderLeftColor: category?.color || '#8b5cf6',
                      zIndex: 10,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category?.emoji || '⏱️'}</span>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white uppercase leading-none truncate">
                          {category?.name || 'Sin título'}
                        </span>
                        {height > 45 && (
                          <span className="text-[8px] text-zinc-500 font-bold mt-1">
                            {new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 3. Indicador de Tiempo Real */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-red-500/50 z-20 pointer-events-none flex items-center transition-all duration-500"
                style={{ top: `${nowPos}px` }}
              >
                <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shadow-[0_0_10px_#ef4444]" />
                <div className="flex-1 border-t border-red-500/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}