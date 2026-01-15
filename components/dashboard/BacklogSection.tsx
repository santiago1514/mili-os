// src/components/dashboard/BacklogSection.tsx
import { supabase } from "../../lib/supabase";

interface BacklogSectionProps {
  todos: any[];
  startOfSelected: Date;
  onUpdate: () => void;
}

export default function BacklogSection({ todos, startOfSelected, onUpdate }: BacklogSectionProps) {
  // Filtramos las tareas pendientes que son de fechas anteriores a la seleccionada
  const overdueTasks = todos.filter(t => !t.is_completed && new Date(t.created_at) < startOfSelected);

  const handleRollover = async (todoId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("todos")
      .update({ created_at: now })
      .eq("id", todoId);

    if (!error) onUpdate();
  };

  if (overdueTasks.length === 0) return null;

  return (
    <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
      <h3 className="text-orange-500 text-[10px] font-black uppercase mb-4 tracking-[0.3em] flex items-center gap-2 px-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        Misiones del Pasado (Pendientes)
      </h3>
      <div className="space-y-3">
        {overdueTasks.map(todo => (
          <div key={todo.id} className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-md">
            <span className="text-zinc-400 text-sm font-medium italic">{todo.title}</span>
            <button 
              onClick={() => handleRollover(todo.id)}
              className="text-[9px] bg-orange-500 text-white px-4 py-2 rounded-xl font-black uppercase tracking-tighter hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
            >
              Traer a Hoy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}