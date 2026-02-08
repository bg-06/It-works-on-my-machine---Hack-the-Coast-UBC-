export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Swipe from "@/models/Swipe";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Return all swiped locationIds for this user (both liked and passed)
    const swipes = await Swipe.find({ userId });
    const swipedLocationIds = swipes.map((s: any) => s.locationId);

    return NextResponse.json({ swipedLocationIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
