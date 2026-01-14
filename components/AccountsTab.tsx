"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

// Definimos la interfaz para recibir los datos desde page.tsx
interface AccountsTabProps {
  accounts: any[];
}

export default function AccountsTab({ accounts }: AccountsTabProps) {
  const [selectedAcc, setSelectedAcc] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function fetchAccountHistory(accountId: string) {
    setLoadingHistory(true);
    // Obtenemos gastos y transferencias vinculados a esta cuenta
    const { data: moveRes } = await supabase
    .from('transactions')
    .select('*, categories(name, emoji)')
    .eq('account_id', accountId);

    const { data: trans } = await supabase
    .from('transfers')
    .select('*')
    .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);


    const combined = [
    ...(moveRes || []).map(m => ({       ...m, 
      displayType: m.type === 'income' ? 'ingreso' : 'gasto', 
      date: new Date(m.created_at) 
    })),
    ...(trans || []).map(t => ({ ...t, displayType: 'transfer', date: new Date(t.created_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

    setHistory(combined);
    setLoadingHistory(false);
  }

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      {/* GRID DE CUENTAS - Se muestran solo si no hay una seleccionada para ahorrar espacio */}
      <AnimatePresence>
        {!selectedAcc && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
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

      {/* PANEL DE DETALLE / HISTORIAL POR CUENTA */}
      <AnimatePresence mode="wait">
        {selectedAcc && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-500">
                  {selectedAcc.name}
                </h3>
                <p className="text-xl font-mono font-black">${selectedAcc.balance?.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setSelectedAcc(null)} 
                className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-full text-[10px] font-bold transition-colors"
              >
                VOLVER
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
              {loadingHistory ? (
                <p className="text-center text-zinc-600 text-[10px] animate-pulse py-10">CARGANDO MOVIMIENTOS...</p>
              ) : history.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                      {item.displayType === 'gasto' ? '📉' : item.displayType === 'ingreso' ? '💰' : '🔄'}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-200">
                        {item.type === 'gasto' ? item.categories?.name : 'Transferencia'}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-mono">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs font-mono font-black ${
                    item.displayType === 'ingreso' || (item.displayType === 'transfer' && item.to_account_id === selectedAcc.id)? 
                    'text-green-400' : 'text-red-400'
                  }`}>
                    {item.displayType === 'ingreso' || (item.displayType === 'transfer' && item.to_account_id === selectedAcc.id) ? '+' : '-'}${item.amount}
                  </p>

                </div>
              ))}
              {!loadingHistory && history.length === 0 && (
                <p className="text-center text-zinc-600 text-[10px] py-10 italic">Sin movimientos recientes</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {accounts.length === 0 && (
        <div className="text-center p-10 border border-dashed border-zinc-800 rounded-[2rem]">
          <p className="text-zinc-500 text-xs italic font-black uppercase tracking-widest">Sincronizando cuentas...</p>
        </div>
      )}
    </div>
  );
}