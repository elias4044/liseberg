"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Queue {
  key: string;
  attractionName: string;
  status: "Open" | "Closed" | "Paused";
  totalPeopleInQueue: number;
  maxPartySize: number;
  estimatedTimes: { partySize: number; time: string }[];
  nextGroupActualTime: string | null;
  currentGroupNumber: number | null;
  nextGroupNumber: number | null;
  vqClosingTime: string;
  pauseEndTime: string | null;
}

interface Ticket {
  attractionName: string;
  queueKey: string;
  partySize: number;
  ticketCode: string;
  groupNumber: number;
  actualTime: string;
  originalTime: string;
  status: "Created" | "Confirmed" | "Used" | "Cancelled";
  isConfirmed: boolean;
  messageIdentifier: string;
  cancelledReason: string | null;
}

type AppView = "setup" | "queues" | "joining" | "ticket";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function waitMinutes(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60000));
}

function shortId(mid: string): string {
  return mid.split(":")[0].slice(0, 8) + "…";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Closed: "bg-red-500/15 text-red-400 border-red-500/30",
    Paused: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Created: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    Used: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    Cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-[11px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border ${map[status] ?? "bg-zinc-700 text-zinc-300"}`}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-300">
      <span className="mt-0.5 shrink-0">⚠</span>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-200 transition-colors">✕</button>
    </div>
  );
}

// ─── Setup View ───────────────────────────────────────────────────────────────

function SetupView({ onComplete }: { onComplete: (mid: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed.includes(":")) {
      setError("That doesn't look like a valid messageIdentifier — it should contain a colon.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIdentifier: trimmed }),
      });
      if (!res.ok) throw new Error("Registration failed");
      onComplete(trimmed);
    } catch {
      setError("Could not register your device. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-16 pb-10 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Liseberg Queue</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Paste your FCM messageIdentifier from the Android helper app to get started.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
          Message Identifier
        </label>
        <textarea
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors resize-none font-mono"
          rows={4}
          placeholder="xxxx:APA91b..."
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className="w-full h-12 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {loading ? <Spinner /> : "Continue →"}
      </button>

      <p className="text-zinc-600 text-xs text-center leading-relaxed">
        Your identifier is stored securely and only used to join queues on your behalf.
      </p>
    </div>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function QueueCard({
  queue,
  partySize,
  onJoin,
  joining,
}: {
  queue: Queue;
  partySize: number;
  onJoin: () => void;
  joining: boolean;
}) {
  const estimated = queue.estimatedTimes.find((e) => e.partySize === partySize);
  const wait = estimated ? waitMinutes(estimated.time) : null;
  const closed = queue.status !== "Open";

  return (
    <div className={`rounded-3xl border p-5 flex flex-col gap-4 transition-all ${closed ? "border-zinc-800 bg-zinc-900/40 opacity-60" : "border-zinc-700/60 bg-zinc-900"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-white font-semibold text-base leading-tight">{queue.attractionName}</span>
          <span className="text-zinc-500 text-xs font-mono">{queue.key}</span>
        </div>
        <StatusPill status={queue.status} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-800/60 rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest">In queue</span>
          <span className="text-white font-bold text-lg">{queue.totalPeopleInQueue}</span>
        </div>
        <div className="bg-zinc-800/60 rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Wait</span>
          <span className="text-white font-bold text-lg">
            {wait !== null ? `${wait}m` : "—"}
          </span>
        </div>
        <div className="bg-zinc-800/60 rounded-xl px-3 py-2 flex flex-col gap-0.5">
          <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Slot</span>
          <span className="text-white font-bold text-lg">
            {estimated ? formatTime(estimated.time) : "—"}
          </span>
        </div>
      </div>

      {queue.status === "Paused" && queue.pauseEndTime && (
        <p className="text-amber-400 text-xs">Resumes at {formatTime(queue.pauseEndTime)}</p>
      )}

      <button
        onClick={onJoin}
        disabled={closed || joining}
        className="w-full h-11 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {joining ? <><Spinner /><span>Joining…</span></> : `Join for ${partySize} person${partySize > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

// ─── Queues View ──────────────────────────────────────────────────────────────

function QueuesView({
  messageIdentifier,
  onJoined,
  onSwitchDevice,
}: {
  messageIdentifier: string;
  onJoined: (queueKey: string) => void;
  onSwitchDevice: () => void;
}) {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [joiningKey, setJoiningKey] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");
  const [search, setSearch] = useState("");

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch("/api/queues");
      if (!res.ok) throw new Error("Failed to load queues");
      const data: Queue[] = await res.json();
      setQueues(data.filter((q) => q.status !== "Closed" || q.totalPeopleInQueue > 0));
      setError("");
    } catch {
      setError("Couldn't load queues. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 30000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  async function handleJoin(queue: Queue) {
    setJoiningKey(queue.key);
    setJoinError("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueKey: queue.key, partySize, messageIdentifier }),
      });
      if (!res.ok) throw new Error("Join failed");
      onJoined(queue.key);
    } catch {
      setJoinError(`Couldn't join ${queue.attractionName}. Try again.`);
    } finally {
      setJoiningKey(null);
    }
  }

  const filtered = queues.filter((q) =>
    q.attractionName.toLowerCase().includes(search.toLowerCase()) ||
    q.key.toLowerCase().includes(search.toLowerCase())
  );

  const open = filtered.filter((q) => q.status === "Open");
  const rest = filtered.filter((q) => q.status !== "Open");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-zinc-800/60 px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-lg tracking-tight">Liseberg Queue</h1>
            <button onClick={onSwitchDevice} className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors text-left">
              {shortId(messageIdentifier)}
            </button>
          </div>
          <button
            onClick={fetchQueues}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm transition-colors active:scale-90"
            title="Refresh"
          >
            ↻
          </button>
        </div>

        {/* Party size */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-xs shrink-0">Party size</span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPartySize(n)}
                className={`w-8 h-8 rounded-xl text-sm font-semibold shrink-0 transition-all active:scale-90 ${partySize === n ? "bg-sky-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search attractions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 px-5 py-4 pb-24">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
        {joinError && <ErrorBanner message={joinError} onDismiss={() => setJoinError("")} />}

        {!loading && open.length === 0 && !error && (
          <div className="text-center text-zinc-500 text-sm py-16">No open queues right now.</div>
        )}

        {open.map((q) => (
          <QueueCard
            key={q.key}
            queue={q}
            partySize={partySize}
            onJoin={() => handleJoin(q)}
            joining={joiningKey === q.key}
          />
        ))}

        {rest.length > 0 && (
          <>
            <div className="text-zinc-600 text-xs uppercase tracking-widest font-semibold mt-2 px-1">Closed</div>
            {rest.map((q) => (
              <QueueCard
                key={q.key}
                queue={q}
                partySize={partySize}
                onJoin={() => handleJoin(q)}
                joining={joiningKey === q.key}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Ticket View ──────────────────────────────────────────────────────────────

function TicketView({
  queueKey,
  messageIdentifier,
  onBack,
}: {
  queueKey: string;
  messageIdentifier: string;
  onBack: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/status?messageIdentifier=${encodeURIComponent(messageIdentifier)}&queueKey=${queueKey}`);
      if (!res.ok) throw new Error("Poll failed");
      const data = await res.json();
      if (data.status !== "waiting" && data.ticketCode) {
        setTicket(data);
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      setError("Lost connection. Retrying…");
    }
  }, [messageIdentifier, queueKey]);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 3000);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [poll]);

  const waitTime = ticket?.actualTime ? waitMinutes(ticket.actualTime) : null;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-6 pb-10 gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-sm transition-colors active:scale-90"
        >
          ←
        </button>
        <span className="text-white font-semibold">Your Ticket</span>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

      {!ticket ? (
        <div className="flex flex-col items-center justify-center gap-6 flex-1 py-16">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-sky-500/40" />
            <div className="absolute inset-2 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center flex flex-col gap-1">
            <p className="text-white font-semibold">Waiting for confirmation</p>
            <p className="text-zinc-500 text-sm">Your spot in <span className="text-zinc-300">{queueKey}</span> is being reserved…</p>
            <p className="text-zinc-600 text-xs mt-1 font-mono">{elapsed}s elapsed</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Main ticket card */}
          <div className="rounded-3xl border border-zinc-700/60 bg-zinc-900 overflow-hidden">
            {/* Top strip */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sky-100 text-xs uppercase tracking-widest font-semibold">Virtual Ticket</p>
                <p className="text-white font-bold text-xl leading-tight mt-0.5">{ticket.attractionName}</p>
              </div>
              <StatusPill status={ticket.status} />
            </div>

            {/* Dashed divider */}
            <div className="relative px-5">
              <div className="border-t border-dashed border-zinc-700" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black" />
            </div>

            {/* Details */}
            <div className="px-5 py-5 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Group</span>
                <span className="text-white font-bold text-2xl">#{ticket.groupNumber}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Party</span>
                <span className="text-white font-bold text-2xl">{ticket.partySize} pax</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Your time</span>
                <span className="text-white font-bold text-2xl">{formatTime(ticket.actualTime)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Wait</span>
                <span className="text-white font-bold text-2xl">
                  {waitTime !== null && waitTime > 0 ? `${waitTime}m` : waitTime === 0 ? "Now!" : "—"}
                </span>
              </div>
            </div>

            {/* Ticket code */}
            <div className="px-5 pb-5">
              <div className="bg-zinc-800/60 rounded-2xl px-4 py-3 flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Ticket code</span>
                <span className="text-zinc-300 font-mono text-sm break-all">{ticket.ticketCode}</span>
              </div>
            </div>
          </div>

          {ticket.status === "Cancelled" && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              Ticket cancelled{ticket.cancelledReason ? `: ${ticket.cancelledReason}` : "."}
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full h-11 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-all active:scale-95"
          >
            ← Back to queues
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [view, setView] = useState<AppView>("setup");
  const [messageIdentifier, setMessageIdentifier] = useState("");
  const [activeQueueKey, setActiveQueueKey] = useState("");

  // Restore saved identifier
  useEffect(() => {
    const saved = localStorage.getItem("liseberg_mid");
    if (saved) {
      setMessageIdentifier(saved);
      setView("queues");
    }
  }, []);

  function handleSetup(mid: string) {
    localStorage.setItem("liseberg_mid", mid);
    setMessageIdentifier(mid);
    setView("queues");
  }

  function handleJoined(queueKey: string) {
    setActiveQueueKey(queueKey);
    setView("ticket");
  }

  function handleSwitchDevice() {
    localStorage.removeItem("liseberg_mid");
    setMessageIdentifier("");
    setView("setup");
  }

  return (
    <main className="bg-black min-h-screen text-white max-w-md mx-auto relative">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/30 via-black to-black pointer-events-none" />
      <div className="relative z-10">
        {view === "setup" && <SetupView onComplete={handleSetup} />}
        {view === "queues" && (
          <QueuesView
            messageIdentifier={messageIdentifier}
            onJoined={handleJoined}
            onSwitchDevice={handleSwitchDevice}
          />
        )}
        {view === "ticket" && (
          <TicketView
            queueKey={activeQueueKey}
            messageIdentifier={messageIdentifier}
            onBack={() => setView("queues")}
          />
        )}
      </div>
    </main>
  );
}