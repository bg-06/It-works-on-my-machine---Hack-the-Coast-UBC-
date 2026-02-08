export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const groupId = body.groupId;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Build a filter: match by activity type, and optionally by tags
    const filter: Record<string, any> = { type: group.activity };

    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      filter.tags = { $in: body.tags.map((t: string) => t.toLowerCase()) };
    }

    const location = await Location.findOne(filter).sort({
      sustainabilityScore: -1,
    });

    return NextResponse.json(location);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
