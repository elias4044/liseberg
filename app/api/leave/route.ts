import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const partyCode = searchParams.get("partyCode");

    if (!partyCode) {
        return NextResponse.json({ error: "Missing partyCode parameter" }, { status: 400 });
    }

    const res = await fetch(`https://virtualqueue.liseberg.se/Party?partyCode=${encodeURIComponent(partyCode)}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to leave queue" }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
}