export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";
import Group from "@/models/Group";
import Swipe from "@/models/Swipe";
import Location from "@/models/Location";

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

    // Find the user's most recently liked location so we can name the group after it
    const lastLikedSwipe = await Swipe.findOne({ userId, liked: true }).sort({ createdAt: -1 });
    let likedLocationName = "";
    let likedLocationId = "";
    let likedLocationImage = "";
    if (lastLikedSwipe?.locationId) {
      const loc = await Location.findById(lastLikedSwipe.locationId);
      if (loc) {
        likedLocationName = loc.name ?? "";
        likedLocationId = String(loc._id);
        likedLocationImage = Array.isArray(loc.images) && loc.images.length > 0 ? loc.images[0] : "";
      }
    }

    const availabilityDays = Array.isArray(myPref.availabilityDays)
      ? myPref.availabilityDays.filter(Boolean)
      : [];
    const availabilityTimes = Array.isArray(myPref.availabilityTimes)
      ? myPref.availabilityTimes.filter(Boolean)
      : [];

    const dayMatch =
      availabilityDays.length > 0
        ? [
            {
              $or: [
                { availabilityDays: { $in: availabilityDays } },
                { availabilityDays: { $exists: false } },
                { availabilityDays: { $size: 0 } },
              ],
            },
          ]
        : [];
    const timeMatch =
      availabilityTimes.length > 0
        ? [
            {
              $or: [
                { availabilityTimes: { $in: availabilityTimes } },
                { availabilityTimes: { $exists: false } },
                { availabilityTimes: { $size: 0 } },
              ],
            },
          ]
        : [];

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
        ...(dayMatch.length || timeMatch.length ? { $and: [...dayMatch, ...timeMatch] } : {}),
      },
      {
        $addToSet: { members: userId },
        $set: { vibe: myPref.vibe },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (openGroup) {
      let updated = false;
      if ((!openGroup.availabilityDays || openGroup.availabilityDays.length === 0) && availabilityDays.length > 0) {
        openGroup.availabilityDays = availabilityDays;
        updated = true;
      }
      if ((!openGroup.availabilityTimes || openGroup.availabilityTimes.length === 0) && availabilityTimes.length > 0) {
        openGroup.availabilityTimes = availabilityTimes;
        updated = true;
      }
      if (openGroup.members.length >= 3 && openGroup.status !== "scheduled") {
        openGroup.status = "scheduled";
        // Find common availability across members
        const memberPrefs = await Preference.find({ userId: { $in: openGroup.members } });
        const daySets = memberPrefs.map((p: any) => expandDays(p.availabilityDays ?? []));
        const timeSets = memberPrefs.map((p: any) => expandTimes(p.availabilityTimes ?? []));

        const commonDays = DAY_ORDER.filter((d) => daySets.every((set) => set.has(d)));
        const commonTimes = TIME_ORDER.filter((t) => timeSets.every((set) => set.has(t)));

        if (commonDays.length > 0 && commonTimes.length > 0) {
          const nextDay = nextDateForDay(commonDays[0]);
          if (nextDay) {
            const hour = timeToHour(commonTimes[0]);
            nextDay.setHours(hour, 0, 0, 0);
            openGroup.eventTime = nextDay;
          }
        }
        updated = true;
      }
      // Populate location info if the group doesn't have one yet
      if (!openGroup.locationName && likedLocationName) {
        openGroup.locationName = likedLocationName;
        openGroup.locationId = likedLocationId;
        openGroup.locationImage = likedLocationImage;
        updated = true;
      }
      if (updated) {
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
      availabilityDays,
      availabilityTimes,
      locationId: likedLocationId || undefined,
      locationName: likedLocationName || undefined,
      locationImage: likedLocationImage || undefined,
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
