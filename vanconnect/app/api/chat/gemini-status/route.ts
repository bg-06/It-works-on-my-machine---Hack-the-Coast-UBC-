export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY ?? "";

  return NextResponse.json({
    ok: Boolean(apiKey),
    configured: Boolean(apiKey),
    message: apiKey ? "AI assistant is configured." : "Missing GEMINI_API_KEY in .env.local.",
  });
}
