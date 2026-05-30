import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function waitMinutes(timeString: string | null): number {
  if (!timeString) return Infinity;
  const target = new Date(timeString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

export function formatWait(minutes: number): string {
  if (minutes === Infinity) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function shortId(mid: string): string {
  if (!mid) return "";
  const parts = mid.split(":");
  if (parts.length > 1) {
    return `${parts[0].slice(0, 6)}...`;
  }
  return `${mid.slice(0, 8)}...`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}