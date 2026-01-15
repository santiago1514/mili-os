"use client";

import { useState, useEffect } from "react";
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
  // ─────────────────────
  // 1. ESTADOS
  // ─────────────────────
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [dailyTransfers, setDailyTransfers] = useState<any[]>([]);

  const [activeLog, setActiveLog] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);

  const [activeTab, setActiveTab] = useState<"feed" | "accounts">("feed");
  const [loading, setLoading] = useState(true);

  // ─────────────────────
  // 2. FUNCIONES DE CARGA
  // ─────────────────────

  const fetchTodos = async () => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    setTodos(data || []);
  };

  const refreshCoreData = async () => {
    const [catRes, accRes] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("accounts").select("*").order("name")
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (accRes.data) setAccounts(accRes.data);
  };

  const refreshDailyData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [logs, expenses, transfers, accRes] = await Promise.all([
      supabase.from("time_logs").select("*").gte("start_time", today.toISOString()),
      supabase .from("expenses") .select("*, categories(name, emoji), accounts(name)") .gte("created_at", today.toISOString()) .order("created_at", { ascending: false }),
      supabase.from("transfers") .select(`*, from:from_account_id(name), to:to_account_id(name)`).gte("created_at", today.toISOString()).order("created_at", { ascending: false }),
      supabase.from("accounts").select("*").order("name")
    ]);

    setDailyLogs(logs.data || []);
    setDailyExpenses(expenses.data || []);
    setDailyTransfers(transfers.data || []);
    if (accRes.data) setAccounts(accRes.data);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshCoreData(),
        refreshDailyData()
      ]);
    } catch (error) {
      console.error("Error sincronizando:", error);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────
  // 3. EFECTOS
  // ─────────────────────

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshData();
      await fetchTodos();

      const { data } = await supabase
        .from("time_logs")
        .select("*")
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setActiveLog(data);
        const start = new Date(data.start_time).getTime();
        setSeconds(Math.floor((Date.now() - start) / 1000));
      }

      setLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (!activeLog) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLog]);

  // ─────────────────────
  // 4. HANDLERS
  // ─────────────────────

  const handleStartTracking = async (categoryId: string) => {
    if (activeLog) await handleStopTracking();

    const { data, error } = await supabase
      .from("time_logs")
      .insert([{ category_id: categoryId, start_time: new Date().toISOString() }])
      .select()
      .single();

    if (!error) {
      setActiveLog(data);
      setSeconds(0);
    }
  };

  const handleStopTracking = async () => {
    if (!activeLog) return;

    const { error } = await supabase
      .from("time_logs")
      .update({ end_time: new Date().toISOString() })
      .eq("id", activeLog.id);

    if (!error) {
      setActiveLog(null);
      setSeconds(0);
      await refreshData();
    }
  };

  // ─────────────────────
  // 5. LOADING
  // ─────────────────────

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-500 animate-pulse font-black italic text-2xl">
          LOADING MILI OS...
        </div>
      </div>
    );
  }

  // ─────────────────────
  // 6. RENDER
  // ─────────────────────

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <Toaster />

      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-purple-500 tracking-tighter italic">
            MILI OS{" "}
            <span className="text-zinc-800 text-sm not-italic ml-2 underline decoration-purple-500/30">
              v1.2
            </span>
          </h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">
            Control de Operaciones Personales
          </p>
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
            <div className="p-8 bg-gradient-to-br from-purple-700 via-purple-900 to-black rounded-[2.5rem] border border-purple-500/30">
              <h2 className="text-4xl font-black mb-6">
                {categories.find(c => c.id === activeLog.category_id)?.emoji}{" "}
                {categories.find(c => c.id === activeLog.category_id)?.name}
              </h2>

              <div className="flex justify-between items-center">
                <span className="text-6xl font-mono font-black">
                  {formatTime(seconds)}
                </span>
                <button
                  onClick={handleStopTracking}
                  className="bg-white text-black px-8 py-4 rounded-2xl font-black"
                >
                  FINISH
                </button>
              </div>
            </div>
          )}

          <TodoList categories={categories} todos={todos} onUpdate={fetchTodos} />

          

          <section className="bg-zinc-900/30 p-6 rounded-[2.5rem]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.filter(c => c.type === "time").map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleStartTracking(cat.id)}
                  className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800"
                >
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <p className="text-[11px] font-black uppercase">{cat.name}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* DERECHA */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <Gamification todos={todos} />

          <Moneyboard
            categories={categories}
            accounts={accounts}
            onUpdate={refreshDailyData} 
          />

          <div className="flex bg-zinc-900 p-1.5 rounded-full border border-zinc-800">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex-1 py-2 text-[10px] font-black ${
                activeTab === "feed" ? "bg-white text-black" : "text-zinc-500"
              }`}
            >
              Historial
            </button>
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 py-2 text-[10px] font-black ${
                activeTab === "accounts" ? "bg-white text-black" : "text-zinc-500"
              }`}
            >
              Cuentas
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === "feed" ? (
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
