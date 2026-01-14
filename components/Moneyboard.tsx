"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

interface MoneyboardProps {
  categories: any[];
  accounts: any[];
  onUpdate: () => void;
}

export default function Moneyboard({ categories, accounts, onUpdate }: MoneyboardProps) {
  const [mode, setMode] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState("");
  const [selectedAcc, setSelectedAcc] = useState("");
  const [toAcc, setToAcc] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const handleAction = async () => {
    const numAmount = parseFloat(amount);
    
    // Validaciones básicas
    if (!amount || numAmount <= 0) return toast.error("Ingresa un monto válido");
    if (!selectedAcc) return toast.error("Selecciona una cuenta");

    let error;

    if (mode === 'expense') {
      if (!selectedCat) return toast.error("Selecciona una categoría");
      const { error: err } = await supabase.from('expenses').insert([{
        amount: numAmount,
        account_id: selectedAcc,
        category_id: selectedCat,
        type: 'expense',
        description: "Gasto registrado"
      }]);
      error = err;
    } 
    else if (mode === 'income') {
      if (!selectedCat) return toast.error("Selecciona una categoría de ingreso");
      // Importante: Guardamos en la tabla que definiste para ingresos
      const { error: err } = await supabase.from('expenses').insert([{
        amount: numAmount,
        account_id: selectedAcc,
        category_id: selectedCat,
        type: 'income',
        description: "Ingreso de capital"
      }]);
      error = err;
    } 
    else if (mode === 'transfer') {
      if (!toAcc || selectedAcc === toAcc) return toast.error("Selecciona cuentas distintas");
      const { error: err } = await supabase.from('transfers').insert([{
        amount: numAmount,
        from_account_id: selectedAcc,
        to_account_id: toAcc
      }]);
      error = err;
    }

    if (!error) {
      toast.success(`${mode.toUpperCase()} registrado ✨`);
      setAmount("");
      setSelectedCat("");
      onUpdate?.(); // Esto refresca balances y actividad en page.tsx
    } else {
      console.error(error);
      toast.error("Error en la base de datos");
    }
  };

  const handleKey = (key: string) => {
    if (key === "C") return setAmount("");
    if (key === "." && amount.includes(".")) return;
    if (amount === "0" && key !== ".") return setAmount(key);
    if (amount.length < 12) setAmount(prev => prev + key);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl">
      {/* Selector de Modo */}
      <div className="flex gap-1 bg-black p-1 rounded-2xl border border-zinc-800 mb-4">
        {[
          { id: 'expense', label: 'GASTO', color: 'bg-red-500' },
          { id: 'income', label: 'INGRESO', color: 'bg-green-500' },
          { id: 'transfer', label: 'TRANSF', color: 'bg-blue-500' }
        ].map(m => (
          <button 
            key={m.id}
            onClick={() => {
              setMode(m.id as any);
              setSelectedCat(""); 
            }}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
              mode === m.id ? `${m.color} text-white shadow-lg` : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Pantalla de Monto */}
      <div className="bg-black border border-zinc-800 p-6 rounded-3xl mb-4 text-right overflow-hidden shadow-inner">
        <span className={`text-4xl font-mono font-black break-all tracking-tighter ${
          mode === 'expense' ? 'text-red-500' : mode === 'income' ? 'text-green-500' : 'text-blue-500'
        }`}>
          $ {Number(amount).toLocaleString() || "0"}
        </span>
      </div>

      {/* Selector de Cuentas */}
      <div className="mb-4">
        <p className="text-[9px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">
          {mode === 'transfer' ? 'Origen:' : 'Cuenta:'}
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAcc(acc.id)}
              className={`px-4 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedAcc === acc.id 
                  ? 'border-white bg-white text-black scale-95' 
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {acc.icon} {acc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lógica de Categorías o Cuenta Destino */}
      <div className="mb-6">
        {mode !== 'transfer' ? (
          <>
            <p className="text-[9px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Categoría:</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories?.filter(c => c.type === mode).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCat === cat.id 
                      ? (mode === 'expense' ? 'border-red-500 bg-red-500/20 text-red-500' : 'border-green-500 bg-green-500/20 text-green-500')
                      : 'border-zinc-800 text-zinc-500'
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[9px] font-black text-zinc-600 mb-2 uppercase tracking-[0.2em]">Destino:</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {accounts?.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setToAcc(acc.id)}
                  className={`px-4 py-2 rounded-xl border text-[11px] font-bold whitespace-nowrap transition-all ${
                    toAcc === acc.id ? 'border-blue-500 bg-blue-500/20 text-blue-500' : 'border-zinc-800 text-zinc-500'
                  }`}
                >
                  {acc.icon} {acc.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Teclado */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "C"].map(k => (
          <button
            key={k}
            onClick={() => handleKey(k.toString())}
            className="bg-zinc-800/30 hover:bg-zinc-800 py-4 rounded-2xl font-black text-lg text-white transition-all active:scale-90 border border-transparent hover:border-zinc-700"
          >
            {k}
          </button>
        ))}
      </div>

      <button 
        onClick={handleAction}
        className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] text-white transition-all active:scale-95 shadow-2xl ${
          mode === 'expense' ? 'bg-red-600 shadow-red-900/20' : 
          mode === 'income' ? 'bg-green-600 shadow-green-900/20' : 
          'bg-blue-600 shadow-blue-900/20'
        }`}
      >
        Confirmar {mode}
      </button>
    </div>
  );
}