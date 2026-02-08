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

    // If user already has an active group, return it
    const existing = await Group.findOne({
      members: userId,
      status: { $in: ["forming", "confirmed"] },
    });
    if (existing) {
      return NextResponse.json({
        message: "Already in group",
        group: existing,
      });
    }

    // Rolling matching: find an open group with same preferences
    const openGroup = await Group.findOne({
      activity: myPref.activity,
      status: "forming",
      members: { $ne: userId },
      $expr: { $lt: [{ $size: "$members" }, 4] },
      $or: [
        { vibe: myPref.vibe },
        { vibe: { $exists: false } },
        { vibe: null },
        { vibe: "" },
      ],
    }).sort({ createdAt: 1 });

    if (openGroup) {
      openGroup.members.push(userId);
      if (!openGroup.vibe) {
        openGroup.vibe = myPref.vibe;
      }
      if (openGroup.members.length >= 3) {
        openGroup.status = "confirmed";
      }
      await openGroup.save();

      return NextResponse.json({
        message: "Joined existing group",
        group: openGroup,
      });
    }

    // No open group yet → create a new forming group
    const group = await Group.create({
      members: [userId],
      activity: myPref.activity,
      vibe: myPref.vibe,
      status: "forming",
    });

    return NextResponse.json({
      message: "Group created",
      group,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
