"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { formatTime } from "../lib/timer-utils";
import { DayPicker } from 'react-day-picker';
import TimeGrid from "../components/TimeGrid";
import 'react-day-picker/dist/style.css';
import DailyStats from "../components/DailyStats";
import Moneyboard from "../components/Moneyboard";
import QuickNotes from "../components/QuickNotes";
import TodoList from "../components/TodoList";
import Pomodoro from "../components/Pomodoro";
import Gamification from "../components/Gamification";
import ActivityFeed from "../components/ActivityFeed";
import AccountsTab from "../components/AccountsTab";

import { Toaster } from "react-hot-toast";

export default function Home() {
  // --- ESTADOS ---
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [dailyTransfers, setDailyTransfers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeLog, setActiveLog] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"feed" | "accounts">("feed");
  const [loading, setLoading] = useState(true);

  // --- 1. CÁLCULO DE FECHAS GLOBALES ---
  // Esto permite que tanto las consultas como el diseño usen el mismo tiempo
  const startOfSelected = new Date(selectedDate);
  startOfSelected.setHours(0, 0, 0, 0);
  
  const endOfSelected = new Date(selectedDate);
  endOfSelected.setHours(23, 59, 59, 999);

  // --- 2. FUNCIONES DE CARGA (FETCH) ---
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      // Lógica: Trae lo del día seleccionado O cualquier cosa incompleta de antes
      .or(`and(created_at.gte.${startOfSelected.toISOString()},created_at.lte.${endOfSelected.toISOString()}),is_completed.eq.false`)
      .order("created_at", { ascending: false });

    if (!error) setTodos(data || []);
  };

  const refreshDailyData = async () => {
    const startISO = startOfSelected.toISOString();
    const endISO = endOfSelected.toISOString();

    const [logs, expenses, transfers, accRes, catRes] = await Promise.all([
      supabase.from("time_logs").select("*").gte("start_time", startISO).lte("start_time", endISO),
      supabase.from("expenses").select("*, categories(name, emoji), accounts(name)").gte("created_at", startISO).lte("created_at", endISO).order("created_at", { ascending: false }),
      supabase.from("transfers").select(`*, from:from_account_id(name), to:to_account_id(name)`).gte("created_at", startISO).lte("created_at", endISO).order("created_at", { ascending: false }),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name")
    ]);

    setDailyLogs(logs.data || []);
    setDailyExpenses(expenses.data || []);
    setDailyTransfers(transfers.data || []);
    if (accRes.data) setAccounts(accRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  // --- 3. HANDLERS (ACCIONES) ---
  const handleRollover = async (todoId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("todos")
      .update({ created_at: now })
      .eq("id", todoId);

    if (!error) fetchTodos();
  };

  const handleStartTracking = async (categoryId: string) => {
    try {
      const now = new Date().toISOString();
      if (activeLog?.id) {
        const startTime = new Date(activeLog.start_time).getTime();
        const durationMs = Date.now() - startTime;
        if (durationMs < 60000) {
          await supabase.from("time_logs").delete().eq("id", activeLog.id);
        } else {
          await supabase.from("time_logs").update({ end_time: now }).eq("id", activeLog.id);
        }
      }

      const { data, error } = await supabase
        .from("time_logs")
        .insert([{ category_id: categoryId, start_time: now }])
        .select();

      if (error) throw error;
      if (data) {
        setActiveLog(data[0]);
        refreshDailyData();
      }
    } catch (err) {
      console.error("Error Tracking:", err);
    }
  };

  const handleStopTracking = async () => {
    if (!activeLog) return;
    const { error } = await supabase.from("time_logs").update({ end_time: new Date().toISOString() }).eq("id", activeLog.id);
    if (!error) { setActiveLog(null); setSeconds(0); refreshDailyData(); }
  };

  // --- 4. EFECTOS (RE-RENDERIZADO) ---
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshDailyData(), fetchTodos()]);
      
      const { data } = await supabase.from("time_logs").select("*").is("end_time", null).order("start_time", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setActiveLog(data);
        const start = new Date(data.start_time).getTime();
        setSeconds(Math.floor((Date.now() - start) / 1000));
      }
      setLoading(false);
    };
    init();
  }, [selectedDate]); // Se recarga todo cuando cambias la fecha en el calendario

  useEffect(() => {
    if (!activeLog) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeLog]);

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-500 animate-pulse font-black italic text-2xl">LOADING MILI OS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <Toaster position="bottom-center" />

      <header className="max-w-[1600px] mx-auto mb-10">
        <h1 className="text-5xl font-black text-purple-500 tracking-tighter italic">
          MILI OS <span className="text-zinc-800 text-sm not-italic ml-2 underline decoration-purple-500/30">v1.2</span>
        </h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.5em] font-black mt-1">Control de Operaciones Personales</p>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-3 space-y-8">
          <DailyStats logs={dailyLogs} categories={categories} accounts={accounts} />
          <Pomodoro categories={categories} />

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-zinc-500 text-[10px] font-black uppercase mb-6 tracking-[0.3em] text-center">Foco Actual</h3>
            <div className="grid grid-cols-3 gap-3">
              {categories.filter(c => c.type === 'time').map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => handleStartTracking(cat.id)}
                  className={`p-4 rounded-[2rem] transition-all duration-300 flex flex-col items-center gap-2 ${activeLog?.category_id === cat.id 
                      ? 'bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105 ring-2 ring-purple-400' 
                      : 'bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800'}`}
                >
                  <span className="text-2xl mb-1">{cat.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 p-4 rounded-[2rem] border border-zinc-800">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="text-white custom-calendar"
            />
          </div>

          <TimeGrid logs={dailyLogs} categories={categories} />
          <QuickNotes />
        </div>

        {/* COLUMNA CENTRAL */}
        <div className="lg:col-span-6 space-y-8 h-full flex flex-col">
          {activeLog && (
            <div className="p-10 bg-gradient-to-br from-purple-600 via-purple-900 to-black rounded-[3rem] border border-purple-400/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Sesión Activa</span>
              <h2 className="text-5xl font-black my-6 flex items-center gap-4">
                <span className="text-6xl">{categories.find(c => c.id === activeLog.category_id)?.emoji}</span>
                {categories.find(c => c.id === activeLog.category_id)?.name}
              </h2>
              <div className="flex justify-between items-end">
                <span className="text-7xl font-mono font-black tracking-tighter">{formatTime(seconds)}</span>
                <button onClick={handleStopTracking} className="bg-white text-black px-10 py-5 rounded-[2rem] font-black hover:bg-zinc-200 transition-colors">DETENER</button>
              </div>
            </div>
          )}

          {/* SECCIÓN: MISIONES DEL PASADO */}
          {todos.filter(t => !t.is_completed && new Date(t.created_at) < startOfSelected).length > 0 && (
            <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-[2.5rem]">
              <h3 className="text-orange-500 text-[10px] font-black uppercase mb-4 tracking-[0.3em] flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                Misiones del Pasado
              </h3>
              <div className="space-y-3">
                {todos
                  .filter(t => !t.is_completed && new Date(t.created_at) < startOfSelected)
                  .map(todo => (
                    <div key={todo.id} className="flex items-center justify-between bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50">
                      <span className="text-zinc-400 text-sm italic">{todo.title}</span>
                      <button onClick={() => handleRollover(todo.id)} className="text-[9px] bg-orange-500 text-white px-4 py-2 rounded-xl font-black uppercase hover:bg-orange-400 transition-all">Traer a Hoy</button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex-1">
            <TodoList categories={categories} todos={todos} onUpdate={fetchTodos} />
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-3 space-y-8 h-full flex flex-col">
          <Gamification todos={todos} />
          <Moneyboard categories={categories} accounts={accounts} onUpdate={refreshDailyData} />

          <div className="flex bg-zinc-900 p-1.5 rounded-[1.5rem] border border-zinc-800">
            <button onClick={() => setActiveTab("feed")} className={`flex-1 py-2.5 rounded-[1.2rem] text-[10px] font-black ${activeTab === "feed" ? "bg-white text-black" : "text-zinc-500"}`}>HISTORIAL</button>
            <button onClick={() => setActiveTab("accounts")} className={`flex-1 py-2.5 rounded-[1.2rem] text-[10px] font-black ${activeTab === "accounts" ? "bg-white text-black" : "text-zinc-500"}`}>CUENTAS</button>
          </div>

          <div className="flex-1 min-h-[400px]">
            {activeTab === "feed" ? (
              <ActivityFeed logs={dailyLogs} expenses={dailyExpenses} transfers={dailyTransfers} categories={categories} onUpdate={refreshDailyData} />
            ) : (
              <AccountsTab accounts={accounts} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}