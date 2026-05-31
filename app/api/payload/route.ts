import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { Ticket } from "@/types/liseberg";

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const { ticket, event } = body;

    if (event !== "PARTY_ADDED" || !ticket) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const parsed: Ticket = typeof ticket === "string" ? JSON.parse(ticket) : ticket;

    try {
        const res = await fetch(`https://virtualqueue.liseberg.se/Ticket?ticketCode=${encodeURIComponent(parsed.ticketCode)}`, {
            method: "PUT",
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to update ticket" }, { status: res.status });
        }



        await redis.set(`ticket:${parsed.messageIdentifier}`, parsed, { ex: 3600 });
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}