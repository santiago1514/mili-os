"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface TodoListProps {
  categories: any[];
  todos: any[];
  onUpdate: () => void;
}

export default function TodoList({ categories, todos, onUpdate }: TodoListProps) {
  const [newTodo, setNewTodo] = useState("");
  const [isHabit, setIsHabit] = useState(false);

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const { error } = await supabase.from("todos").insert([
      { title: newTodo, is_habit: isHabit, is_completed: false }
    ]);
    if (!error) {
      setNewTodo("");
      onUpdate();
      toast.success(isHabit ? "Hábito creado" : "Tarea añadida");
    }
  };

  const toggleTodo = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("todos")
      .update({ is_completed: !currentState })
      .eq("id", id);
    if (!error) onUpdate();
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) {
      onUpdate();
      toast.success("Eliminado");
    }
  };

  // Separar tareas para dar orden visual
  const pendingTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl h-full flex flex-col transition-all">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase mb-6 tracking-[0.3em] text-center">
        Misiones y Enfoque
      </h3>

      <div className="flex items-center justify-between mb-6">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
        Misiones y Enfoque
      </h3>
      <span className="text-[9px] text-zinc-600 font-bold uppercase bg-zinc-800/50 px-2 py-1 rounded-md">
        Auto-archivar: 12:00 AM
      </span>
    </div>
      
      {/* Input más grande y estilizado */}
      <div className="flex gap-3 mb-8">
        <input 
          type="text" 
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Escribe tu siguiente paso..."
          className="flex-1 bg-black border border-zinc-800 rounded-[1.5rem] px-6 py-4 focus:border-purple-500 outline-none text-base transition-all text-white placeholder:text-zinc-700"
        />
        <button 
          onClick={() => setIsHabit(!isHabit)}
          className={`px-5 rounded-[1.5rem] border transition-all ${isHabit ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-zinc-800 text-zinc-600 hover:border-zinc-500'}`}
        >
          ✨
        </button>
        <button 
          onClick={addTodo} 
          className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-[1.5rem] font-black transition-all active:scale-95 shadow-lg shadow-purple-500/20 text-xl"
        >
          +
        </button>
      </div>

      {/* Contenedor que crece (flex-1) */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {todos.length > 0 ? (
            <>
              {/* Tareas Pendientes */}
              {pendingTodos.map(todo => (
                <div key={todo.id} className="p-5 bg-zinc-800/30 border border-zinc-800 rounded-[1.8rem] flex items-center justify-between group hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all">
                  <div className="flex items-center gap-5">
                    <input 
                      type="checkbox" 
                      checked={todo.is_completed} 
                      onChange={() => toggleTodo(todo.id, todo.is_completed)}
                      className="w-6 h-6 accent-purple-500 cursor-pointer rounded-xl" 
                    />
                    <div>
                      <p className="text-base font-bold text-zinc-100 tracking-tight">
                        {todo.title}
                      </p>
                      {todo.is_habit && (
                        <span className="text-[9px] text-orange-500 uppercase font-black tracking-widest mt-1 block">Hábito Diario</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all">
                    🗑️
                  </button>
                </div>
              ))}

              {/* Tareas Completadas (Separadas y con opacidad) */}
              {completedTodos.length > 0 && (
                <div className="pt-6 mt-6 border-t border-zinc-800/50">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 ml-2">Completadas</p>
                  <div className="space-y-3">
                    {completedTodos.map(todo => (
                      <div key={todo.id} className="p-4 bg-transparent border border-zinc-800/30 rounded-[1.5rem] flex items-center justify-between group opacity-50">
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox" 
                            checked={todo.is_completed} 
                            onChange={() => toggleTodo(todo.id, todo.is_completed)}
                            className="w-5 h-5 accent-zinc-700 cursor-pointer" 
                          />
                          <p className="text-sm font-medium line-through text-zinc-600">
                            {todo.title}
                          </p>
                        </div>
                        <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all">
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
              <span className="text-4xl mb-4">🎯</span>
              <p className="italic text-sm font-medium">No hay misiones para hoy. ¿Cuál es el primer paso?</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
}