"use client";

import { useState } from "react";
import { useGlobalState } from "@/components/global-state";
import { Key, Trash2, Plus, Terminal } from "lucide-react";
import { shortId } from "@/lib/utils";

export default function SettingsPage() {
  const { mids, addMids, removeMid } = useGlobalState();
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const newKeys = input.split(/[\n,]/).map(k => k.trim()).filter(k => k.length > 10);
    if (newKeys.length > 0) {
      addMids(newKeys);
      setInput("");
    }
  };

  return (
    <div className="pt-12 animate-fade-in flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your device keys for the queue system.</p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Key size={16} className="text-indigo-400" /> Add Keys
        </h2>
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-4 backdrop-blur-md flex flex-col gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your messageIdentifiers here...&#10;Separate multiple keys by newlines."
            className="w-full h-24 bg-black/50 border border-zinc-800 rounded-2xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
          />
          <button onClick={handleAdd} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2">
            <Plus size={16} /> Import Keys
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Terminal size={16} className="text-zinc-400" /> API Upload
        </h2>
        <div className="bg-black/40 border border-zinc-800/60 rounded-3xl p-5 backdrop-blur-md">
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            You can dynamically inject multiple keys into the system using our API endpoint.
          </p>
          <pre className="text-[10px] text-zinc-300 font-mono bg-zinc-900 p-3 rounded-xl overflow-x-auto border border-zinc-800">
            {`curl -X POST /api/keys \\
  -H "Content-Type: application/json" \\
  -d '{"keys": ["KEY_1", "KEY_2"]}'`}
          </pre>
        </div>
      </section>

      <section className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            Stored Keys <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px]">{mids.length}</span>
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          {mids.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-sm">No keys stored yet.</div>
          ) : (
            mids.map(mid => (
              <div key={mid} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800 rounded-2xl px-4 py-3 backdrop-blur-md">
                <span className="font-mono text-xs text-zinc-300">{shortId(mid)}</span>
                <button onClick={() => removeMid(mid)} className="p-2 -mr-2 text-zinc-500 hover:text-red-400 transition-colors active:scale-90">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}