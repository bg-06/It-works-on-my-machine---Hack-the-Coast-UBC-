export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const location = await Location.create({
      name: body.name,
      type: body.type,
      sustainabilityScore: body.sustainabilityScore || 5,
      indoorOutdoor: body.indoorOutdoor || "both",
      images: body.images || [],
    });

    return NextResponse.json(location);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
