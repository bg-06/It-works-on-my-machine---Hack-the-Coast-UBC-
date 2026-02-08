export const runtime = "nodejs";

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import Group from "@/models/Group";
import Location from "@/models/Location";

const LEAVE_NO_TRACE_MSG = [
  "Hey everyone! Welcome to the group! 🌲",
  "",
  "Since we're heading out on a hike, here are a few quick Leave No Trace tips to keep in mind:",
  "",
  "1. Stay on marked trails to protect the surrounding plants and soil.",
  "2. Pack out everything you bring in — no litter left behind!",
  "3. Respect wildlife — observe from a distance and never feed animals.",
  "4. Leave natural objects like rocks, plants, and flowers where you find them.",
  "5. Be considerate of other hikers — keep noise down and yield the trail when needed.",
  "",
  "Let's have an amazing time while keeping Vancouver's trails beautiful for everyone! Feel free to ask me anything about the trip. 🥾",
].join("\n");

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

  console.log(`[chat/get] called with groupId=${groupId}`);

    if (!groupId) {
      return NextResponse.json([]);
    }

    let messages = await Message.find({ groupId }).sort({ createdAt: 1 }).lean();

    // If this is an outdoor / nature-related group with no messages yet, seed a
    // Gemini welcome message with Leave No Trace tips automatically.
  if (messages.length === 0) {
      try {
        // Support both ObjectId and plain-string lookups
        const isObjectId = mongoose.Types.ObjectId.isValid(groupId);
        const group = isObjectId
          ? await Group.findById(groupId).lean()
          : await Group.findOne({ _id: groupId }).lean();

        const g = group as any;
        if (!g) {
          console.log(`[chat/get] no group found for id=${groupId}`);
        } else {
          console.log(`[chat/get] found group id=${groupId} activity=${String(g.activity)} location=${String(g.locationName)}`);
        }

        // Check the group's activity + location name for nature keywords
        const blob = `${g?.activity ?? ""} ${g?.locationName ?? ""}`.toLowerCase();
        let isOutdoor = /hik(e|ing)|trail|outdoor|park|seawall|beach|garden|forest|mountain|nature|walk/.test(blob);

        // Also check the linked Location document's type / indoorOutdoor field
        if (!isOutdoor && g?.locationId) {
          try {
            const loc = await Location.findById(g.locationId).lean() as any;
            if (loc) {
              const locBlob = `${loc.type ?? ""} ${loc.indoorOutdoor ?? ""} ${loc.name ?? ""}`.toLowerCase();
              isOutdoor = /trail|outdoor|park|beach|garden|forest|nature/.test(locBlob);
              console.log(`[chat/get] location lookup type=${loc.type} indoorOutdoor=${loc.indoorOutdoor} isOutdoor=${isOutdoor}`);
            }
          } catch { /* non-critical */ }
        }

        console.log(`[chat/get] isOutdoor=${isOutdoor} for groupId=${groupId}`);

        if (isOutdoor) {
          console.log(`[chat/get] seeding Leave No Trace message for groupId=${groupId}`);
          await Message.create({
            groupId,
            senderId: "assistant",
            senderName: "Gemini",
            text: LEAVE_NO_TRACE_MSG,
            isAI: true,
          });
          messages = await Message.find({ groupId }).sort({ createdAt: 1 }).lean();
          console.log(`[chat/get] messages after seeding count=${messages.length}`);
        }
      } catch (seedErr) {
        console.error("[chat/get] Leave No Trace seed error:", seedErr);
      }
    }

    const senderIds = Array.from(
      new Set(messages.map((msg: any) => msg.senderId).filter(Boolean))
    ).filter((id) => /^[a-f\d]{24}$/i.test(id as string));
    const senderDocs = senderIds.length
      ? await User.find({ _id: { $in: senderIds } }).select("name photoUrl").lean()
      : [];
    const senderMap = new Map(
      senderDocs.map((doc: any) => [String(doc._id), { name: doc.name, photoUrl: doc.photoUrl }])
    );

    const payload = messages.map((msg: any) => {
      const senderInfo = msg.senderId ? senderMap.get(String(msg.senderId)) : undefined;
      const senderName =
        msg.senderName ??
        (msg.isAI ? "Gemini" : senderInfo?.name ?? "Member");
      return {
        ...msg,
        senderName,
        senderPhoto: msg.senderPhoto ?? senderInfo?.photoUrl,
      };
    });

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
