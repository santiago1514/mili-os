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
    if (!amount || numAmount <= 0) return toast.error("Ingresa un monto válido");
    if (!selectedAcc) return toast.error("Selecciona una cuenta");

    let error;

    if (mode === 'expense') {
      if (!selectedCat) return toast.error("Selecciona una categoría");
      const { error: err } = await supabase.from('expenses').insert([{
        amount: numAmount,
        account_id: selectedAcc,
        category_id: selectedCat,
        description: "Gasto registrado"
      }]);
      error = err;
    } 
    else if (mode === 'income') {
      if (!selectedCat) return toast.error("Selecciona una categoría de ingreso");
      const { error: err } = await supabase.from('incomes').insert([{
        amount: numAmount,
        account_id: selectedAcc,
        category_id: selectedCat, // Usamos la categoría seleccionada
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
      onUpdate?.();
    } else {
      console.error(error);
      toast.error("Error en la base de datos");
    }
  };

  const handleKey = (key: string) => {
    if (key === "C") return setAmount("");
    if (key === "." && amount.includes(".")) return;
    if (amount.length < 9) setAmount(prev => prev + key);
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
              setSelectedCat(""); // Limpiar categoría al cambiar modo
            }}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
              mode === m.id ? `${m.color} text-white` : 'text-zinc-500'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Pantalla de Monto */}
      <div className="bg-black border border-zinc-800 p-6 rounded-3xl mb-4 text-right overflow-hidden">
        <span className={`text-4xl font-mono font-black break-all ${
          mode === 'expense' ? 'text-red-500' : mode === 'income' ? 'text-green-500' : 'text-blue-500'
        }`}>
          $ {amount || "0"}
        </span>
      </div>

      {/* Selector de Cuenta Origen */}
      <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-widest">
        {mode === 'transfer' ? 'DESDE CUENTA:' : 'CUENTA:'}
      </p>
      
      {/* Selector de Cuentas */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {accounts.length > 0 ? (
          accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAcc(acc.id)}
              className={`px-4 py-2 rounded-xl border text-xs whitespace-nowrap transition-all ${
                selectedAcc === acc.id 
                  ? 'border-white bg-white text-black' 
                  : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {acc.icon} {acc.name}
            </button>
          ))
        ) : (
          <p className="text-[10px] text-zinc-600 italic">Cargando cuentas...</p>
        )}
      </div>

      {/* Lógica de Categorías o Cuenta Destino */}
      {mode !== 'transfer' ? (
        <>
          <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-widest">
            CATEGORÍA {mode === 'expense' ? 'GASTO' : 'INGRESO'}:
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {categories?.filter(c => c.type === mode).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-2 rounded-xl border text-xs whitespace-nowrap transition-all ${
                  selectedCat === cat.id 
                    ? (mode === 'expense' ? 'border-red-500 bg-red-500 text-white' : 'border-green-500 bg-green-500 text-white')
                    : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-[9px] font-black text-zinc-500 mb-2 uppercase tracking-widest">HACIA CUENTA:</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {accounts?.map(acc => (
              <button
                key={acc.id}
                onClick={() => setToAcc(acc.id)}
                className={`px-4 py-2 rounded-xl border text-xs whitespace-nowrap transition-all ${
                  toAcc === acc.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-800 text-zinc-400'
                }`}
              >
                {acc.icon} {acc.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Teclado Numérico */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "C"].map(k => (
          <button
            key={k}
            onClick={() => handleKey(k.toString())}
            className="bg-zinc-800/50 hover:bg-zinc-700 py-4 rounded-2xl font-bold text-white transition-all active:scale-90"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Botón de Acción */}
      <button 
        onClick={handleAction}
        className={`w-full py-4 rounded-2xl font-black text-white transition-all active:scale-95 shadow-lg ${
          mode === 'expense' ? 'bg-red-600 shadow-red-900/20' : 
          mode === 'income' ? 'bg-green-600 shadow-green-900/20' : 
          'bg-blue-600 shadow-blue-900/20'
        }`}
      >
        CONFIRMAR {mode.toUpperCase()}
      </button>
    </div>
  );
}