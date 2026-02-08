export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const msg = await Message.create({
      groupId: body.groupId,
      senderId: body.senderId,
      text: body.text,
    });

    return NextResponse.json(msg);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
