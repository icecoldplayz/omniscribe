const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const DEFAULT_MODEL = "llama-3.3-70b-versatile"; // Groq's strongest general-purpose free-tier model
const WHISPER_MODEL = "whisper-large-v3";


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

// Requests verbose_json instead of the default plain-text response, which
// gives us real segment-level start/end timestamps straight from Whisper.
async function transcribeAudio(audioUrl: string) {
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Failed to fetch audio from ${audioUrl}: ${audioRes.status}`);
  }
  const audioBlob = await audioRes.blob();

  const form = new FormData();
  form.append("file", audioBlob, "audio.mp3");
  form.append("model", WHISPER_MODEL);
  form.append("response_format", "verbose_json");

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
  return {
    text: data.text as string,
    segments: (data.segments || []).map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text,
    })),
  };
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
      case "transcribe_audio": {
        const { text, segments } = await transcribeAudio(payload.audio_url);
        result = { transcript: text, segments };
        break;
      }
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
