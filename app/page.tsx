"use client";

import { useGlobalState } from "@/components/global-state";
import { Zap, Activity, Users, Ticket as TicketIcon, List } from "lucide-react";
import Link from "next/link";
import { formatWait, waitMinutes } from "@/lib/utils";

export default function Dashboard() {
  const { mids, freeMids, queues, tickets, snipers, partySize } = useGlobalState();

  const openQueues = queues.filter((q) => q.status === "Open");
  const activeTickets = Object.values(tickets).filter(t => t !== null);
  const activeSnipers = snipers.filter(s => s.enabled);

  const shortestWait = openQueues.reduce((min, q) => {
    const e = q.estimatedTimes.find((e) => e.partySize === partySize);
    if (!e) return min;
    const w = waitMinutes(e.time);
    return w < min ? w : min;
  }, Infinity);

  if (mids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
          <Activity size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome to VQ Pro</h1>
          <p className="text-zinc-400 text-sm leading-relaxed px-4">You need to add at least one device key to start joining queues and using snipers.</p>
        </div>
        <Link href="/settings" className="px-8 py-3.5 rounded-2xl bg-white text-black font-semibold text-sm transition-all active:scale-95 mt-4 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
          Add Device Keys
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-12 animate-fade-in flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Dashboard</h1>
        <p className="text-zinc-400 text-sm">You have {freeMids.length} out of {mids.length} keys available.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<TicketIcon size={16} />} label="Active Queues" value={activeTickets.length} bg="from-indigo-500/20 to-indigo-500/5" border="border-indigo-500/20" text="text-indigo-400" />
        <StatCard icon={<Zap size={16} />} label="Active Snipers" value={activeSnipers.length} bg="from-emerald-500/20 to-emerald-500/5" border="border-emerald-500/20" text="text-emerald-400" />
        <StatCard icon={<Users size={16} />} label="Total Keys" value={mids.length} bg="from-zinc-500/20 to-zinc-500/5" border="border-zinc-500/20" text="text-zinc-300" />
        <StatCard icon={<Activity size={16} />} label="Shortest Wait" value={shortestWait === Infinity ? "—" : formatWait(shortestWait)} bg="from-purple-500/20 to-purple-500/5" border="border-purple-500/20" text="text-purple-400" />
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 flex flex-col gap-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/queues" className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
            <List size={20} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Browse Rides</span>
          </Link>
          <Link href="/current" className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-95">
            <TicketIcon size={20} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">View Current</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, border, text }: any) {
  return (
    <div className={`bg-gradient-to-br ${bg} border ${border} rounded-3xl p-4 flex flex-col gap-3 backdrop-blur-md`}>
      <div className={`w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center ${text}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}