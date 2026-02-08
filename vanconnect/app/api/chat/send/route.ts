export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/mongodb";
import Message from "@/models/Message";
import Group from "@/models/Group";

/**
 * Build a context-aware system prompt that tells the AI about the
 * specific location / activity the group is planning to visit.
 */
function buildSystemPrompt(locationName?: string, activity?: string): string {
  const lines = [
    "You are the VanConnect AI assistant — a friendly, upbeat helper for a group of people planning a sustainable outing in Vancouver, BC.",
    "",
  ];

  if (locationName) {
    lines.push(
      `This conversation is about "${locationName}" in Vancouver, BC.`,
    );
  }
  if (activity) {
    lines.push(`The group's activity / goal is: ${activity}.`);
  }

  lines.push(
    "The group is aiming to visit this spot in a sustainable, eco-friendly manner (transit, biking, walking, carpooling, etc.).",
    "",
    "Below is the full group chat history so far. Use it for context when answering — don't ask the user to repeat things that were already said.",
    "",
    "Guidelines:",
    "• Keep responses concise, friendly, and fun — use a warm, conversational tone.",
    "• NEVER use Markdown formatting. No asterisks, no hashtags, no bullet-point symbols, no backticks, no bold/italic. Write plain text only.",
    "• Focus on Vancouver, sustainable travel tips, and group logistics.",
    "• If you mention places, suggest 2-4 options max.",
    "• Be action-oriented: give clear next steps when possible.",
  );

  return lines.join("\n");
}

/**
 * Send the full chat history + new user message to the AI so it has
 * complete conversational context.
 */
const generateAIResponse = async (
  prompt: string,
  groupId: string,
) => {
  const openai = new OpenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Fetch group metadata for the system prompt
  let locationName: string | undefined;
  let activity: string | undefined;
  try {
    const group = await Group.findById(groupId).lean() as any;
    if (group) {
      locationName = group.locationName || undefined;
      activity = group.activity || undefined;
    }
  } catch { /* non-critical */ }

  // Fetch full chat history for this group (oldest → newest)
  const history = await Message.find({ groupId })
    .sort({ createdAt: 1 })
    .lean() as any[];

  // Map stored messages to the OpenAI messages format
  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildSystemPrompt(locationName, activity) },
  ];

  for (const msg of history) {
    const role = msg.isAI ? "assistant" as const : "user" as const;
    const name = msg.senderName ?? (msg.isAI ? "Gemini" : "User");
    chatMessages.push({
      role,
      content: msg.isAI ? msg.text : `[${name}]: ${msg.text}`,
    });
  }

  // Append the brand-new user prompt (it was already saved to DB, but
  // the query above may not include it yet depending on timing)
  const lastInHistory = history[history.length - 1];
  const alreadyIncluded =
    lastInHistory && lastInHistory.text === prompt && !lastInHistory.isAI;
  if (!alreadyIncluded) {
    chatMessages.push({ role: "user", content: prompt });
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: chatMessages,
    temperature: 0.6,
    max_tokens: 300,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    return "I'm here to help. Could you share a little more detail?";
  }
  return stripMarkdown(text);
};

/** Remove common Markdown formatting so the chat stays plain-text. */
function stripMarkdown(str: string): string {
  return str
    // Remove bold/italic markers  **bold**  *italic*  __bold__  _italic_
    .replace(/(\*{1,3}|_{1,3})(.+?)\1/g, "$2")
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, "$1")
    // Remove heading hashes  ### Heading
    .replace(/^#{1,6}\s+/gm, "")
    // Remove link syntax [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bullet-point symbols at line start (-, *, •)
    .replace(/^[\s]*[-*•]\s+/gm, "")
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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
        aiText = await generateAIResponse(text, groupId);
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
