"use client";
import React, { useState, useEffect } from 'react';

interface TimeGridProps {
  logs: any[];
  categories: any[];
}

export default function TimeGrid({ logs, categories }: TimeGridProps) {
  const [hourHeight, setHourHeight] = useState(100);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const START_HOUR = 6; 
  const hours = Array.from({ length: 18 }, (_, i) => i + START_HOUR);

  if (logs.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4 opacity-20 italic font-black text-white uppercase tracking-tighter">MILI OS</div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Esperando despliegue de actividad...</p>
      </div>
    );
  }

  // --- LÓGICA DE COLISIONES ---
  const processedLogs = logs.map((log, i) => {
    const start = new Date(log.start_time).getTime();
    const end = log.end_time ? new Date(log.end_time).getTime() : new Date().getTime();
    
    // Contar cuántos otros logs se solapan con este
    const overlaps = logs.filter((other, j) => {
      if (i === j) return false;
      const oStart = new Date(other.start_time).getTime();
      const oEnd = other.end_time ? new Date(other.end_time).getTime() : new Date().getTime();
      return start < oEnd && end > oStart;
    });

    return { 
      ...log, 
      overlapCount: overlaps.length, 
      indexInOverlap: overlaps.filter((_, j) => j < i).length 
    };
  });

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 relative overflow-x-hidden backdrop-blur-xl shadow-2xl">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Timeline Operativo</h3>
          <span className="text-[8px] text-purple-500/50 font-bold uppercase mt-1">Sincronizado con Supabase v2.0</span>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-800/30 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button onClick={() => setHourHeight(prev => Math.max(prev - 20, 60))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all">-</button>
          <span className="text-[9px] font-mono text-purple-400 px-2 min-w-[50px] text-center font-bold italic">{hourHeight}px/h</span>
          <button onClick={() => setHourHeight(prev => Math.min(prev + 20, 300))} className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all">+</button>
        </div>
      </div>

      {/* GRID CONTAINER */}
      <div className="relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ height: `${hours.length * hourHeight}px` }}>
        
        {/* LÍNEA DE HORA ACTUAL (MEJORADA) */}
        {now.getHours() >= START_HOUR && (
          <div 
            className="absolute w-full z-30 flex items-center pointer-events-none transition-all duration-1000"
            style={{ top: `${(now.getHours() + now.getMinutes() / 60 - START_HOUR) * hourHeight}px` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444] z-10" />
            <div className="flex-1 border-t-2 border-red-500/30 ml-[-4px]" />
            <span className="absolute right-0 text-[8px] font-black text-red-500/50 uppercase tracking-widest bg-black px-2">Live Now</span>
          </div>
        )}

        {/* LÍNEAS DE FONDO */}
        {hours.map((hour) => (
          <div 
            key={hour} 
            className="absolute w-full border-t border-zinc-800/40 flex items-start pt-2 transition-all duration-300"
            style={{ top: `${(hour - START_HOUR) * hourHeight}px` }}
          >
            <span className="text-[10px] font-black font-mono text-zinc-700 w-14">
              {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
        ))}

        {/* BLOQUES DINÁMICOS CON DETECCIÓN DE SOLAPAMIENTO */}
        {processedLogs.map((log) => {
          const start = new Date(log.start_time);
          const end = log.end_time ? new Date(log.end_time) : new Date();
          const cat = categories.find(c => c.id === log.category_id);

          const startHour = start.getHours() + start.getMinutes() / 60;
          const endHour = end.getHours() + end.getMinutes() / 60;
          const duration = endHour - startHour;

          const topPos = (startHour - START_HOUR) * hourHeight;
          const blockHeight = Math.max(duration * hourHeight, 35);

          // Cálculo de ancho dinámico si hay solapamiento
          const width = 100 / (log.overlapCount + 1);
          const leftOffset = width * log.indexInOverlap;

          return (
            <div
              key={log.id}
              className="absolute rounded-2xl border-l-[3px] p-3 transition-all duration-500 hover:z-40 group cursor-pointer"
              style={{
                top: `${topPos}px`,
                height: `${blockHeight - 2}px`,
                left: `calc(60px + ${leftOffset}%)`,
                width: `calc(${width}% - 65px)`,
                backgroundColor: `${cat?.color}12`,
                borderLeftColor: cat?.color || '#8b5cf6',
                borderTop: '1px solid rgba(255,255,255,0.03)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{cat?.emoji}</span>
                    <span className="font-black uppercase text-[9px] tracking-tight text-zinc-200 truncate group-hover:text-white transition-colors">
                      {cat?.name}
                    </span>
                  </div>
                  <span className="text-[7px] font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-md">
                    {Math.round(duration * 60)}m
                  </span>
                </div>
                
                {blockHeight > 50 && (
                  <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-1">
                    <span className="text-[8px] font-mono text-zinc-500">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-purple-500 transition-colors" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}