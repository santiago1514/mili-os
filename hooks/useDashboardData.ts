// hooks/useDashboardData.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";



export function useDashboardData(selectedDate: Date){
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<any[]>([]);
  const [dailyTransfers, setDailyTransfers] = useState<any[]>([]);
  const [activeLog, setActiveLog] = useState<any>(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lógica de fechas calculada dentro del hook
  const startOfSelected = new Date(selectedDate);
  startOfSelected.setHours(0, 0, 0, 0);
  const endOfSelected = new Date(selectedDate);
  endOfSelected.setHours(23, 59, 59, 999);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
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

  const handleStopTracking = async () => {
    if (!activeLog) return;
    const { error } = await supabase.from("time_logs").update({ end_time: new Date().toISOString() }).eq("id", activeLog.id);
    if (!error) { 
      setActiveLog(null); 
      setSeconds(0); 
      refreshDailyData(); 
    }
  };

  const handleStartTracking = async (categoryId: string) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("time_logs").insert([{ category_id: categoryId, start_time: now }]).select();
    if (!error && data) { 
      setActiveLog(data[0]); 
      refreshDailyData(); 
    }
  };

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
  }, [selectedDate]);

  useEffect(() => {
    if (!activeLog) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [activeLog]);

  // Exponemos TODO lo que page.tsx necesita
  return {
    categories, accounts, todos, dailyLogs, dailyExpenses, dailyTransfers,
    activeLog, seconds, loading, startOfSelected,
    fetchTodos, refreshDailyData, handleStopTracking, handleStartTracking
  };
}