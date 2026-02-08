export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const groupId = body.groupId;

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    const update: Record<string, any> = {};
    if (body.eventTime) update.eventTime = new Date(body.eventTime);
    if (typeof body.locationName === "string") update.locationName = body.locationName.trim();

    const group = await Group.findByIdAndUpdate(groupId, update, { new: true });
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
