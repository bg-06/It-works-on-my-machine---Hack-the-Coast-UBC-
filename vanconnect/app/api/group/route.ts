export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import Message from "@/models/Message";
import Swipe from "@/models/Swipe";
import Location from "@/models/Location";
import Preference from "@/models/Preference";

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_ORDER = ["Morning", "Afternoon", "Evening"];

const expandDays = (days: string[]) => {
  if (!days || days.length === 0) {
    return new Set(DAY_ORDER);
  }
  const set = new Set<string>();
  days.forEach((day) => {
    if (day === "Weekdays") {
      ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((d) => set.add(d));
      return;
    }
    if (day === "Weekends") {
      ["Sat", "Sun"].forEach((d) => set.add(d));
      return;
    }
    set.add(day);
  });
  return set;
};

const expandTimes = (times: string[]) => {
  if (!times || times.length === 0) {
    return new Set(TIME_ORDER);
  }
  return new Set(times);
};

const nextDateForDay = (day: string) => {
  const today = new Date();
  const targetIdx = DAY_ORDER.indexOf(day);
  if (targetIdx === -1) return null;
  const currentIdx = today.getDay();
  let diff = targetIdx - currentIdx;
  if (diff < 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
};

const timeToHour = (time: string) => {
  switch (time) {
    case "Morning":
      return 9;
    case "Afternoon":
      return 13;
    case "Evening":
      return 18;
    default:
      return 12;
  }
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const groupId = searchParams.get("groupId");

    const buildPayload = async (group: any) => {
      // Auto-schedule when a group reaches 3+ members
      if (group.status === "forming" && Array.isArray(group.members) && group.members.length >= 3) {
        try {
          const memberPrefs = await Preference.find({ userId: { $in: group.members } });
          const daySets = memberPrefs.map((p: any) => expandDays(p.availabilityDays ?? []));
          const timeSets = memberPrefs.map((p: any) => expandTimes(p.availabilityTimes ?? []));

          const commonDays = DAY_ORDER.filter((d) => daySets.every((set) => set.has(d)));
          const commonTimes = TIME_ORDER.filter((t) => timeSets.every((set) => set.has(t)));

          if (commonDays.length > 0 && commonTimes.length > 0) {
            const nextDay = nextDateForDay(commonDays[0]);
            if (nextDay) {
              const hour = timeToHour(commonTimes[0]);
              nextDay.setHours(hour, 0, 0, 0);
              group.eventTime = nextDay;
            }
          }
          group.status = "scheduled";
          await group.save();
        } catch {}
      }
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
