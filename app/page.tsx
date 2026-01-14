"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { formatTime } from "../lib/timer-utils";
import DailyStats from "../components/DailyStats";
import Moneyboard from "../components/Moneyboard";
import QuickNotes from "../components/QuickNotes";
import TodoList from "../components/TodoList";
import Pomodoro from "../components/Pomodoro";
import Gamification from "../components/Gamification";
import ActivityFeed from "../components/ActivityFeed";
import AccountsTab from "../components/AccountsTab";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

export default function Home() {
  // --- 1. ESTADOS ---
  const [categories, setCategories] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [dailyTransfers, setDailyTransfers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'accounts'>('feed');

  // --- 2. FUNCIONES DE CARGA (LOGICA) ---

  const fetchTodos = async () => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });
    setTodos(data || []);
  };

  // Función principal que refresca toda la interfaz
  const refreshData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Cargar Categorías
      const { data: catData } = await supabase.from("categories").select("*").order("name");
      if (catData) setCategories(catData);

      // Cargar Cuentas
      const { data: accData } = await supabase.from('accounts').select('*').order('name', { ascending: true });
      if (accData) setAccounts(accData);

      // Cargar Logs de Tiempo del día
      const { data: logsData } = await supabase.from("time_logs").select("*").gte("start_time", today.toISOString());
      setDailyLogs(logsData || []);

      // Cargar Gastos del día
      const { data: expensesData } = await supabase.from("expenses").select("*").gte("created_at", today.toISOString());
      setDailyExpenses(expensesData || []);

      // Cargar Transferencias del día
      const { data: transfersData } = await supabase.from("transfers").select("*").gte("created_at", today.toISOString());
      setDailyTransfers(transfersData || []);

    } catch (error) {
      console.error("Error sincronizando:", error);
    }
  };

  // --- 3. HOOKS (CICLO DE VIDA) ---

  // Efecto inicial al cargar la página
  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshData();
      await fetchTodos();

      // Verificar si hay una sesión de tiempo activa
      const { data: activeData } = await supabase
        .from("time_logs")
        .select("*")
        .is("end_time", null)
        .order("start_time", { ascending: false }).limit(1).single();

      if (activeData) {
        setActiveLog(activeData);
        const start = new Date(activeData.start_time).getTime();
        setSeconds(Math.floor((new Date().getTime() - start) / 1000));
      }
      setLoading(false);
    }
    init();
  }, []);

  // Efecto para el segundero del timer
  useEffect(() => {
    let interval: any;
    if (activeLog) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeLog]);

  // --- 4. MANEJADORES DE EVENTOS (HANDLERS) ---

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
      await refreshData(); 
    }
  };

  // --- 5. RENDERIZADO ---
  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-500 animate-pulse font-black italic text-2xl tracking-tighter">
          LOADING MILI OS...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <Toaster />
      
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-purple-500 tracking-tighter italic">
            MILI OS <span className="text-zinc-800 text-sm not-italic ml-2 underline decoration-purple-500/30">v1.2</span>
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">Control de Operaciones Personales</p>
        </div>
        <div className="hidden md:flex px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 uppercase font-black">System Status</span>
            <span className="text-xs text-green-500 font-bold tracking-tight">ONLINE_SYNC</span>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* IZQUIERDA */}
        <div className="lg:col-span-4 space-y-6">
          <DailyStats logs={dailyLogs} categories={categories} />
          <Pomodoro categories={categories} />
          <QuickNotes />
        </div>

        {/* CENTRO */}
        <div className="lg:col-span-5 space-y-6">
          {activeLog && (
            <div className="p-8 bg-gradient-to-br from-purple-700 via-purple-900 to-black rounded-[2.5rem] border border-purple-500/30 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300">Active Session</span>
                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tight">
                {categories.find(c => c.id === activeLog.category_id)?.emoji} {categories.find(c => c.id === activeLog.category_id)?.name}
              </h2>
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-6xl font-mono font-black tracking-tighter italic text-white">
                  {formatTime(seconds)}
                </span>
                <button onClick={handleStopTracking} className="bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-zinc-200 transition-all">
                  FINISH
                </button>
              </div>
            </div>
          )}

          <TodoList categories={categories} todos={todos} onUpdate={fetchTodos} />

          <section className="bg-zinc-900/30 border border-zinc-800/50 p-6 rounded-[2.5rem] backdrop-blur-sm">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Módulos de Tiempo</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.filter(c => c.type === 'time').map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => handleStartTracking(cat.id)}
                  className={`group p-4 rounded-2xl border transition-all text-left ${
                    activeLog?.category_id === cat.id 
                    ? 'bg-purple-600 border-purple-400' 
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-3xl mb-3">{cat.emoji}</div>
                  <p className="font-black text-[11px] uppercase tracking-wider">{cat.name}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* DERECHA */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
          <Gamification todos={todos} /> 
          
          <Moneyboard 
            categories={categories} 
            accounts={accounts} 
            onUpdate={refreshData} 
          />

          <div className="flex bg-zinc-900 p-1.5 rounded-full border border-zinc-800 gap-1">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'feed' ? 'bg-zinc-100 text-black' : 'text-zinc-500'
              }`}
            >
              Historial
            </button>
            <button 
              onClick={() => setActiveTab('accounts')}
              className={`flex-1 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'accounts' ? 'bg-zinc-100 text-black' : 'text-zinc-500'
              }`}
            >
              Cuentas
            </button>
          </div>

          <div className="flex-1 overflow-hidden min-h-[400px]">
            {activeTab === 'feed' ? (
              <ActivityFeed 
                logs={dailyLogs} 
                expenses={dailyExpenses} 
                transfers={dailyTransfers} 
                categories={categories} 
                onUpdate={refreshData} 
              />
            ) : (
              <AccountsTab accounts={accounts} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}