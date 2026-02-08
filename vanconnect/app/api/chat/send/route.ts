export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";

const SYSTEM_PROMPT = [
  "You are the VanConnect AI assistant called Gemini.",
  "Keep responses concise, friendly, and action-oriented.",
  "Focus on Vancouver, UBC, sustainable travel, and group logistics when relevant.",
  "If you mention places, suggest 2-4 options max.",
].join("\n");

const generateAIResponse = async (prompt: string) => {
  const openai = new OpenAI({ apiKey: process.env.GEMINI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 300,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return "I'm here to help. Could you share a little more detail?";
  }
  return text;
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const groupId = body?.groupId as string | undefined;
    const senderId = body?.senderId as string | undefined;
    const senderName = body?.senderName as string | undefined;
    const senderPhoto = body?.senderPhoto as string | undefined;
    const text = body?.text as string | undefined;
    const askAI = Boolean(body?.askAI);

    if (!groupId || !text) {
      return NextResponse.json({ error: "Missing groupId or text" }, { status: 400 });
    }

    const msg = await Message.create({
      groupId,
      senderId,
      senderName,
      senderPhoto,
      text,
    });

    if (!askAI) {
      return NextResponse.json(msg);
    }

    const apiKey = process.env.GEMINI_API_KEY ?? "";
    let aiText = "Gemini isn't configured yet. Add GEMINI_API_KEY to enable AI replies.";
    if (apiKey) {
      try {
        aiText = await generateAIResponse(text);
      } catch (aiErr: any) {
        console.error("AI error:", aiErr?.message ?? aiErr);
        aiText = "Sorry, I couldn't reach Gemini right now. Please try again in a moment.";
      }
    }

    const aiMsg = await Message.create({
      groupId,
      senderId: "assistant",
      senderName: "Gemini",
      text: aiText,
      isAI: true,
    });

    return NextResponse.json({ user: msg, ai: aiMsg, configured: Boolean(apiKey) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
