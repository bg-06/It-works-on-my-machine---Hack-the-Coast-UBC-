export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const userId = String(body.userId ?? '');

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

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
        matchFound: Array.isArray(existing.members) && existing.members.length >= 2,
      });
    }

    // Rolling matching: find an open group with same preferences
    const openGroup = await Group.findOneAndUpdate(
      {
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
      },
      {
        $addToSet: { members: userId },
        $set: { vibe: myPref.vibe },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (openGroup) {
      if (openGroup.members.length >= 3 && openGroup.status !== "confirmed") {
        openGroup.status = "confirmed";
        await openGroup.save();
      }

      return NextResponse.json({
        message: "Joined existing group",
        group: openGroup,
        matchFound: Array.isArray(openGroup.members) && openGroup.members.length >= 2,
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
      matchFound: false,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
