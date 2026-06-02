"use client";

import { useGlobalState } from "@/components/global-state";
import { formatWait, waitMinutes, cn } from "@/lib/utils";
import { RefreshCw, Zap, Clock, Users, Smartphone, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JobState = 'requesting' | 'waiting' | 'success' | 'error';

export default function QueuesPage() {
  const { queues, tickets, freeMids, partySize, setPartySize, joinQueue, toggleSniper, snipers, refreshData } = useGlobalState();
  const [jobs, setJobs] = useState<Record<string, { state: JobState, startedAt: number, error?: string }>>({});
  const router = useRouter();

  // Get all currently active tickets to check if user is already in a queue
  const activeTickets = Object.values(tickets).filter(t => t !== null) as import("@/types/liseberg").Ticket[];
  const openQueues = queues.filter(q => q.status === "Open");

  // 1. Fast polling when waiting for phone
  useEffect(() => {
    const isWaiting = Object.values(jobs).some(j => j.state === 'waiting');
    if (!isWaiting) return;

    // Aggressively fetch data every 1.5s while waiting for the phone middleman to process the queue
    const interval = setInterval(() => {
      refreshData();
    }, 1500);
    return () => clearInterval(interval);
  }, [jobs, refreshData]);

  // 2. Timeout checker
  useEffect(() => {
    const timeoutChecker = setInterval(() => {
      setJobs(prev => {
        let updated = false;
        const next = { ...prev };
        Object.entries(next).forEach(([key, job]) => {
          if (job.state === 'waiting' && Date.now() - job.startedAt > 20000) {
            next[key] = { ...job, state: 'error', error: "Phone timeout. Is the app open?" };
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timeoutChecker);
  }, []);

  // 3. Success checker (triggers when tickets update)
  useEffect(() => {
    let updated = false;
    const nextJobs = { ...jobs };

    Object.entries(nextJobs).forEach(([key, job]) => {
      if (job.state === 'waiting') {
        const matchingTicket = activeTickets.find(t => t.queueKey === key);
        if (matchingTicket) {
          nextJobs[key] = { state: 'success', startedAt: Date.now() };
          updated = true;
          
          // Redirect to the ticket view after showing success for 1.5s
          setTimeout(() => {
            router.push(`/current/view?mid=${matchingTicket.messageIdentifier}`);
          }, 1500);
        }
      }
    });

    if (updated) setJobs(nextJobs);
  }, [tickets, activeTickets, jobs, router]);

  const handleJoin = async (key: string) => {
    if (jobs[key]?.state === 'requesting' || jobs[key]?.state === 'waiting') return;

    setJobs(prev => ({ ...prev, [key]: { state: 'requesting', startedAt: Date.now() } }));

    try {
      await joinQueue(key);
      // API call succeeded, now we wait for the phone to confirm it via Webhook/Polling
      setJobs(prev => ({ ...prev, [key]: { state: 'waiting', startedAt: Date.now() } }));
    } catch (e: any) {
      setJobs(prev => ({ ...prev, [key]: { state: 'error', error: e.message || "Failed to join", startedAt: Date.now() } }));
    }
  };

  const clearJob = (key: string) => {
    setJobs(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

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
          const existingTicket = activeTickets.find(t => t.queueKey === q.key);
          const job = jobs[q.key];
          
          return (
            <div key={q.key} className={cn("bg-zinc-900/40 border rounded-3xl p-5 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden transition-colors", job?.state === 'error' ? "border-red-500/40" : "border-zinc-800/80")}>
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

              {/* Dynamic Action Button logic */}
              {existingTicket ? (
                <Link 
                  href={`/current/view?mid=${existingTicket.messageIdentifier}`}
                  className="w-full py-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  View Ticket <ArrowRight size={16} />
                </Link>
              ) : job?.state === 'success' ? (
                <div className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 animate-pulse">
                  <CheckCircle2 size={18} /> Joined successfully!
                </div>
              ) : job?.state === 'error' ? (
                <button 
                  onClick={() => clearJob(q.key)}
                  className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <AlertCircle size={18} /> {job.error} (Retry)
                </button>
              ) : job?.state === 'waiting' ? (
                <div className="w-full py-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold text-sm flex items-center justify-center gap-2">
                  <Smartphone size={18} className="animate-pulse" /> Waiting for phone...
                </div>
              ) : (
                <button 
                  onClick={() => handleJoin(q.key)}
                  disabled={!estimated || freeMids.length === 0 || job?.state === 'requesting'}
                  className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-zinc-600 disabled:border-transparent border border-white/10 text-white font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {job?.state === 'requesting' ? (
                    <><RefreshCw size={16} className="animate-spin" /> Sending request...</>
                  ) : !estimated ? (
                    "Queue Full"
                  ) : freeMids.length === 0 ? (
                    "No keys available"
                  ) : (
                    "Join Queue"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}