import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req) {
  try {
    const { entries } = await req.json();
    if (!entries || !entries.length) {
      return NextResponse.json({ summary: "No entries found." });
    }

    const combinedText = entries.map((e) => e.text).join("\n\n");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `Write a 1-2 paragraph report summarizing the following journal entries in one 4 sentence paragraph:\n\n${combinedText}`,
      max_output_tokens: 200,
    });

    return NextResponse.json({ summary: response.output_text || "" });
  } catch (err) {
    console.error("Error in summary route:", err);
    return NextResponse.json({ error: "Failed to summarize." }, { status: 500 });
  }
}
