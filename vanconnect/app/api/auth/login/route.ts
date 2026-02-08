export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: "no_user", message: "No account found with that email." },
        { status: 404 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { error: "wrong_password", message: "Incorrect password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
