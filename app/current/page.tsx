"use client";

import { useGlobalState } from "@/components/global-state";
import { QrCode, LogOut, Clock, RefreshCw } from "lucide-react";
import { formatWait, waitMinutes, shortId } from "@/lib/utils";
import { useState } from "react";

export default function CurrentPage() {
  const { tickets, leaveQueue, refreshData } = useGlobalState();
  const [leaving, setLeaving] = useState<string | null>(null);

  const activeEntries = Object.entries(tickets).filter(([_, t]) => t !== null) as [string, import("@/types/liseberg").Ticket][];

  const handleLeave = async (mid: string, code: string) => {
    setLeaving(code);
    await leaveQueue(mid, code);
    setLeaving(null);
  };

  return (
    <div className="pt-12 animate-fade-in flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Current Queues</h1>
          <p className="text-zinc-400 text-sm">Your active spots</p>
        </div>
        <button onClick={refreshData} className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 transition-all active:scale-90">
          <RefreshCw size={16} />
        </button>
      </header>

      {activeEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <QrCode size={48} className="text-zinc-800 mb-4" />
          <p className="text-zinc-400 text-sm">You are not in any queues right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {activeEntries.map(([mid, t]) => {
            const waitMins = waitMinutes(t.actualTime);
            return (
              <div key={t.ticketCode} className="bg-gradient-to-b from-zinc-900/80 to-black/60 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="px-2 py-1 rounded-md bg-black/40 border border-zinc-800 text-[10px] font-mono text-zinc-500">
                    ID: {shortId(mid)}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{t.attractionName}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-indigo-400 font-medium">
                    <Clock size={14} />
                    <span>{waitMins <= 0 ? "Ready now!" : `In ~${formatWait(waitMins)}`}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                  <QrCode size={80} className="text-black" />
                  <p className="font-mono text-black font-bold text-sm tracking-widest">{t.ticketCode}</p>
                </div>

                <div className="flex justify-between items-center bg-black/40 border border-zinc-800/80 rounded-2xl p-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Party Size</span>
                    <span className="text-lg font-bold text-zinc-200">{t.partySize}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-zinc-800" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Group</span>
                    <span className="text-lg font-bold text-zinc-200">#{t.groupNumber}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-zinc-800" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">Status</span>
                    <span className="text-sm font-bold text-emerald-400">{t.status}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleLeave(mid, t.ticketCode)}
                  disabled={leaving === t.ticketCode}
                  className="w-full py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 border border-red-500/20"
                >
                  {leaving === t.ticketCode ? <RefreshCw size={16} className="animate-spin" /> : <><LogOut size={16} /> Leave Queue</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}