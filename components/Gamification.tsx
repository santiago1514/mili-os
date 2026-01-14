"use client";

export default function Gamification({ todos }: { todos: any[] }) {
  const total = todos.length;
  const completed = todos.filter(t => t.is_completed).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl border-t-4 border-t-yellow-500 shadow-xl transition-all duration-500">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-yellow-500/80">Mission Status</h3>
          <p className="text-zinc-200 text-xs font-bold">Productividad Diaria</p>
        </div>
        <div className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500 font-black">
          LVL {Math.floor(completed / 5) + 1}
        </div>
      </div>

      <div className="flex items-end gap-2 mt-4">
        <span className={`text-5xl font-black tracking-tighter transition-colors duration-500 ${progress === 100 ? 'text-green-500' : 'text-white'}`}>
          {progress}%
        </span>
        <span className="text-zinc-500 text-[10px] mb-2 uppercase font-black opacity-60">Completado</span>
      </div>

      <div className="w-full bg-zinc-800 h-3 rounded-full mt-3 overflow-hidden border border-zinc-700/50 p-[2px]">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            progress === 100 
            ? 'bg-gradient-to-r from-green-600 to-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
            : 'bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="text-[9px] text-zinc-600 mt-4 uppercase font-black text-center tracking-[0.2em]">
        {progress === 100 ? "⚡ Máximo rendimiento alcanzado" : `${total - completed} objetivos pendientes`}
      </p>
    </div>
  );
}