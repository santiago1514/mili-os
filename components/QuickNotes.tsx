"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function QuickNotes() {
  const [note, setNote] = useState("");
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    setRecentNotes(data || []);
  };

  useEffect(() => { fetchNotes(); }, []);

  const saveNote = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && note.trim()) {
      const { error } = await supabase.from("notes").insert([{ content: note }]);
      if (!error) {
        setNote("");
        fetchNotes();
      }
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
      <h3 className="text-zinc-400 text-sm font-bold uppercase mb-4 tracking-widest">Notas Rápidas</h3>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={saveNote}
        placeholder="Escribe algo y pulsa Enter..."
        className="w-full bg-black border border-zinc-800 rounded-xl p-3 mb-4 focus:border-purple-500 outline-none transition-all"
      />
      <div className="space-y-2">
        {recentNotes.map((n) => (
          <div key={n.id} className="text-sm text-zinc-300 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50">
            {n.content}
          </div>
        ))}
      </div>
    </div>
  );
}