import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessRequest {
  video_id: string;
  platform_type: string;
}

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

function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function updateVideoStatus(
  supabase: ReturnType<typeof createClient>,
  videoId: string,
  status: string,
) {
  await supabase.from("videos").update({ status }).eq("id", videoId);
}

async function getOpenAIKey(
  supabase: ReturnType<typeof createClient>,
  agencyId: string,
): Promise<string> {
  const { data } = await supabase
    .from("agencies")
    .select("openai_api_key")
    .eq("id", agencyId)
    .maybeSingle();

  if (data?.openai_api_key) return data.openai_api_key;

  const fallback = Deno.env.get("OPENAI_API_KEY");
  if (!fallback) throw new Error("No OpenAI API key available. Set your key in Settings > Agency.");
  return fallback;
}

async function transcribeAudio(
  videoUrl: string,
  apiKey: string,
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) throw new Error("Failed to download video file");
  const buffer = await videoResponse.arrayBuffer();
  const file = new File([buffer], "audio.mp4", { type: "video/mp4" });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error: ${err}`);
  }

  const result = await response.json();
  const segments = (result.segments || []).map(
    (s: { start: number; end: number; text: string }) => ({
      start: Math.round(s.start * 10) / 10,
      end: Math.round(s.end * 10) / 10,
      text: s.text.trim(),
    }),
  );

  return { text: result.text, segments };
}

async function analyzeWithGPT(
  transcript: string,
  platformType: string,
  apiKey: string,
): Promise<{
  scores: {
    overall_score: number;
    opening_speed_score: number;
    emotional_spike_score: number;
    visual_impact_score: number;
    curiosity_trigger_score: number;
    caption_tension_score: number;
  };
  recommendations: Array<{
    severity: string;
    message: string;
    category: string;
  }>;
  caption: { caption_text: string; hashtags: string[]; tone: string };
  predictions: {
    optimized_hook_score: number;
    predicted_ctr_lift: number;
    predicted_watch_time_lift: number;
  };
}> {
  const platformGuide: Record<string, string> = {
    tiktok:
      "TikTok: max 150 chars caption, trending hashtags, casual/energetic tone, hook in first 1-2 seconds",
    instagram:
      "Instagram Reels: max 2200 chars caption, mix of niche and broad hashtags, polished but relatable tone",
    youtube_shorts:
      "YouTube Shorts: max 100 chars title-style caption, minimal hashtags (3-5), curiosity-driven tone",
    youtube_long:
      "YouTube Long Form: compelling title + description, SEO-focused hashtags, authoritative tone, hook in first 5 seconds",
  };

  const prompt = `You are an expert short-form video analyst and social media strategist. Analyze this video transcript and provide a comprehensive assessment.

TRANSCRIPT:
"""
${transcript}
"""

PLATFORM: ${platformGuide[platformType] || platformType}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact structure:
{
  "scores": {
    "overall_score": <number 0-10, one decimal>,
    "opening_speed_score": <number 0-10: how quickly the hook grabs attention>,
    "emotional_spike_score": <number 0-10: emotional intensity and variation>,
    "visual_impact_score": <number 0-10: how well the spoken content suggests visual engagement>,
    "curiosity_trigger_score": <number 0-10: open loops, questions, unexpected claims>,
    "caption_tension_score": <number 0-10: tension, conflict, or stakes in the narrative>
  },
  "recommendations": [
    {
      "severity": "critical" | "moderate" | "minor",
      "message": "<specific actionable advice referencing actual content from the transcript>",
      "category": "Hook" | "Pacing" | "Emotion" | "Visual" | "Caption" | "Structure"
    }
  ],
  "caption": {
    "caption_text": "<platform-optimized caption with CTA>",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "tone": "<one word describing the tone>"
  },
  "predictions": {
    "optimized_hook_score": <number 0-10: estimated score if recommendations are followed>,
    "predicted_ctr_lift": <number 0-100: percentage CTR improvement>,
    "predicted_watch_time_lift": <number 0-100: percentage watch time improvement>
  }
}

Provide 3-6 recommendations. Be specific about what moments in the transcript work or don't work. The caption should be ready to post on the specified platform.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
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

  return JSON.parse(cleaned);
}

