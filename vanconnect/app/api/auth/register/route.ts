export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "exists", message: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name || email.split("@")[0],
      email: email.toLowerCase().trim(),
      password,                        // plain text – hackathon mode 🏴‍☠️
    });

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
