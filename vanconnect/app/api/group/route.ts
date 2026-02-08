export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import Message from "@/models/Message";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const groups = await Group.find({ members: userId }).sort({ eventTime: 1, createdAt: -1 });

    const payload = await Promise.all(
      groups.map(async (group: any) => {
        const memberDocs = await User.find({ _id: { $in: group.members } }).select("name");
        const memberMap = new Map(memberDocs.map((doc: any) => [String(doc._id), doc.name]));
        const members = group.members.map((memberId: string) => ({
          id: String(memberId),
          name: memberMap.get(String(memberId)) ?? "Member",
        }));

        const lastMessage = await Message.findOne({ groupId: group._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: String(group._id),
          activity: group.activity ?? "Group",
          createdAt: group.createdAt,
          members,
          lastMessage: lastMessage?.text ?? "",
          lastMessageAt: lastMessage?.createdAt ?? group.createdAt,
          eventTime: group.eventTime ?? null,
          locationName: group.locationName ?? "",
          status: group.status ?? "forming",
        };
      })
    );

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
