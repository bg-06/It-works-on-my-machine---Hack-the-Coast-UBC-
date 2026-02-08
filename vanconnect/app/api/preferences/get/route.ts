export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Preference from "@/models/Preference";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const pref = await Preference.findOne({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(pref);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
