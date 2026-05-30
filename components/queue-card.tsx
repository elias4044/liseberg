"use client";

import { Queue } from "@/types/liseberg";
import { cn, formatTime, formatWait, waitMinutes } from "@/lib/utils";
import { Users, Clock, Hash, Zap, Eye, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border",
      status === "Open" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      status === "Closed" && "bg-red-500/10 text-red-400 border-red-500/20",
      status === "Paused" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "Open" && "bg-emerald-400",
        status === "Closed" && "bg-red-400",
        status === "Paused" && "bg-amber-400 animate-pulse",
      )} />
      {status}
    </span>
  );
}

interface QueueCardProps {
  queue: Queue;
  partySize: number;
  onJoin?: () => void;
  joining?: boolean;
  sniping?: boolean;
  onToggleSnipe?: () => void;
  onToggleWatch?: () => void;
  watching?: boolean;
  detailed?: boolean;
}

export function QueueCard({
  queue,
  partySize,
  onJoin,
  joining,
  sniping,
  onToggleSnipe,
  onToggleWatch,
  watching,
  detailed = false,
}: QueueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const estimated = queue.estimatedTimes.find((e) => e.partySize === partySize);
  const wait = estimated ? waitMinutes(estimated.time) : null;
  const closed = queue.status !== "Open";

  return (
    <div className={cn(
      "rounded-2xl border transition-all fade-up",
      closed
        ? "border-zinc-800/60 bg-zinc-900/30 opacity-50"
        : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700/80",
      sniping && "border-emerald-500/30 bg-emerald-500/5"
    )}>
      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-white font-semibold text-base leading-tight truncate">
              {queue.attractionName}
            </span>
            <span className="text-zinc-600 text-xs font-mono">{queue.key}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sniping && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Zap size={9} fill="currentColor" /> SNIPING
              </span>
            )}
            <StatusDot status={queue.status} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox icon={<Users size={11} />} label="In queue" value={queue.totalPeopleInQueue.toString()} />
          <StatBox icon={<Clock size={11} />} label="Wait" value={wait !== null ? formatWait(wait) : "—"} highlight={wait !== null && wait === 0} />
          <StatBox icon={<Hash size={11} />} label="Group" value={queue.nextGroupNumber ? `#${queue.nextGroupNumber}` : "—"} />
        </div>

        {/* Slot time */}
        {estimated && (
          <div className="flex items-center justify-between bg-zinc-800/40 rounded-xl px-3 py-2">
            <span className="text-zinc-500 text-xs">Your slot for {partySize}p</span>
            <span className="text-white font-semibold text-sm font-mono">{formatTime(estimated.time)}</span>
          </div>
        )}

        {queue.status === "Paused" && queue.pauseEndTime && (
          <p className="text-amber-400 text-xs flex items-center gap-1.5">
            <Clock size={11} /> Resumes at {formatTime(queue.pauseEndTime)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onJoin && (
            <button
              onClick={onJoin}
              disabled={closed || joining}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95",
                closed || joining
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-400 text-white"
              )}
            >
              {joining ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Joining…</>
              ) : "Join now"}
            </button>
          )}

          {onToggleSnipe && (
            <button
              onClick={onToggleSnipe}
              disabled={closed}
              className={cn(
                "h-10 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-95",
                sniping
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              )}
            >
              <Zap size={14} fill={sniping ? "currentColor" : "none"} />
              {sniping ? "Sniping" : "Snipe"}
            </button>
          )}

          {onToggleWatch && (
            <button
              onClick={onToggleWatch}
              className={cn(
                "h-10 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 active:scale-95",
                watching
                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              <Eye size={14} fill={watching ? "currentColor" : "none"} />
            </button>
          )}

          {detailed && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="h-10 px-3 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-all active:scale-95"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Expanded details */}
        {expanded && detailed && (
          <div className="border-t border-zinc-800 pt-3 flex flex-col gap-3 fade-up">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow label="Opens" value={formatTime(queue.openingTime)} />
              <InfoRow label="Closes" value={formatTime(queue.closingTime)} />
              <InfoRow label="VQ Opens" value={formatTime(queue.vqOpeningTime)} />
              <InfoRow label="Max party" value={`${queue.maxPartySize} people`} />
              {queue.lastGroupTime && <InfoRow label="Last group" value={formatTime(queue.lastGroupTime)} />}
              {queue.currentGroupNumber && <InfoRow label="Current #" value={`#${queue.currentGroupNumber}`} />}
            </div>

            {queue.upcomingGroups.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1">
                  <TrendingUp size={10} /> Upcoming groups
                </span>
                {queue.upcomingGroups.map((g) => (
                  <div key={g.groupNumber} className="flex items-center justify-between bg-zinc-800/40 rounded-lg px-3 py-1.5">
                    <span className="text-zinc-400 text-xs font-mono">#{g.groupNumber}</span>
                    <span className="text-zinc-500 text-xs">{g.peopleCount} people</span>
                    <span className="text-zinc-300 text-xs font-mono">{formatTime(g.estimatedTime)}</span>
                  </div>
                ))}
              </div>
            )}

            {queue.estimatedTimes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-semibold">All party sizes</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {queue.estimatedTimes.map((e) => (
                    <div key={e.partySize} className="bg-zinc-800/40 rounded-lg px-2 py-1.5 flex flex-col gap-0.5 text-center">
                      <span className="text-zinc-600 text-[10px]">{e.partySize}p</span>
                      <span className="text-zinc-300 text-xs font-mono">{formatTime(e.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-zinc-800/40 rounded-xl px-3 py-2 flex flex-col gap-1">
      <span className="text-zinc-600 text-[10px] uppercase tracking-widest flex items-center gap-1">
        {icon} {label}
      </span>
      <span className={cn("font-bold text-lg leading-none", highlight ? "text-emerald-400" : "text-white")}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-zinc-600 text-[10px] uppercase tracking-widest">{label}</span>
      <span className="text-zinc-300 text-sm font-mono">{value}</span>
    </div>
  );
}