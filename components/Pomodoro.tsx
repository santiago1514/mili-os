"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface PomodoroProps {
  categories: any[];
}

export default function Pomodoro({ categories }: PomodoroProps) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [selectedCat, setSelectedCat] = useState<string>("");

  // Filtrar solo categorías de tiempo para el selector
  const timeCategories = categories.filter(c => c.type === 'time');

  useEffect(() => {
    let interval: any;
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          setSeconds(s => s - 1);
        }
      }, 1000);
    } else if (minutes === 0 && seconds === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    // Si terminamos una sesión de trabajo y hay una categoría seleccionada, guardamos
    if (mode === 'work' && selectedCat) {
      const durationMin = 25; // O la duración que hayas elegido
      const startTime = new Date(Date.now() - durationMin * 60000).toISOString();
      const endTime = new Date().toISOString();

      const { error } = await supabase.from('time_logs').insert([{
        category_id: selectedCat,
        start_time: startTime,
        end_time: endTime
      }]);

      if (!error) {
        toast.success("🎯 Sesión registrada en tus estadísticas");
        // Nota: Podrías emitir un evento para refrescar la gráfica global
      }
    }

    toast(mode === 'work' ? "¡Enfoque terminado! Hora de descansar ☕" : "¡Descanso terminado! A darle 💪", {
      icon: '🔔',
      duration: 5000
    });
  };

  const toggleTimer = () => {
    if (mode === 'work' && !selectedCat && !isActive) {
      toast.error("Selecciona una categoría para enfocar");
      return;
    }
    setIsActive(!isActive);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] text-center shadow-2xl transition-all">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Pomodoro Timer</h3>
      
      {/* Selector de modo */}
      <div className="flex justify-center gap-2 mb-6 bg-black/40 p-1 rounded-2xl border border-zinc-800">
        <button 
          onClick={() => {setMode('work'); setMinutes(25); setSeconds(0); setIsActive(false);}} 
          className={`flex-1 text-[10px] font-black uppercase py-2 rounded-xl transition-all ${mode === 'work' ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Enfoque
        </button>
        <button 
          onClick={() => {setMode('break'); setMinutes(5); setSeconds(0); setIsActive(false);}} 
          className={`flex-1 text-[10px] font-black uppercase py-2 rounded-xl transition-all ${mode === 'break' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Descanso
        </button>
      </div>
      
      {/* Timer Display */}
      <div className="relative mb-6">
        <h2 className={`text-7xl font-mono font-black tracking-tighter transition-colors ${isActive ? 'text-white' : 'text-zinc-700'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </h2>
        {isActive && <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>}
      </div>

      {/* Selector de Categoría (Solo se muestra en modo trabajo) */}
      {mode === 'work' && (
        <select 
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          disabled={isActive}
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 mb-4 text-xs font-bold text-zinc-400 outline-none focus:border-purple-500 transition-all appearance-none text-center cursor-pointer"
        >
          <option value="">-- SELECCIONAR FOCO --</option>
          {timeCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name.toUpperCase()}</option>
          ))}
        </select>
      )}

      {/* Botón Principal */}
      <button 
        onClick={toggleTimer}
        className={`w-full py-4 rounded-2xl font-black tracking-widest transition-all active:scale-95 shadow-xl ${
          isActive 
          ? 'bg-zinc-800 text-red-500 border border-red-500/20 hover:bg-red-500/10' 
          : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'
        }`}
      >
        {isActive ? "DETENER" : "INICIAR SESIÓN"}
      </button>
    </div>
  );
}