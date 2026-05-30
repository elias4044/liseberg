/**
 * API: Manage Multiple Device Keys (MIDs)
 *
 * This endpoint allows you to upload multiple 'messageIdentifiers' at once.
 * The Next.js frontend fetches this endpoint on load to synchronize keys.
 *
 * How to upload multiple keys via cURL:
 * 
 * curl -X POST http://localhost:3000/api/keys \
 *      -H "Content-Type: application/json" \
 *      -d '{"keys": ["fSxraWhDQ_iXk...:APA91...", "anotherKey..."]}'
 */

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { keys } = body;

        if (!keys || !Array.isArray(keys)) {
            return NextResponse.json({ error: "Invalid payload. Provide an array of 'keys'" }, { status: 400 });
        }

        // Store each key in Redis as a device representation
        for (const key of keys) {
            await redis.set(`device:${key}`, {
                messageIdentifier: key,
                registeredAt: new Date().toISOString()
            }, { ex: 86400 * 30 }); // 30 days
        }

        return NextResponse.json({ ok: true, added: keys.length });
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const dbKeys = await redis.keys("device:*");
        const devices = await Promise.all(dbKeys.map(k => redis.get<{messageIdentifier: string}>(k)));
        const keysList = devices.filter(d => d).map(d => d?.messageIdentifier);
        
        return NextResponse.json({ keys: keysList });
    } catch (e) {
        return NextResponse.json({ keys: [] }); // Fallback on error
    }
}