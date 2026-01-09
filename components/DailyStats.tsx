"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DailyStatsProps {
  logs: any[];
  categories: any[];
}

export default function DailyStats({ logs, categories }: DailyStatsProps) {
  // 1. Lógica pro: Agrupar tiempo por categoría
  const chartData = categories.map(cat => {
    const totalSeconds = logs
      .filter(log => log.category_id === cat.id && log.end_time)
      .reduce((acc, log) => {
        const duration = (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000;
        return acc + duration;
      }, 0);

    return {
      name: cat.name,
      value: Math.round(totalSeconds / 60), // Convertimos a minutos
      color: cat.color_hex || '#8b5cf6'
    };
  }).filter(data => data.value > 0); // Solo mostrar lo que tiene tiempo

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-[350px]">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4">Minutos de Hoy</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-600 italic">
          No hay datos suficientes hoy
        </div>
      )}
    </div>
  );
}