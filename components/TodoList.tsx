"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

// 1. Definimos las nuevas props para que coincidan con lo que envías en page.tsx
interface TodoListProps {
  categories: any[];
  todos: any[];          // Recibe las tareas globales
  onUpdate: () => void;  // Función para refrescar la barra de progreso
}

export default function TodoList({ categories, todos, onUpdate }: TodoListProps) {
  const [newTodo, setNewTodo] = useState("");
  const [isHabit, setIsHabit] = useState(false);

  // Guardar nueva tarea o hábito
  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const { error } = await supabase.from("todos").insert([
      { title: newTodo, is_habit: isHabit, is_completed: false }
    ]);
    if (!error) {
      setNewTodo("");
      onUpdate(); // Refresca la lista global y la barra
      toast.success(isHabit ? "Hábito creado" : "Tarea añadida");
    }
  };

  // Marcar como completado (esto moverá la barra de Gamification)
  const toggleTodo = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("todos")
      .update({ is_completed: !currentState })
      .eq("id", id);
    
    if (!error) {
      onUpdate(); // ¡Mágicamente sube el porcentaje!
    }
  };

  // Eliminar tarea
  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error) {
      onUpdate();
      toast.success("Eliminado");
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl h-full flex flex-col">
      <h3 className="text-zinc-400 text-sm font-black uppercase mb-4 tracking-widest">Tareas y Hábitos</h3>
      
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="¿Qué hay que hacer?"
          className="flex-1 bg-black border border-zinc-800 rounded-2xl px-4 py-3 focus:border-purple-500 outline-none text-sm transition-all"
        />
        <button 
          onClick={() => setIsHabit(!isHabit)}
          className={`px-4 rounded-2xl border transition-all ${isHabit ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
          title="Modo Hábito"
        >
          ✨
        </button>
        <button 
          onClick={addTodo} 
          className="bg-purple-600 hover:bg-purple-500 text-white px-5 rounded-2xl font-black transition-all active:scale-90 shadow-lg shadow-purple-500/20"
        >
          +
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
        {todos.length > 0 ? (
          todos.map(todo => (
            <div key={todo.id} className="p-4 bg-black/40 border border-zinc-800/50 rounded-[1.5rem] flex items-center justify-between group hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={todo.is_completed} 
                  onChange={() => toggleTodo(todo.id, todo.is_completed)}
                  className="w-5 h-5 accent-purple-500 cursor-pointer rounded-lg" 
                />
                <div>
                  <p className={`text-sm font-bold ${todo.is_completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                    {todo.title}
                  </p>
                  {todo.is_habit && (
                    <span className="text-[9px] text-orange-500 uppercase font-black tracking-widest">Hábito Diario</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
              >
                🗑️
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-zinc-600 italic text-sm">
            No hay misiones activas
          </div>
        )}
      </div>
    </div>
  );
}