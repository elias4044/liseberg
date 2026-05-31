"use client";

import { useQRCode } from "next-qrcode";
import { useGlobalState } from "@/components/global-state";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { Lexend } from "next/font/google";

const lexend = Lexend({ subsets: ["latin"] });

// I find Lexend being the closest all around as a font.

function TicketView() {
  const { tickets, leaveQueue, mids } = useGlobalState();
  const [leaving, setLeaving] = useState<string | null>(null);
  const { Image } = useQRCode();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const targetMid = searchParams.get("mid");
  const targetCode = searchParams.get("partyCode") || searchParams.get("ticketCode");

  // Get all currently active queues
  const activeEntries = Object.entries(tickets).filter(([_, t]) => t !== null) as [string, import("@/types/liseberg").Ticket][];
  
  // If we have stored MIDs but tickets haven't populated yet, the global state is still fetching.
  const isGlobalStateLoading = mids.length > 0 && Object.keys(tickets).length === 0;

  // Smart lookup: Check by mid, then by partyCode, then fallback to the first active ticket.
  let queueToDisplay: [string, import("@/types/liseberg").Ticket] | undefined = undefined;
  if (targetMid) {
    queueToDisplay = activeEntries.find(([mid]) => mid === targetMid);
  } else if (targetCode) {
    queueToDisplay = activeEntries.find(([_, t]) => t.ticketCode === targetCode);
  } else if (activeEntries.length > 0) {
    queueToDisplay = activeEntries[0]; 
  }
  

  // Show a loading screen while the global state fetches the tickets
  if (isGlobalStateLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center min-h-screen bg-white text-[#134635]">
        <RefreshCw size={32} className="animate-spin mb-4" />
        <p className="text-lg font-medium">Loading ticket...</p>
      </div>
    );
  }

  // If fetching is done and we STILL don't have a queue to display
  if (!queueToDisplay) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center min-h-screen text-center px-4 bg-white text-[#134635]">
        <p className="text-lg font-medium">You are not in any queues right now.</p>
        <Link href="/current" className="mt-4 px-8 py-2.5 rounded-full border-2 border-[#134635] font-bold">
          Go back
        </Link>
      </div>
    );
  }

  const [mid, ticket] = queueToDisplay;

  const handleLeave = async () => {
    setLeaving(ticket.ticketCode);
    await leaveQueue(mid, ticket.ticketCode);
    setLeaving(null);
    router.push("/current");
  };

  // Calculate the time window formatting (e.g., 13:08-13:18)
  const startDate = new Date(ticket.actualTime);
  const startHour = startDate.getHours().toString().padStart(2, '0');
  const startMin = startDate.getMinutes().toString().padStart(2, '0');
  const startTime = `${startHour}:${startMin}`;

  // Assuming a standard 10-minute window for the virtual queue based on the screenshot
  const endDate = new Date(startDate.getTime() + 10 * 60000);
  const endHour = endDate.getHours().toString().padStart(2, '0');
  const endMin = endDate.getMinutes().toString().padStart(2, '0');
  const endTime = `${endHour}:${endMin}`;

  return (
    <div className={"fixed inset-0 z-100 bg-white overflow-y-auto pb-20"} >
      {/* Top Bar with Chevron Close Button */}
      <div className="w-full flex justify-end p-6 absolute">
        <Link href="/current">
          <ChevronDown size={24} className="text-[#134635]" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex flex-col items-center pt-6 px-6 text-[#134635]">
        {/* Header */}
        <p className="text-[16px] font-medium">You are in queue for</p>
        <h1 className="text-[29px] font-semibold tracking-tight mb-4 text-center">{ticket.attractionName}</h1>

        {/* Stats Row */}
        <div className="flex w-full items-center justify-between mb-8">
          <div className="flex flex-col items-center w-[30%]">
            <span className="text-[18px] font-normal mb-3 text-[#134635]">Group</span>
            <span className="text-[19px] font-semibold">{ticket.groupNumber}</span>
          </div>
          <div className="w-px h-20 bg-gray-300" />
          <div className="flex flex-col items-center w-[40%]">
            <span className="text-[18px] font-normal mb-3 text-[#134635]">Time</span>
            <span className="text-[19px] font-semibold">{startTime}-{endTime}</span>
          </div>
          <div className="w-px h-20 bg-gray-300" />
          <div className="flex flex-col items-center w-[30%]">
            <span className="text-[18px] font-normal mb-3 text-[#134635]">People</span>
            <span className="text-[19px] font-semibold">{ticket.partySize}</span>
          </div>
        </div>

        {/* Dashed Line */}
        <div className="w-full border-t-2 border-dashed border-gray-200 mb-10"/>

        {/* QR Code */}
        <div className="mb-">
          <Image
            text={ticket.ticketCode}
            options={{
              type: "image/jpeg",
              margin: 0,
              width: 130,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            }}
          />
        </div>

        {/* Instructions */}
        <div className="text-center font-normal text-[16px] flex flex-col items-center mt-5  mb-5">
          <p>Welcome!</p>
          <p>Use the virtual queue entrance</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span>within</span>
            <span className="bg-[#134635] text-white px-0.5 py-0.1 text-[18px] tracking-wide">
              10 min.
            </span>
          </div>
        </div>

        {/* Leave Button */}
        <button
          onClick={handleLeave}
          disabled={leaving === ticket.ticketCode}
          className="w-40 py-3.5 rounded-full border-2 border-[#134635] text-[#134635] font-bold text-[16px] transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          {leaving === ticket.ticketCode ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            "Leave queue"
          )}
        </button>
      </div>
    </div>
  );
}

// Wrap the main component in Suspense to prevent Next.js build errors when using useSearchParams()
export default function CurrentViewPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
         <RefreshCw size={32} className="animate-spin text-[#134635]" />
      </div>
    }>
      <div className={lexend.className}>
        <TicketView />
      </div>
    </Suspense>
  );
}