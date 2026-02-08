export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import Message from "@/models/Message";
import Swipe from "@/models/Swipe";
import Location from "@/models/Location";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const groupId = searchParams.get("groupId");

    const buildPayload = async (group: any) => {
      // Backfill locationName for older groups that don't have one
      if (!group.locationName && Array.isArray(group.members) && group.members.length > 0) {
        try {
          const likedSwipe = await Swipe.findOne({
            userId: { $in: group.members },
            liked: true,
          }).sort({ createdAt: -1 });

          if (likedSwipe?.locationId) {
            const loc = await Location.findById(likedSwipe.locationId);
            if (loc?.name) {
              group.locationName = loc.name;
              group.locationId = String(loc._id);
              group.locationImage = Array.isArray(loc.images) && loc.images.length > 0 ? loc.images[0] : "";
              await group.save();
            }
          }
        } catch {}
      }

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
        vibe: group.vibe ?? "",
      };
    };

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      const payload = await buildPayload(group);
      return NextResponse.json(payload);
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const groups = await Group.find({ members: userId }).sort({ eventTime: 1, createdAt: -1 });

    const payload = await Promise.all(
      groups.map(buildPayload)
    );

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
