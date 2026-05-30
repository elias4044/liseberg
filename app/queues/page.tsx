"use client";

import { useGlobalState } from "@/components/global-state";
import { formatWait, waitMinutes, cn } from "@/lib/utils";
import { RefreshCw, Zap, Clock, Users } from "lucide-react";
import { useState } from "react";

export default function QueuesPage() {
  const { queues, freeMids, partySize, setPartySize, joinQueue, toggleSniper, snipers, refreshData } = useGlobalState();
  const [joining, setJoining] = useState<string | null>(null);

  const handleJoin = async (key: string) => {
    try {
      setJoining(key);
      await joinQueue(key);
    } catch (e: any) {
      alert(e.message || "Failed to join");
    } finally {
      setJoining(null);
    }
  };

  const openQueues = queues.filter(q => q.status === "Open");

  return (
    <div className="pt-12 animate-fade-in flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Queues</h1>
          <p className="text-zinc-400 text-sm">{freeMids.length} keys ready to use.</p>
        </div>
        <button onClick={refreshData} className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-all active:scale-90">
          <RefreshCw size={16} />
        </button>
      </header>

      {/* Party Size Selector */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users size={12} /> Party Size
        </label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => setPartySize(n)} className={cn("w-12 h-12 rounded-2xl text-sm font-semibold shrink-0 transition-all active:scale-95 border", partySize === n ? "bg-white text-black border-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]" : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800")}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {openQueues.length === 0 && <div className="text-center py-10 text-zinc-500 text-sm">No open rides right now.</div>}
        
        {openQueues.map(q => {
          const estimated = q.estimatedTimes.find(e => e.partySize === partySize);
          const waitMins = waitMinutes(estimated?.time ?? null);
          const isSniping = snipers.some(s => s.queueKey === q.key && s.partySize === partySize && s.enabled);
          
          return (
            <div key={q.key} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-5 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden">
              {isSniping && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />}
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{q.attractionName}</h3>
                  <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-black/40 rounded-lg w-max border border-zinc-800">
                    <Clock size={12} className="text-indigo-400" />
                    <span className="text-zinc-300">{estimated ? formatWait(waitMins) : "Full"}</span>
                  </div>
                </div>
                <button onClick={() => toggleSniper(q.key)} className={cn("p-2.5 rounded-xl transition-all active:scale-90 border", isSniping ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800")}>
                  <Zap size={16} fill={isSniping ? "currentColor" : "none"} />
                </button>
              </div>

              <button 
                onClick={() => handleJoin(q.key)}
                disabled={!estimated || freeMids.length === 0 || joining === q.key}
                className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-zinc-600 disabled:border-transparent border border-white/10 text-white font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {joining === q.key ? <RefreshCw size={16} className="animate-spin" /> : (!estimated ? "Queue Full" : "Join Queue")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}