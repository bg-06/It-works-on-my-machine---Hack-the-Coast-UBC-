export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const existing = await User.findOne({ name: body.name });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await User.create({
      name: body.name,
      email: body.email ?? "",
      photoUrl: body.photoUrl ?? "",
      password: hashed,
    });

    return NextResponse.json({
      message: "User created",
      userId: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      onboarded: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
