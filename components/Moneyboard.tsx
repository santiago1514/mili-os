"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Moneyboard({ categories }: { categories: any[] }) {
  const [amount, setAmount] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const finCategories = categories.filter(c => c.type === 'money');

  const handleNumber = (num: string) => setAmount(prev => prev + num);
  const clear = () => setAmount("");

  const saveTransaction = async () => {
    if (!amount || !selectedCat) return alert("Elige monto y categoría");
    
    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        amount: parseFloat(amount), 
        category_id: selectedCat 
      }]);

    if (!error) {
      alert("💰 Gasto registrado");
      clear();
      setSelectedCat(null);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4 tracking-widest">Moneyboard</h3>
      
      {/* Pantalla del Monto */}
      <div className="bg-black p-4 rounded-2xl mb-4 text-right">
        <span className="text-zinc-500 mr-2 text-xl">$</span>
        <span className="text-4xl font-mono">{amount || "0"}</span>
      </div>

      {/* Selector de Categoría (Dinero) */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {finCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
              selectedCat === cat.id ? 'bg-green-600 border-green-400' : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Numpad Táctil */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "C"].map(btn => (
          <button
            key={btn}
            onClick={() => btn === "C" ? clear() : handleNumber(btn)}
            className="h-14 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xl font-bold active:scale-95 transition-all"
          >
            {btn}
          </button>
        ))}
      </div>

      <button
        onClick={saveTransaction}
        className="w-full py-4 bg-green-500 hover:bg-green-600 text-black font-black rounded-2xl transition-all shadow-lg shadow-green-500/20"
      >
        REGISTRAR GASTO
      </button>
    </div>
  );
}