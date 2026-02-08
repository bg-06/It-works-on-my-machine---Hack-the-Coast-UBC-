export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
