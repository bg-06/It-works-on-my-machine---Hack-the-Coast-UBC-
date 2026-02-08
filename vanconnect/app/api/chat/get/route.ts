export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 }).lean();

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
