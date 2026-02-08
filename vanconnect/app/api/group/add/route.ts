export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { groupId, userId } = body;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Prevent duplicate add
    if (group.members.includes(userId)) {
      return NextResponse.json({ message: "User already in group" });
    }

    // Optional: limit group size (4)
    if (group.members.length >= 4) {
      return NextResponse.json({ error: "Group is full" }, { status: 400 });
    }

    group.members.push(userId);
    await group.save();

    return NextResponse.json({
      message: "User added",
      members: group.members,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
