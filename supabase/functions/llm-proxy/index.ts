// supabase/functions/llm-proxy/index.ts
//
// Deploy with: supabase functions deploy llm-proxy --no-verify-jwt
// Set your key with: supabase secrets set GROQ_API_KEY=gsk_...
//
// This function replaces base44.integrations.Core.InvokeLLM and
// base44.integrations.Core.TranscribeAudio, using Groq (free tier) instead
// of OpenAI. Groq hosts Whisper for transcription and Llama models for
// text generation, both via an OpenAI-compatible API shape.
// Your key stays server-side — never shipped to the browser.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const DEFAULT_MODEL = "llama-3.3-70b-versatile"; // Groq's strongest general-purpose free-tier model
const WHISPER_MODEL = "whisper-large-v3";

// Groq's OpenAI-compatible endpoint does NOT reliably support strict
// json_schema structured outputs the way OpenAI does. Instead, we use
// response_format: { type: "json_object" } (which Groq does support on
// Llama models) and enforce the shape by embedding the schema directly
// in the prompt, then validate/parse on our end.
async function invokeLLM(prompt: string, schema: Record<string, unknown>, model = DEFAULT_MODEL) {
  const schemaInstructions = `
You must respond with ONLY a valid JSON object — no markdown, no code fences, no commentary before or after.
The JSON object must strictly match this JSON Schema:

${JSON.stringify(schema, null, 2)}

Every property listed under "properties" in the schema is required unless the schema says otherwise. Do not add any properties not defined in the schema.
`.trim();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: schemaInstructions },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No structured content returned by the model.");

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Model returned invalid JSON: ${content.slice(0, 500)}`);
  }
}

async function transcribeAudio(audioUrl: string) {
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to fetch audio from ${audioUrl}: ${audioRes.status}`);
  }
  const audioBlob = await audioRes.blob();

  const form = new FormData();
  form.append("file", audioBlob, "audio.mp3");
  form.append("model", WHISPER_MODEL);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    let result;
    switch (action) {
      case "invoke_llm":
        result = await invokeLLM(payload.prompt, payload.schema, payload.model);
        break;
      case "transcribe_audio":
        result = { transcript: await transcribeAudio(payload.audio_url) };
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
