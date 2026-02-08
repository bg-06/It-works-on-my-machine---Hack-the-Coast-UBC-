export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Location";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const tagsParam = searchParams.get("tags"); // comma-separated, e.g. ?tags=hiking,photography

    const filter: Record<string, any> = {};
    if (tagsParam) {
      const tags = tagsParam.split(",").map((t) => t.trim().toLowerCase());
      filter.tags = { $in: tags };
    }

    const locations = await Location.find(filter);
    return NextResponse.json(locations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
