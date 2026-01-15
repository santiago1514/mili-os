"use client";
import React from 'react';

interface TimeGridProps {
  logs: any[];
  categories: any[];
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // De 5 AM a 11 PM
const HOUR_HEIGHT = 80; // Píxeles por cada hora

export default function TimeGrid({ logs, categories }: TimeGridProps) {
  // Función para calcular la posición "Y" de una fecha dada
  const getVerticalPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // (Horas actuales - hora de inicio 5 AM) * altura + (minutos proporcionales)
    return (hours - 5) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
  };

  // Línea de "Ahora mismo"
  const [nowPos, setNowPos] = React.useState(getVerticalPosition(new Date().toISOString()));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNowPos(getVerticalPosition(new Date().toISOString()));
    }, 60000); // Actualiza cada minuto
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-[2.5rem] p-6 shadow-2xl h-full flex flex-col backdrop-blur-md">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase mb-6 tracking-[0.3em] text-center">
        Línea de Tiempo
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
        <div className="relative flex min-h-[1520px]"> {/* 19 horas * 80px */}
          
          {/* 1. Eje Lateral de Horas */}
          <div className="w-12 flex-shrink-0 border-r border-zinc-800/50">
            {HOURS.map(hour => (
              <div key={hour} style={{ height: HOUR_HEIGHT }} className="relative">
                <span className="absolute -top-2 left-0 text-[9px] font-black text-zinc-600 uppercase">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* 2. Área de Contenido */}
          <div className="flex-1 relative ml-4">
            {/* Líneas de cuadrícula de fondo */}
            {HOURS.map(hour => (
              <div 
                key={`grid-${hour}`} 
                style={{ height: HOUR_HEIGHT }} 
                className="border-b border-zinc-800/30 w-full"
              />
            ))}

            {/* 3. Renderizado de los Bloques de Tiempo */}
            {logs.map((log, index) => {
                const category = categories.find(c => c.id === log.category_id);
                const top = getVerticalPosition(log.start_time);
                const endTime = log.end_time || new Date().toISOString();
                const bottom = getVerticalPosition(endTime);
                const height = Math.max(bottom - top, 25);

                // Lógica simple para evitar solapamiento visual:
                // Si el índice es impar, lo movemos un poco a la derecha
                const isOffset = logs.some((other, idx) => 
                    idx !== index && 
                    new Date(other.start_time) < new Date(endTime) && 
                    new Date(other.end_time || new Date()) > new Date(log.start_time) &&
                    idx < index
                );

              return (
                <div
                  key={log.id}
                  className="absolute rounded-xl border-l-4 p-2 flex flex-col justify-center transition-all shadow-lg overflow-hidden"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: isOffset ? '50%' : '0', // Si choca, ocupa la mitad derecha
                    right: isOffset ? '0' : (logs.some((o, i) => i > index && getVerticalPosition(o.start_time) < bottom) ? '50%' : '8px'),
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    borderLeftColor: '#8b5cf6',
                    zIndex: 10,
                  }}
                >

                <div className="flex items-center gap-1">
                    <span className="text-xs">{category?.emoji}</span>
                    <span className="text-[9px] font-black text-white uppercase leading-none truncate">
                      {category?.name}
                    </span>
                  </div>
                </div>

              );
            })}

            {/* 4. Indicador de "Ahora" (Línea roja/morada) */}
            <div 
              className="absolute left-0 right-0 border-t-2 border-red-500/50 z-10 pointer-events-none flex items-center"
              style={{ top: `${nowPos}px` }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 shadow-[0_0_10px_#ef4444]" />
              <div className="flex-1 border-t border-red-500/20 shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}