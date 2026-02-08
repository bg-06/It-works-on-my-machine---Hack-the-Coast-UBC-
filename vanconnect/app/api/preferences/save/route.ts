export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const activities = Array.isArray(body.activities)
      ? body.activities.filter(Boolean)
      : body.activity
      ? [body.activity]
      : [];

    const availabilityDays = Array.isArray(body.availabilityDays)
      ? body.availabilityDays.filter(Boolean)
      : [];

    const availabilityTimes = Array.isArray(body.availabilityTimes)
      ? body.availabilityTimes.filter(Boolean)
      : [];

    const pref = await Preference.findOneAndUpdate(
      { userId: body.userId },
      {
        userId: body.userId,
        activity: body.activity ?? activities[0] ?? 'study',
        activities,
        energyLevel: body.energyLevel ?? 'balanced',
        vibe: body.vibe ?? body.energyLevel ?? 'balanced',
        socialStyle: body.socialStyle ?? 'casual',
        indoorOutdoor: body.indoorOutdoor ?? 'both',
        sustainability: body.sustainability ?? 'low',
        availabilityDays,
        availabilityTimes,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(pref);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
