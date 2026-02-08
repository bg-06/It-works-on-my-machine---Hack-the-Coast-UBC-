export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Swipe from "@/models/Swipe";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const swipe = await Swipe.create({
      userId: body.userId,
      locationId: body.locationId,
      liked: body.liked,
    });

    return NextResponse.json(swipe);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
