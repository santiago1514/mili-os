"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface AccountsTabProps {
  accounts: any[];
}

export default function AccountsTab({ accounts }: AccountsTabProps) {
  const [selectedAcc, setSelectedAcc] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function fetchAccountHistory(accountId: string) {
    setLoadingHistory(true);
    
    // 1. Obtenemos movimientos de la tabla 'expenses' (que ahora incluye type='income')
    const { data: moveRes } = await supabase
      .from('expenses')
      .select('*, categories(name, emoji)')
      .eq('account_id', accountId);

    // 2. Obtenemos transferencias
    const { data: trans } = await supabase
      .from('transfers')
      .select('*')
      .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);

    const combined = [
      ...(moveRes || []).map(m => ({ 
        ...m, 
        displayType: m.type, // 'expense' o 'income'
        date: new Date(m.created_at) 
      })),
      ...(trans || []).map(t => ({ 
        ...t, 
        displayType: 'transfer', 
        date: new Date(t.created_at) 
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    setHistory(combined);
    setLoadingHistory(false);
  }

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <AnimatePresence>
        {!selectedAcc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            {accounts.map(acc => (
              <button 
                key={acc.id}
                onClick={() => { setSelectedAcc(acc); fetchAccountHistory(acc.id); }}
                className="p-4 rounded-[2rem] border bg-zinc-900 border-zinc-800 text-white hover:border-purple-500/50 transition-all text-left"
              >
                <span className="text-2xl block mb-2">{acc.icon || '💳'}</span>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-tighter truncate">{acc.name}</p>
                <p className="text-lg font-mono font-black">${acc.balance?.toLocaleString()}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedAcc && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-500">{selectedAcc.name}</h3>
                <p className="text-xl font-mono font-black">${selectedAcc.balance?.toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedAcc(null)} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-full text-[10px] font-bold">
                VOLVER
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
              {loadingHistory ? (
                <p className="text-center text-zinc-600 text-[10px] animate-pulse py-10">CARGANDO MOVIMIENTOS...</p>
              ) : history.map((item, i) => {
                // Lógica de colores y símbolos
                const isIncomeType = item.displayType === 'income';
                const isTransferIn = item.displayType === 'transfer' && item.to_account_id === selectedAcc.id;
                const isPositive = isIncomeType || isTransferIn;
                
                return (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {item.displayType === 'expense' ? '📉' : item.displayType === 'income' ? '💰' : '🔄'}
                        </div>
                      <div>
                        <p className="text-[11px] font-bold text-zinc-200">
                          {item.displayType === 'transfer' ? 'Transferencia' : (item.categories?.name || 'Movimiento')}
                        </p>
                        {item.description && (
                        <p className="text-[9px] text-zinc-500 italic leading-tight">{item.description}</p>
                        )}
                        <p className="text-[8px] text-zinc-600 font-mono mt-0.5">{item.date.toLocaleDateString()}</p>
                      </div>
                    </div>

                    <p className={`text-xs font-mono font-black ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : '-'}${item.amount.toLocaleString()}
                    </p>
                  </div>
                );
              })}
              {!loadingHistory && history.length === 0 && (
                <p className="text-center text-zinc-600 text-[10px] py-10 italic">Sin movimientos recientes</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}