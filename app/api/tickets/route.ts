import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mid = searchParams.get("mid");

    if (!mid) {
        return NextResponse.json({ error: "Missing mid parameter" }, { status: 400 });
    }

    const res = await fetch(`https://virtualqueue.liseberg.se/Ticket?messageIdentifier=${encodeURIComponent(mid)}`, {
        next: { revalidate: 0 }
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch ticket" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
}