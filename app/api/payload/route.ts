import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { Ticket } from "@/types/liseberg";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { ticket, event } = body;

    if (event !== "PARTY_ADDED" || !ticket) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const parsed: Ticket = typeof ticket === "string" ? JSON.parse(ticket) : ticket;

    await kv.set(`ticket:${parsed.messageIdentifier}`, parsed, { ex: 3600 });

    return NextResponse.json({ ok: true });
}