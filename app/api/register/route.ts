import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { messageIdentifier } = body;

    if (!messageIdentifier || !messageIdentifier.includes(":")) {
        return NextResponse.json({ error: "Invalid messageIdentifier" }, { status: 400 });
    }

    await redis.set(`device:${messageIdentifier}`, { 
        messageIdentifier,
        registeredAt: new Date().toISOString()
    }, { ex: 86400 * 30 }); // 30 days

    return NextResponse.json({ ok: true });
}

export async function GET() {
    // Return all registered devices (for the UI to pick from)
    const keys = await redis.keys("device:*");
    const devices = await Promise.all(keys.map(k => redis.get(k)));
    return NextResponse.json(devices);
}