async function processVideoPipeline(
  videoId: string,
  platformType: string,
  fileUrl: string,
  agencyId: string,
) {
  const supabaseAdmin = createAdminClient();

  try {
    const apiKey = await getOpenAIKey(supabaseAdmin, agencyId);

    await updateVideoStatus(supabaseAdmin, videoId, "analyzing_transcript");

    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("videos")
      .createSignedUrl(fileUrl, 3600);

    if (!signedUrlData?.signedUrl) {
      throw new Error("Failed to generate signed URL for video");
    }

    const transcript = await transcribeAudio(signedUrlData.signedUrl, apiKey);

    await supabaseAdmin.from("transcripts").insert({
      video_id: videoId,
      full_text: transcript.text,
      segments: transcript.segments,
    });

    await updateVideoStatus(supabaseAdmin, videoId, "detecting_emotions");

    const analysis = await analyzeWithGPT(
      transcript.text,
      platformType || "tiktok",
      apiKey,
    );

    await updateVideoStatus(supabaseAdmin, videoId, "generating_score");

    await supabaseAdmin.from("hook_scores").insert({
      video_id: videoId,
      overall_score: analysis.scores.overall_score,
      opening_speed_score: analysis.scores.opening_speed_score,
      emotional_spike_score: analysis.scores.emotional_spike_score,
      visual_impact_score: analysis.scores.visual_impact_score,
      curiosity_trigger_score: analysis.scores.curiosity_trigger_score,
      caption_tension_score: analysis.scores.caption_tension_score,
      recommendations: analysis.recommendations,
    });

    await updateVideoStatus(supabaseAdmin, videoId, "optimizing_thumbnail");

    await supabaseAdmin.from("optimization_predictions").insert({
      video_id: videoId,
      original_hook_score: analysis.scores.overall_score,
      optimized_hook_score: analysis.predictions.optimized_hook_score,
      predicted_ctr_lift: analysis.predictions.predicted_ctr_lift,
      predicted_watch_time_lift: analysis.predictions.predicted_watch_time_lift,
    });

    await updateVideoStatus(supabaseAdmin, videoId, "generating_caption");

    await supabaseAdmin.from("captions").insert({
      video_id: videoId,
      caption_text: analysis.caption.caption_text,
      hashtags: analysis.caption.hashtags,
      platform_optimized_for: platformType || "tiktok",
      tone: analysis.caption.tone,
    });

    await updateVideoStatus(supabaseAdmin, videoId, "complete");
    console.log(`Video ${videoId} processing complete`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error(`Video ${videoId} processing failed:`, message);
    await supabaseAdmin
      .from("videos")
      .update({ status: "failed", error_message: message })
      .eq("id", videoId)
      .then(() => {}, () => {});
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing authorization", 401);

    const supabaseAdmin = createAdminClient();

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { video_id, platform_type }: ProcessRequest = await req.json();
    if (!video_id) return errorResponse("video_id is required");

    const { data: video } = await supabaseAdmin
      .from("videos")
      .select("*, client_workspaces(agency_id)")
      .eq("id", video_id)
      .maybeSingle();

    if (!video) return errorResponse("Video not found", 404);

    if (!video.file_url) return errorResponse("Video file not uploaded yet", 400);

    const agencyId = (video as Record<string, unknown>).client_workspaces
      ? ((video as Record<string, unknown>).client_workspaces as Record<string, string>).agency_id
      : null;

    if (!agencyId) {
      const { data: workspace } = await supabaseAdmin
        .from("client_workspaces")
        .select("agency_id")
        .eq("id", video.workspace_id)
        .maybeSingle();

      if (!workspace?.agency_id) {
        return errorResponse("Could not determine agency for this video", 400);
      }

      EdgeRuntime.waitUntil(
        processVideoPipeline(video_id, platform_type, video.file_url, workspace.agency_id),
      );

      return jsonResponse({ success: true, video_id, status: "processing" });
    }

    EdgeRuntime.waitUntil(
      processVideoPipeline(video_id, platform_type, video.file_url, agencyId),
    );

    return jsonResponse({ success: true, video_id, status: "processing" });
  } catch (err) {
    console.error("process-video error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Processing failed",
      500,
    );
  }
});
