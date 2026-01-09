"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { formatTime } from "../lib/timer-utils";
import DailyStats from "../components/DailyStats";
import Moneyboard from "../components/Moneyboard";
import QuickNotes from "../components/QuickNotes";

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);

  async function refreshLogs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logsData } = await supabase
      .from("time_logs")
      .select("*")
      .gte("start_time", today.toISOString());
    
    setDailyLogs(logsData || []);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: catData } = await supabase.from("categories").select("*").order("name");
      setCategories(catData || []);
      await refreshLogs();

      const { data: activeData } = await supabase
        .from("time_logs")
        .select("*")
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (activeData) {
        setActiveLog(activeData);
        const start = new Date(activeData.start_time).getTime();
        const now = new Date().getTime();
        setSeconds(Math.floor((now - start) / 1000));
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeLog) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  const handleStartTracking = async (categoryId: string) => {
    if (activeLog) await handleStopTracking();

    const { data, error } = await supabase
      .from('time_logs')
      .insert([{ category_id: categoryId, start_time: new Date().toISOString() }])
      .select().single();

    if (!error) {
      setActiveLog(data);
      setSeconds(0);
    }
  };

  const handleStopTracking = async () => {
    if (!activeLog) return;
    const { error } = await supabase
      .from('time_logs')
      .update({ end_time: new Date().toISOString() })
      .eq('id', activeLog.id);

    if (!error) {
      setActiveLog(null);
      setSeconds(0);
      await refreshLogs();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-500 tracking-tighter">MILI OS</h1>
        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
          {loading ? "Sincronizando..." : "Cloud Sync On"}
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">

        {/* Reemplaza la fila de estadísticas por esta de 3 columnas */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <DailyStats logs={dailyLogs} categories={categories} />
            <Moneyboard categories={categories} />
            <QuickNotes />
          </div>
        )}

        {/* WIDGET CRONÓMETRO */}
        {activeLog && (
          <div className="p-6 bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/50 rounded-3xl flex justify-between items-center shadow-2xl shadow-purple-500/10 transition-all">
            <div>
              <p className="text-xs text-purple-400 uppercase font-bold tracking-widest mb-1">Midiendo tiempo</p>
              <h2 className="text-2xl font-light">
                {categories.find(c => c.id === activeLog.category_id)?.name || "Actividad"}
              </h2>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-5xl font-mono font-medium tracking-tight italic">
                {formatTime(seconds)}
              </span>
              <button 
                onClick={handleStopTracking}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
              >
                DETENER
              </button>
            </div>
          </div>
        )}

        {/* GRILLA DE CATEGORÍAS (Solo las de tipo 'time') */}
        <section>
          <h2 className="text-xl font-medium mb-6 text-zinc-400">¿Qué estás haciendo ahora?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.filter(c => c.type === 'time').map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => handleStartTracking(cat.id)}
                className={`group p-6 rounded-3xl border transition-all text-left ${
                  activeLog?.category_id === cat.id 
                  ? 'bg-purple-600 border-purple-400 scale-95 shadow-[0_0_25px_rgba(168,85,247,0.3)]' 
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.emoji || "🕒"}</div>
                <h3 className="font-bold text-lg">{cat.name}</h3>
                <p className="text-xs opacity-50 uppercase tracking-tighter">Foco</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}