import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { Ticket } from "@/types/liseberg";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const messageIdentifier = searchParams.get("messageIdentifier");

    if (!messageIdentifier) {
        return NextResponse.json({ error: "Missing messageIdentifier" }, { status: 400 });
    }

    const ticket = await kv.get<Ticket>(`ticket:${messageIdentifier}`);

    if (!ticket) {
        return NextResponse.json({ status: "waiting" });
    }

    return NextResponse.json(ticket);
}