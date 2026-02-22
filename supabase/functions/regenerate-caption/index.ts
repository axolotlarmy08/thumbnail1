import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { video_id, platform_type } = await req.json();
    if (!video_id) return errorResponse("video_id is required");

    const { data: transcript } = await supabaseAdmin
      .from("transcripts")
      .select("full_text")
      .eq("video_id", video_id)
      .maybeSingle();

    if (!transcript?.full_text) {
      return errorResponse("No transcript found for this video", 404);
    }

    const { data: video } = await supabaseAdmin
      .from("videos")
      .select("*, client_workspaces(agency_id)")
      .eq("id", video_id)
      .maybeSingle();

    if (!video) return errorResponse("Video not found", 404);

    const agencyId = (video as Record<string, unknown>).client_workspaces
      ? ((video as Record<string, unknown>).client_workspaces as Record<string, string>).agency_id
      : null;

    let apiKey = Deno.env.get("OPENAI_API_KEY") || "";
    if (agencyId) {
      const { data: agency } = await supabaseAdmin
        .from("agencies")
        .select("openai_api_key")
        .eq("id", agencyId)
        .maybeSingle();
      if (agency?.openai_api_key) apiKey = agency.openai_api_key;
    }

    if (!apiKey) return errorResponse("No OpenAI API key available", 500);

    const platformGuide: Record<string, string> = {
      tiktok:
        "TikTok: max 150 chars, trending hashtags, casual/energetic tone, strong hook",
      instagram:
        "Instagram Reels: max 2200 chars, mix of niche and broad hashtags, polished but relatable",
      youtube_shorts:
        "YouTube Shorts: max 100 chars title-style, minimal hashtags (3-5), curiosity-driven",
      youtube_long:
        "YouTube Long Form: compelling title + description, SEO hashtags, authoritative tone",
    };

    const prompt = `You are an expert social media copywriter. Generate a new caption for this video based on the transcript below.

TRANSCRIPT:
"""
${transcript.full_text}
"""

PLATFORM: ${platformGuide[platform_type] || platform_type}

Write a DIFFERENT caption than what might have been generated before. Be creative and fresh.

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "caption_text": "<platform-optimized caption with CTA>",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "tone": "<one word describing the tone>"
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`GPT API error: ${err}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content.trim();
    const cleaned = content
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const captionData = JSON.parse(cleaned);

    const { data: newCaption, error: insertError } = await supabaseAdmin
      .from("captions")
      .insert({
        video_id,
        caption_text: captionData.caption_text,
        hashtags: captionData.hashtags,
        platform_optimized_for: platform_type || "tiktok",
        tone: captionData.tone,
      })
      .select()
      .maybeSingle();

    if (insertError) throw new Error(insertError.message);

    return jsonResponse({ success: true, caption: newCaption });
  } catch (err) {
    console.error("regenerate-caption error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Caption generation failed",
      500,
    );
  }
});
