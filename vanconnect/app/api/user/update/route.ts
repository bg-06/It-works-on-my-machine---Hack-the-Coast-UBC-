export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const userId = body.userId;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const update: Record<string, any> = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.email === "string") update.email = body.email.trim();
    if (typeof body.photoUrl === "string") update.photoUrl = body.photoUrl.trim();

    if (typeof body.password === "string" && body.password.trim()) {
      update.password = await bcrypt.hash(body.password, 10);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user._id,
      name: user.name,
      email: user.email ?? "",
      photoUrl: user.photoUrl ?? "",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
