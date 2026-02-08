export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Swipe from "@/models/Swipe";
import Location from "@/models/Location";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const likedSwipes = await Swipe.find({
      userId,
      liked: true,
    });

    const locationIds = likedSwipes.map(s => s.locationId);

    const locations = await Location.find({
      _id: { $in: locationIds },
    });

    return NextResponse.json(locations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
