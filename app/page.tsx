"use client";

import { useState } from "react";
import { formatTime } from "../lib/timer-utils";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Toaster } from "react-hot-toast";

// Componentes
import TimeGrid from "../components/TimeGrid";
import DailyStats from "../components/DailyStats";
import Moneyboard from "../components/Moneyboard";
import QuickNotes from "../components/QuickNotes";
import TodoList from "../components/TodoList";
import Pomodoro from "../components/Pomodoro";
import Gamification from "../components/Gamification";
import ActivityFeed from "../components/ActivityFeed";
import AccountsTab from "../components/AccountsTab";
import StatsView from "@/components/StatsView";
import { useDashboardData } from "../hooks/useDashboardData";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'timeline' | 'stats'>('timeline');
  const [activeTab, setActiveTab] = useState<"feed" | "accounts">("feed");

  const { 
    categories, accounts, todos, dailyLogs, dailyExpenses, dailyTransfers,
    activeLog, seconds, loading, 
    fetchTodos, refreshDailyData, handleStopTracking, handleStartTracking 
  } = useDashboardData(selectedDate);

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-purple-500 font-black italic text-2xl tracking-tighter animate-pulse">
            LOADING MILI OS v2.0...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6 font-sans selection:bg-purple-500/30">
      <Toaster position="bottom-center" />

      {/* HEADER DE ALTA PRECISIÓN */}
      <header className="max-w-[1700px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-zinc-900 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-white tracking-tighter italic">
              MILI<span className="text-purple-500">OS</span>
            </h1>
            <span className="bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500 border border-zinc-800">V 2.0.4</span>
          </div>
          <p className="text-zinc-500 text-[9px] uppercase tracking-[0.6em] font-black mt-1">Personal Intelligence Command Center</p>
        </div>
        
        {/* SELECTOR DE VISTA DINÁMICO */}
        <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 backdrop-blur-md">
          <button 
            onClick={() => setView('timeline')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === 'timeline' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Línea de Tiempo
          </button>
          <button 
            onClick={() => setView('stats')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === 'stats' ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Estadísticas
          </button>
        </div>
      </header>

      <main className="max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: BIOMETRÍA Y CONTROL */}
        <div className="lg:col-span-3 space-y-6 animate-os [animation-delay:100ms]">
          <DailyStats logs={dailyLogs} categories={categories} accounts={accounts} />
          
          {/* BOTONERA DE FOCO RÁPIDO MEJORADA */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem] backdrop-blur-sm">
            <h3 className="text-zinc-600 text-[9px] font-black uppercase mb-6 tracking-[0.3em] text-center italic">Quick Deploy</h3>
            <div className="grid grid-cols-3 gap-3">
              {categories.filter((c: any) => c.type === 'time').map((cat: any) => (
                <button 
                  key={cat.id}
                  onClick={() => handleStartTracking(cat.id)}
                  className={`group p-4 rounded-3xl transition-all duration-500 flex flex-col items-center gap-2 ${
                    activeLog?.category_id === cat.id 
                    ? 'bg-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.2)] scale-105 ring-1 ring-purple-400' 
                    : 'bg-zinc-900/20 border border-zinc-800/50 hover:border-purple-500/50 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 group-hover:text-white">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/20 p-2 rounded-[2.5rem] border border-zinc-800 flex justify-center scale-95 origin-top">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="custom-calendar"
            />
          </div>
          <Pomodoro categories={categories} />
          <QuickNotes />
        </div>

        {/* COLUMNA CENTRAL: NÚCLEO OPERATIVO */}
        <div className="lg:col-span-6 space-y-6 animate-os [animation-delay:200ms]">
          {/* MONITOR DE ACTIVIDAD EN TIEMPO REAL */}
          {activeLog && (
            <div className="relative overflow-hidden p-8 bg-gradient-to-br from-purple-600 to-indigo-900 rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                 <span className="text-9xl font-black italic">LIVE</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Sesión de Alto Rendimiento</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-7xl bg-black/20 p-4 rounded-3xl backdrop-blur-md">
                        {categories.find((c: any) => c.id === activeLog.category_id)?.emoji}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                            {categories.find((c: any) => c.id === activeLog.category_id)?.name}
                        </h2>
                        <div className="text-6xl font-mono font-black tracking-tighter text-white mt-2">
                            {formatTime(seconds)}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleStopTracking} 
                    className="w-full mt-8 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-100 transition-all active:scale-[0.98] shadow-lg"
                >
                    Finalizar Operación
                </button>
              </div>
            </div>
          )}

          {/* ÁREA DE RENDERIZADO PRINCIPAL */}
          <div className="min-h-[500px] animate-in fade-in duration-700">
            {view === 'timeline' ? (
              <TimeGrid logs={dailyLogs} categories={categories} />
            ) : (
              <StatsView logs={dailyLogs} categories={categories} />
            )}
          </div>

          <TodoList categories={categories} todos={todos} onUpdate={fetchTodos} />
        </div>

        {/* COLUMNA DERECHA: LOGÍSTICA Y RECURSOS */}
        <div className="lg:col-span-3 space-y-6 animate-os [animation-delay:300ms]">
          <Gamification todos={todos} />
          <Moneyboard categories={categories} accounts={accounts} onUpdate={refreshDailyData} />

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col h-[500px]">
            <div className="flex p-1.5 bg-zinc-950 border-b border-zinc-800">
              <button 
                onClick={() => setActiveTab("feed")} 
                className={`flex-1 py-3 rounded-2xl text-[9px] font-black tracking-[0.2em] transition-all ${activeTab === "feed" ? "bg-zinc-800 text-white shadow-inner" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                FEED
              </button>
              <button 
                onClick={() => setActiveTab("accounts")} 
                className={`flex-1 py-3 rounded-2xl text-[9px] font-black tracking-[0.2em] transition-all ${activeTab === "accounts" ? "bg-zinc-800 text-white shadow-inner" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                CUENTAS
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {activeTab === "feed" ? (
                <ActivityFeed logs={dailyLogs} expenses={dailyExpenses} transfers={dailyTransfers} categories={categories} onUpdate={refreshDailyData} />
              ) : (
                <AccountsTab accounts={accounts} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}