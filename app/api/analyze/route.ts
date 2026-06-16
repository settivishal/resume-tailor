import { NextResponse } from "next/server";
import type { AnalyzeResponse } from "@/lib/types";

const SYSTEM_PROMPT = `You are a resume tailoring assistant. Given a job description and a LaTeX resume, analyze fit and suggest minimal targeted edits.

Return ONLY valid JSON with this shape:
{
  "matchScore": 72,
  "missingKeywords": ["keyword1", "keyword2"],
  "patches": [
    {
      "id": "1",
      "reason": "Brief reason for this change",
      "impact": "high",
      "search": "exact substring from the resume to replace",
      "replace": "replacement text"
    }
  ]
}

Rules:
- matchScore is 0-100 reflecting resume fit for the job.
- missingKeywords lists important job keywords absent or underrepresented in the resume (max 8).
- Return 3-8 patches maximum.
- impact must be "high", "medium", or "low".
- "search" must match the resume EXACTLY (character-for-character).
- Keep LaTeX valid; preserve structure and formatting.
- Tailor wording to the job description without inventing experience.
- Do not wrap JSON in markdown fences.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { jobDescription, latexResume } = await request.json();

  if (!jobDescription?.trim() || !latexResume?.trim()) {
    return NextResponse.json(
      { error: "Job description and LaTeX resume are required" },
      { status: 400 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Job Description:\n${jobDescription}\n\nLaTeX Resume:\n${latexResume}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json(
      { error: `OpenAI request failed: ${err}` },
      { status: 502 },
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "No response from AI" },
      { status: 502 },
    );
  }

  try {
    const parsed = JSON.parse(content) as AnalyzeResponse;
    if (!Array.isArray(parsed.patches)) {
      throw new Error("Invalid patches array");
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response as JSON" },
      { status: 502 },
    );
  }
}
