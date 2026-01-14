"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DailyStatsProps {
  logs: any[];
  categories: any[];
}

export default function DailyStats({ logs, categories }: DailyStatsProps) {
  // 1. Calcular minutos transcurridos desde el inicio del día (00:00)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const minutesSinceStartOfDay = Math.floor((now.getTime() - startOfDay.getTime()) / 60000);

  // 2. Agrupar tiempo registrado por categoría
  const trackedData = categories
    .filter(cat => cat.type === 'time') // Solo categorías de tiempo
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

  // 3. Calcular tiempo NO registrado (Ocio / Tiempo Perdido)
  const totalTrackedMinutes = trackedData.reduce((acc, item) => acc + item.value, 0);
  const unrecordedTime = Math.max(0, minutesSinceStartOfDay - totalTrackedMinutes);

  // 4. Unificar datos para la gráfica
  const finalChartData = [
    ...trackedData,
    { 
      name: 'Ocio / No Registrado', 
      value: unrecordedTime, 
      color: '#3f3f46' // Zinc-700 (Gris oscuro)
    }
  ].filter(data => data.value > 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Distribución del Día</h3>
        <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md">
          {Math.floor(minutesSinceStartOfDay / 60)}h {minutesSinceStartOfDay % 60}m transcurridos
        </span>
      </div>

      {finalChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={finalChartData}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationDuration={1000}
            >
              {finalChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: any) => [value ? `${value} min` : '0 min', 'Duración']}
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-600 italic text-sm">
          Esperando datos de actividad...
        </div>
      )}
    </div>
  );
}