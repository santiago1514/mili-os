"use client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityFeedProps {
  logs: any[];
  expenses: any[];
  transfers?: any[];
  categories: any[];
  onUpdate: () => void;
}

export default function ActivityFeed({ logs, expenses = [], transfers = [], categories, onUpdate }: ActivityFeedProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [incomes, setIncomes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchIncomes() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase.from('incomes').select('*').gte('created_at', today.toISOString());
      if (data) setIncomes(data);
    }
    fetchIncomes();
  }, [logs, expenses, transfers]);

  const combinedActivity = [
    ...logs.filter(l => l.end_time).map(l => ({ ...l, feedType: 'time', date: new Date(l.end_time) })),
    ...expenses.map(e => ({ ...e, feedType: 'expense', date: new Date(e.created_at) })),
    ...transfers.map(t => ({ ...t, feedType: 'transfer', date: new Date(t.created_at) })),
    ...incomes.map(i => ({ ...i, feedType: 'income', date: new Date(i.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

  const handleSaveEdit = async (id: string, feedType: string) => {
    const table = feedType === 'expense' ? 'expenses' : feedType === 'income' ? 'incomes' : 'transfers';
    const { error } = await supabase.from(table).update({ description: editValue }).eq('id', id);
    if (!error) {
      toast.success("Actualizado ✨");
      setEditingId(null);
      onUpdate?.();
    }
  };

  const handleDelete = async (id: string, feedType: string) => {
    if (!confirm("¿Borrar este registro permanentemente?")) return;
    const table = feedType === 'expense' ? 'expenses' : feedType === 'income' ? 'incomes' : 'transfers';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast.success("Eliminado correctamente");
      onUpdate?.();
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-center shrink-0">
        Operaciones Recientes
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-800/50">
        <AnimatePresence mode="popLayout">
          {combinedActivity.map((item) => {
            const cat = categories.find(c => c.id === (item.category_id || item.type_id));
            const isTime = item.feedType === 'time';
            const isTransfer = item.feedType === 'transfer';
            const isIncome = item.feedType === 'income';
            const isEditing = editingId === item.id;

            return (
              <motion.div 
                key={`${item.id}-${item.feedType}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="relative pl-8 group"
              >
                <div className={`absolute left-0 top-1 w-6 h-6 bg-black border rounded-full flex items-center justify-center z-10 ${
                  isTime ? 'border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.1)]' : 
                  isTransfer ? 'border-blue-500/50' : isIncome ? 'border-emerald-500/50' : 'border-red-500/50'
                }`}>
                  <span className="text-[10px]">
                    {isTransfer ? "🔄" : isIncome ? "💰" : (cat?.emoji || "💸")}
                  </span>
                </div>

                <div className="flex flex-col">
                  <p className="text-xs font-bold text-zinc-200">
                    {isTime ? `Sesión de ${cat?.name}` : isTransfer ? "Transferencia" : isIncome ? "Ingreso" : `Gasto en ${cat?.name}`}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-0.5 group/actions">
                    {isEditing ? (
                      <input 
                        autoFocus
                        className="bg-black border border-zinc-700 rounded px-2 py-0.5 text-[10px] text-white outline-none w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(item.id, item.feedType)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id, item.feedType)}
                      />
                    ) : (
                      <>
                        <p className="text-[10px] text-zinc-500 italic leading-tight truncate max-w-[140px]">
                          {item.description || (isTime ? "Actividad registrada" : "Sin nota")}
                        </p>
                        
                        {!isTime && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                            {/* BOTÓN EDITAR */}
                            <button onClick={() => { setEditingId(item.id); setEditValue(item.description || ""); }}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-zinc-600 hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            {/* BOTÓN ELIMINAR */}
                            <button onClick={() => handleDelete(item.id, item.feedType)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-zinc-600 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2 items-center mt-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                      isTime ? 'bg-purple-500/10 text-purple-400' : 
                      isTransfer ? 'bg-blue-500/10 text-blue-400' :
                      isIncome ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {isTime ? "TERMINADO" : isIncome ? `+$${item.amount}` : isTransfer ? `$${item.amount}` : `-$${item.amount}`}
                    </span>
                    <p className="text-[9px] text-zinc-600 font-medium italic">
                      {formatDistanceToNow(item.date, { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}