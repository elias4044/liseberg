"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Ticket, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/queues", icon: List, label: "Queues" },
    { href: "/current", icon: Ticket, label: "Current" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pt-4 px-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
      <nav className="flex items-center gap-2 px-3 py-3 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/60 rounded-3xl shadow-2xl pointer-events-auto">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all active:scale-95 group">
              {active && <div className="absolute inset-0 bg-white/10 rounded-2xl" />}
              <Icon size={22} className={cn("transition-colors", active ? "text-white" : "text-zinc-500 group-hover:text-zinc-400")} />
              {active && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}