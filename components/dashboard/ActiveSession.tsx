// src/components/dashboard/ActiveSession.tsx
import { formatTime } from "../../lib/timer-utils";

interface ActiveSessionProps {
  activeLog: any;
  categories: any[];
  seconds: number;
  onStop: () => void;
}

export default function ActiveSession({ activeLog, categories, seconds, onStop }: ActiveSessionProps) {
  if (!activeLog) return null;

  const category = categories.find(c => c.id === activeLog.category_id);

  return (
    <div className="p-10 bg-gradient-to-br from-purple-600 via-purple-900 to-black rounded-[3rem] border border-purple-400/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
      <span className="bg-purple-500/20 text-purple-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">
        Sesión Activa
      </span>
      <h2 className="text-5xl font-black my-6 flex items-center gap-4">
        <span className="text-6xl">{category?.emoji}</span>
        {category?.name}
      </h2>
      <div className="flex justify-between items-end">
        <span className="text-7xl font-mono font-black tracking-tighter text-white">
          {formatTime(seconds)}
        </span>
        <button 
          onClick={onStop} 
          className="bg-white text-black px-10 py-5 rounded-[2rem] font-black hover:bg-purple-100 transition-colors shadow-xl"
        >
          DETENER
        </button>
      </div>
    </div>
  );
}