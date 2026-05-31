"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Queue, Ticket, SniperConfig } from "@/types/liseberg";

interface GlobalState {
  mids: string[];
  queues: Queue[];
  tickets: Record<string, Ticket | null>;
  snipers: SniperConfig[];
  partySize: number;
  addMids: (newMids: string[]) => void;
  removeMid: (mid: string) => void;
  setPartySize: (size: number) => void;
  joinQueue: (queueKey: string) => Promise<void>;
  leaveQueue: (mid: string, ticketCode: string) => Promise<void>;
  toggleSniper: (queueKey: string) => void;
  removeSniper: (id: string) => void;
  freeMids: string[];
  refreshData: () => Promise<void>;
}

const GlobalContext = createContext<GlobalState | null>(null);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [mids, setMids] = useState<string[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [tickets, setTickets] = useState<Record<string, Ticket | null>>({});
  const [snipers, setSnipers] = useState<SniperConfig[]>([]);
  const [partySize, setPartySize] = useState<number>(1);
  const sniperRunning = useRef(false);

  // Load state from local storage & API
  useEffect(() => {
    const savedMids = localStorage.getItem("liseberg_mids");
    const savedSnipers = localStorage.getItem("liseberg_snipers");
    if (savedMids) setMids(JSON.parse(savedMids));
    if (savedSnipers) setSnipers(JSON.parse(savedSnipers));

    // Also fetch from API to merge
    fetch("/api/keys").then(r => r.json()).then(data => {
      if (data?.keys?.length) {
        setMids(prev => Array.from(new Set([...prev, ...data.keys])));
      }
    }).catch(() => {});
  }, []);

  // Persist state
  useEffect(() => {
    localStorage.setItem("liseberg_mids", JSON.stringify(mids));
  }, [mids]);

  useEffect(() => {
    localStorage.setItem("liseberg_snipers", JSON.stringify(snipers));
  }, [snipers]);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch("/api/queues");
      if (res.ok) setQueues(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (mids.length === 0) return;
    const newTickets: Record<string, Ticket | null> = {};
    for (const mid of mids) {
      try {
        const res = await fetch(`/api/tickets?mid=${encodeURIComponent(mid)}`);
        if (res.ok) {
          const data = await res.json();
          // API returns an array or single ticket, grab the active one
          const activeTicket = Array.isArray(data) 
            ? data.find(t => t.status === "Confirmed" || t.status === "Created") 
            : (data.status === "Confirmed" || data.status === "Created" ? data : null);
            
          newTickets[mid] = activeTicket || null;
        } else {
          newTickets[mid] = null;
        }
      } catch {
        newTickets[mid] = null;
      }
    }
    setTickets(newTickets);
  }, [mids]);

  // --- FIX: Add missing triggers for initial load --- //
  
  // 1. Fetch queues immediately on mount
  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  // 2. Fetch tickets whenever the keys (mids) update/load
  useEffect(() => {
    if (mids.length > 0) {
      fetchTickets();
    }
  }, [mids, fetchTickets]);

  // ------------------------------------------------ //

  const refreshData = useCallback(async () => {
    await fetchQueues();
    await fetchTickets();
  }, [fetchQueues, fetchTickets]);

  const freeMids = mids.filter(mid => !tickets[mid]);

  // The Sniper Loop
  useEffect(() => {
    const runSnipers = async () => {
      if (sniperRunning.current || snipers.length === 0 || queues.length === 0) return;
      sniperRunning.current = true;

      const activeSnipers = snipers.filter(s => s.enabled);
      let availableMids = [...freeMids];

      for (const sniper of activeSnipers) {
        if (availableMids.length === 0) break; // No keys left

        const q = queues.find(q => q.key === sniper.queueKey);
        if (q?.status === "Open") {
          const slot = q.estimatedTimes.find(e => e.partySize === sniper.partySize);
          if (slot) {
            // Snipe successful! Grab a free MID.
            const midToUse = availableMids.shift()!;
            try {
              await fetch("/api/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queueKey: sniper.queueKey, partySize: sniper.partySize, messageIdentifier: midToUse })
              });
              // Disable sniper
              setSnipers(prev => prev.map(s => s.id === sniper.id ? { ...s, enabled: false } : s));
            } catch { /* Try again next loop */ }
          }
        }
      }
      
      if (activeSnipers.length > 0) await fetchTickets(); // refresh if snipers triggered
      sniperRunning.current = false;
    };

    const interval = setInterval(() => {
      fetchQueues().then(runSnipers);
    }, 12000);

    return () => clearInterval(interval);
  }, [snipers, queues, freeMids, fetchQueues, fetchTickets]);

  const addMids = (newMids: string[]) => {
    setMids(prev => Array.from(new Set([...prev, ...newMids])));
  };

  const removeMid = (midToRemove: string) => {
    setMids(prev => prev.filter(mid => mid !== midToRemove));
  };

  const joinQueue = async (queueKey: string) => {
    if (freeMids.length === 0) throw new Error("No free keys available. Leave a queue first.");
    const midToUse = freeMids[0];
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueKey, partySize, messageIdentifier: midToUse })
    });
    if (!res.ok) throw new Error("Failed to join queue");
    await fetchTickets();
  };

  const leaveQueue = async (mid: string, ticketCode: string) => {
    await fetch(`/api/leave?partyCode=${ticketCode}`, { method: "DELETE" });
    await fetchTickets();
  };

  const toggleSniper = (queueKey: string) => {
    setSnipers(prev => {
      const existing = prev.find(s => s.queueKey === queueKey && s.partySize === partySize);
      if (existing) {
        return prev.map(s => s.id === existing.id ? { ...s, enabled: !s.enabled } : s);
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        queueKey,
        partySize,
        enabled: true,
        createdAt: new Date().toISOString()
      }];
    });
  };

  const removeSniper = (id: string) => {
    setSnipers(prev => prev.filter(s => s.id !== id));
  };

  return (
    <GlobalContext.Provider value={{ mids, queues, tickets, snipers, partySize, addMids, removeMid, setPartySize, joinQueue, leaveQueue, toggleSniper, removeSniper, freeMids, refreshData }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobalState = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobalState must be used within GlobalProvider");
  return ctx;
};