export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const userId = body.userId;

    // Get current user's preferences
    const myPref = await Preference.findOne({ userId });
    if (!myPref) {
      return NextResponse.json({ error: "Preferences not found" }, { status: 400 });
    }

    // Find similar users
    const matches = await Preference.find({
      activity: myPref.activity,
      vibe: myPref.vibe,
      userId: { $ne: userId },
    }).limit(4); // max group size = 5 including self

    const memberIds = [userId, ...matches.map(m => m.userId)];

    // Need at least 3 people
    if (memberIds.length < 3) {
      return NextResponse.json({ message: "Not enough matches yet" });
    }

    // Create group
    const group = await Group.create({
      members: memberIds,
      activity: myPref.activity,
    });

    return NextResponse.json({
      message: "Group created",
      group,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
