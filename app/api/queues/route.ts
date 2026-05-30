import { NextResponse } from "next/server";
import { Queue } from "@/types/liseberg";

export async function GET() {
    const res = await fetch("https://virtualqueue.liseberg.se/Queue", {
        next: { revalidate: 30 }
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch queues" }, { status: 502 });
    }

    const data: Queue[] = await res.json();
    return NextResponse.json(data);
}