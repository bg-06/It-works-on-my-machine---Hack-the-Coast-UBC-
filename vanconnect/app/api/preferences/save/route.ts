export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const pref = await Preference.findOneAndUpdate(
      { userId: body.userId },
      {
        userId: body.userId,
        // New onboarding fields
        goal: body.goal,
        transport: body.transport,
        energy: body.energy,
        interests: body.interests ?? [],
        // Availability
        availabilityDays: body.availabilityDays ?? [],
        availabilityTimes: body.availabilityTimes ?? [],
        // Legacy / back-compat
        activity: body.activity,
        energyLevel: body.energyLevel,
        vibe: body.vibe,
        indoorOutdoor: body.indoorOutdoor,
        sustainability: body.sustainability,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(pref);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
