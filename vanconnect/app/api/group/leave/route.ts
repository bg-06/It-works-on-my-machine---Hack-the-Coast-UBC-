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

    // Remove user
    group.members = group.members.filter((id: string) => id !== userId);

    // If group empty → delete it
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return NextResponse.json({ message: "Group deleted (empty)" });
    }

    await group.save();

    return NextResponse.json({
      message: "Left group",
      members: group.members,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
