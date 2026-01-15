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
      toast.success("Sistema Actualizado ✨");
      setEditingId(null);
      onUpdate?.();
    }
  };

  const handleDelete = async (id: string, feedType: string) => {
    if (!confirm("¿Eliminar este registro del núcleo operativo?")) return;
    const table = feedType === 'expense' ? 'expenses' : feedType === 'income' ? 'incomes' : 'transfers';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast.success("Registro purgado");
      onUpdate?.();
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden backdrop-blur-xl relative">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-center shrink-0">
        Log de Operaciones
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-0 relative">
        {/* Línea vertical de fondo (Timeline) */}
        <div className="absolute left-[11px] top-2 bottom-8 w-[1px] bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent" />

        <AnimatePresence mode="popLayout">
          {combinedActivity.map((item) => {
            const cat = categories.find(c => c.id === (item.category_id || item.type_id));
            const isTime = item.feedType === 'time';
            const isTransfer = item.feedType === 'transfer';
            const isIncome = item.feedType === 'income' || item.type === 'income';
            const isEditing = editingId === item.id;

            // Determinar color de acento
            const accentColor = isTime ? 'bg-purple-500' : isTransfer ? 'bg-blue-500' : isIncome ? 'bg-emerald-500' : 'bg-red-500';

            return (
              <motion.div 
                key={`${item.id}-${item.feedType}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="relative pl-8 pb-8 last:pb-2 group"
              >
                {/* Punto Conector Dinámico */}
                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center z-10 transition-transform group-hover:scale-110`}>
                  <div className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                </div>

                <div className="flex flex-col bg-zinc-800/20 rounded-2xl p-3 border border-zinc-800/40 hover:border-zinc-700/60 transition-all hover:bg-zinc-800/30">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs shrink-0">{isTransfer ? "🔄" : isIncome ? "💰" : (cat?.emoji || "💸")}</span>
                        <p className="text-[10px] font-black text-zinc-200 uppercase tracking-tight">
                          {isTime ? `Sesión de ${cat?.name}` : isTransfer ? "Transferencia" : isIncome ? `Ingreso` : `Gasto`}
                        </p>
                      </div>
                      
                      {/* Nota / Descripción con Edición */}
                      <div className="mt-1">
                        {isEditing ? (
                          <input 
                            autoFocus
                            className="bg-black border border-purple-500/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none w-full shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSaveEdit(item.id, item.feedType)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id, item.feedType)}
                          />
                        ) : (
                          <div className="flex items-center gap-2 group/note">
                            <p className="text-[10px] text-zinc-500 italic leading-tight truncate max-w-[140px]">
                              {item.description || (isTime ? "Actividad registrada" : "Sin nota de sistema")}
                            </p>
                            {!isTime && (
                              <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(item.id); setEditValue(item.description || ""); }} className="p-1 hover:text-white transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(item.id, item.feedType)} className="p-1 hover:text-red-500 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`text-[11px] font-black italic ${
                        isTime ? 'text-purple-400' : 
                        isTransfer ? 'text-blue-400' :
                        isIncome ? 'text-emerald-400' : 'text-red-500'
                      }`}>
                        {isTime ? "FINISHED" : isIncome ? `+$${item.amount.toLocaleString()}` : `-$${item.amount.toLocaleString()}`}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600 uppercase mt-0.5">
                        {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Badge inferior de cuenta/ruta */}
                  <div className="mt-2 flex items-center justify-between">
                    {!isTime && (
                      <span className="text-[8px] font-black px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase tracking-tighter">
                        {isTransfer ? (
                          <>{item.from?.name} <span className="text-zinc-600 mx-1">→</span> {item.to?.name}</>
                        ) : (
                          item.accounts?.name || item.account_name || "Cuenta Principal"
                        )}
                      </span>
                    )}
                    <p className={`text-[8px] text-zinc-500 font-bold italic ml-auto ${isTime ? 'w-full text-right' : ''}`}>
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