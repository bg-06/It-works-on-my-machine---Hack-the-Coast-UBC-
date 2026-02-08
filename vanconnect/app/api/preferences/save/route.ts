export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const pref = await Preference.create({
      userId: body.userId,
      activity: body.activity,
      energyLevel: body.energyLevel,
      vibe: body.vibe,
      indoorOutdoor: body.indoorOutdoor,
      sustainability: body.sustainability,
    });

    return NextResponse.json(pref);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
