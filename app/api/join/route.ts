import { NextRequest, NextResponse } from "next/server";
import { JoinRequest } from "@/types/liseberg";

export async function PUT(req: NextRequest) {
    const body: JoinRequest = await req.json();
    const { queueKey, partySize, messageIdentifier } = body;

    if (!queueKey || !partySize || !messageIdentifier) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userIdentifier = messageIdentifier.split(":")[0];

    const res = await fetch("https://virtualqueue.liseberg.se/Party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            language: "en",
            messageIdentifier,
            messageType: "Push",
            partySize,
            queueKey,
            userIdentifier
        })
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to join queue" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
}