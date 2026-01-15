"use client";
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DailyStatsProps {
  logs: any[];
  categories: any[];
  accounts: any[]; // Añadimos accounts
}

export default function DailyStats({ logs, categories, accounts }: DailyStatsProps) {
  // --- LÓGICA DE PATRIMONIO SELECCIONADO ---
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const totalPatrimonio = useMemo(() => {
    return accounts
      .filter(acc => selectedAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts, selectedAccountIds]);

  // --- LÓGICA DE TIEMPO ---
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const minutesSinceStartOfDay = Math.floor((now.getTime() - startOfDay.getTime()) / 60000);

  const trackedData = categories
    .filter(cat => cat.type === 'time')
    .map(cat => {
      const totalMinutes = logs
        .filter(log => log.category_id === cat.id && log.end_time)
        .reduce((acc, log) => {
          const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 60000;
          return acc + duration;
        }, 0);

      return {
        name: cat.name,
        value: Math.round(totalMinutes),
        color: cat.color_hex || '#8b5cf6'
      };
    })
    .filter(data => data.value > 0);

  const totalTrackedMinutes = trackedData.reduce((acc, item) => acc + item.value, 0);
  const unrecordedTime = Math.max(0, minutesSinceStartOfDay - totalTrackedMinutes);

  const finalChartData = [
    ...trackedData,
    { name: 'Ocio / No Registrado', value: unrecordedTime, color: '#27272a' }
  ].filter(data => data.value > 0);

  // --- RESUMEN PARA EL PROMPT (IA READY) ---
  const focusPercentage = ((totalTrackedMinutes / minutesSinceStartOfDay) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1: PATRIMONIO DINÁMICO */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl">
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-2 text-center">
          Patrimonio Neto Seleccionado
        </p>
        <h2 className={`text-4xl font-black text-center tracking-tighter italic ${totalPatrimonio >= 0 ? 'text-white' : 'text-red-500'}`}>
          $ {totalPatrimonio.toLocaleString()}
        </h2>
        
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {accounts.map(acc => (
            <button
              key={acc.id}
              onClick={() => {
                setSelectedAccountIds(prev => 
                  prev.includes(acc.id) ? prev.filter(id => id !== acc.id) : [...prev, acc.id]
                )
              }}
              className={`px-3 py-1 rounded-xl text-[9px] font-black transition-all border ${
                selectedAccountIds.includes(acc.id) 
                  ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                  : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {acc.name}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: GRÁFICA DE TIEMPO */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl h-[380px] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 z-10">
          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Enfoque Diario</h3>
          <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
            {focusPercentage}% FOCUS
          </span>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalChartData}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {finalChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', borderRadius: '15px', fontSize: '10px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LEYENDA PERSONALIZADA PARA LLENAR ESPACIO */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {finalChartData.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[9px] font-black text-zinc-400 uppercase truncate">{item.name}</span>
              <span className="text-[9px] text-zinc-600 ml-auto">{Math.round(item.value)}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}