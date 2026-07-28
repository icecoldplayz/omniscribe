import { supabase } from '@/lib/supabaseClient';

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "A concise summary of the entire lecture" },
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "The concept name" },
          definition: { type: "string", description: "Clear definition as explained in the lecture" },
          parent_concept: { type: "string", description: "Name of the broader concept this falls under, or empty string if top-level" },
          importance: { type: "string", enum: ["high", "medium", "low"] },
          timestamp_start: { type: "string", description: "Approximate timestamp MM:SS when first discussed" },
          timestamp_end: { type: "string", description: "Approximate timestamp MM:SS when discussion ends" },
          confusion_risk: { type: "boolean", description: "True if students commonly struggle with or confuse this concept" },
          confusion_reason: { type: "string", description: "Why students might find this confusing, or empty string" },
          commonly_confused_with: { type: "string", description: "A concept commonly confused with this one, or empty string" },
          real_world_applications: { type: "array", items: { type: "string" }, description: "Real-world applications mentioned or strongly implied by the lecture material" },
          prerequisites: { type: "array", items: { type: "string" }, description: "Foundational concepts needed to understand this one, as discussed in the lecture" }
        }
      }
    },
    timeline_segments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          timestamp: { type: "string", description: "MM:SS format" },
          topic: { type: "string", description: "Short topic title" },
          summary: { type: "string", description: "1-2 sentence summary of what was covered" },
          type: { type: "string", enum: ["introduction", "concept", "example", "problem", "mistake", "quiz", "conclusion"] }
        }
      }
    },
    quiz_questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, description: "Exactly 4 answer options" },
          correct_answer_index: { type: "number", description: "0-based index of the correct option" },
          explanation: { type: "string", description: "Detailed explanation of why the correct answer is right and why other options are wrong, referencing the lecture material" },
          targeted_concept: { type: "string", description: "The concept name this question tests" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
        }
      }
    },
    confusion_alerts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concepts: { type: "array", items: { type: "string" }, description: "Two or more concepts that are commonly confused" },
          explanation: { type: "string", description: "A comparison explaining the key differences" },
          timestamp: { type: "string", description: "MM:SS when this topic was discussed" }
        }
      }
    }
  }
};

// ---- low-level helpers -----------------------------------------------

async function callLLMProxy(action, payload) {
  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: { action, payload },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function formatTimestamp(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Turns Whisper's real segment timestamps into a [MM:SS]-annotated
// transcript the model can ground itself in, instead of guessing.
function buildTimestampedTranscript(segments) {
  if (!segments || segments.length === 0) return null;
  return segments.map(s => `[${formatTimestamp(s.start)}] ${s.text.trim()}`).join('\n');
}


export async function uploadAndTranscribe(file) {
  const path = `lectures/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('lecture-audio')
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('lecture-audio')
    .getPublicUrl(path);

  const { transcript, segments } = await callLLMProxy('transcribe_audio', { audio_url: publicUrl });

  return { transcript, segments, audio_url: publicUrl };
}

export async function extractLectureData(transcript, title, subject, hasAudio, segments) {
  // Pasted-text transcripts carry no real timing information — there's no
  // audio to derive MM:SS from. Real audio uploads now carry actual Whisper
  // segment timestamps, so we anchor the model to those exact values
  // instead of letting it estimate/guess, which previously produced
  // impossible timestamps (e.g. 30:00 in a 9-minute recording) and
  // suspiciously round 5-minute intervals.
  const timestampedTranscript = hasAudio ? buildTimestampedTranscript(segments) : null;

  const timestampGuidance = timestampedTranscript
    ? `The transcript below is annotated with REAL timestamps in [MM:SS] format, taken directly from the audio. The lecture's total length is approximately ${formatTimestamp(segments[segments.length - 1].end)}. You MUST use these actual timestamps — find the [MM:SS] marker nearest to where a concept is discussed and use that exact value. Do NOT invent timestamps, and NEVER produce a timestamp beyond the lecture's actual length shown above.`
    : hasAudio
      ? `Timestamps should be approximate based on content flow if exact timestamps aren't determinable from the audio.`
      : `IMPORTANT: This transcript was pasted as plain text with NO associated audio or real timing information. Do NOT invent or guess MM:SS timestamps — they would be fabricated. For timestamp_start, timestamp_end, and timeline "timestamp" fields, return an empty string "" instead.`;

  const transcriptForPrompt = timestampedTranscript || transcript;

  const prompt = `You are OmniScribe, an expert educational content analyzer. Analyze the following lecture transcript and extract structured educational data.

Lecture Title: ${title}
Subject: ${subject || "Not specified"}

TRANSCRIPT:
"""
${transcriptForPrompt}
"""

Extract the following with maximum accuracy:
1. CONCEPTS: Every key concept discussed. Include definitions, parent concepts (for building a hierarchy), importance level, approximate timestamps, confusion risk, real-world applications, and prerequisites.
2. TIMELINE SEGMENTS: Chronological breakdown of the lecture into topics with timestamps.
3. QUIZ QUESTIONS: 5-8 questions testing understanding. Each must have 4 options, a detailed explanation referencing the lecture material, the concept it targets, and a difficulty level. Design questions that test deep understanding, not just memorization.
4. CONFUSION ALERTS: Concepts that students commonly confuse with each other, with a comparison explanation.
5. SUMMARY: A concise overview.

CRITICAL RULES:
- Only extract information that is ACTUALLY PRESENT in the transcript. Do NOT invent, assume, or fabricate content.
- If the transcript is too short or lacks content for a section, return an empty array for that section.
- ${timestampGuidance}
- For real_world_applications, only include applications that are mentioned or directly implied by the lecture content.
- Quiz explanations must explain WHY the correct answer is correct AND why other options are wrong.`;

  return callLLMProxy('invoke_llm', {
    prompt,
    schema: EXTRACTION_SCHEMA,
  });
}

export async function processLecture(lectureId, transcript, title, subject, audioUrl, hasAudio, segments) {
  await supabase.from('lectures').update({
    processing_status: "processing",
    transcript,
    audio_url: audioUrl || ""
  }).eq('id', lectureId);

  const data = await extractLectureData(transcript, title, subject, hasAudio, segments);

  await supabase.from('lectures').update({
    processing_status: "ready",
    timeline_segments: data.timeline_segments || [],
    confusion_alerts: data.confusion_alerts || [],
    summary: data.summary || ""
  }).eq('id', lectureId);

  if (data.concepts && data.concepts.length > 0) {
    const concepts = data.concepts.map(c => ({
      ...c,
      lecture_id: lectureId,
      mastery_level: "unknown"
    }));
    await supabase.from('concepts').insert(concepts);
  }

  if (data.quiz_questions && data.quiz_questions.length > 0) {
    const questions = data.quiz_questions.map(q => ({
      ...q,
      lecture_id: lectureId
    }));
    await supabase.from('quiz_questions').insert(questions);
  }

  return data;
}

export async function askTutor(transcript, question, history, learningStyle, userLevel, interests, challengeMode) {
  const styleDescriptions = {
    default: "Explain clearly and concisely at a college level.",
    middle_school: "Explain as if talking to a middle school student. Use simple language and relatable examples.",
    high_school: "Explain as if talking to a high school student. Use clear, accessible language.",
    college: "Explain at a college level with appropriate academic rigor.",
    engineer: "Explain with technical depth, using precise terminology and mathematical/formal reasoning where appropriate.",
    visual: "Use visual descriptions, spatial analogies, and describe diagrams or mental images the student can picture.",
    story: "Explain through a narrative or story that illustrates the concept.",
    sports: "Explain using sports analogies and references.",
    video_game: "Explain using video game analogies and references."
  };

  const styleDesc = styleDescriptions[learningStyle] || styleDescriptions.default;
  const interestsStr = interests && interests.length > 0 ? interests.join(", ") : "not specified";

  const historyStr = history.length > 0
    ? history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join("\n")
    : "No previous conversation.";

  const challengeInstruction = challengeMode
    ? `CHALLENGE MODE: Do NOT give direct answers. Instead, use Socratic questioning. Guide the student to discover the answer themselves. Ask probing questions, present scenarios, and only reveal information when the student demonstrates understanding. If they make an incorrect assumption, ask a question that helps them see the flaw.`
    : `Answer the student's question directly and thoroughly.`;

  const prompt = `You are an AI tutor specialized ONLY in the following lecture material. You must ONLY use information from the lecture transcript to answer. If a question is outside the scope of the lecture, politely say so and suggest what you CAN help with from the lecture.

Student's learning level: ${userLevel || "college"}
Preferred explanation style: ${styleDesc}
Student's interests (use for analogies where helpful): ${interestsStr}

${challengeInstruction}

LECTURE TRANSCRIPT:
"""
${transcript}
"""

PREVIOUS CONVERSATION:
${historyStr}

STUDENT'S NEW QUESTION: ${question}

Provide your response. Also estimate your confidence (0-100%) that the student understands the topic based on their question and the conversation flow. Include a brief reason for your confidence estimate.

CRITICAL: Only use information from the lecture transcript. Do NOT make up information or bring in outside knowledge unless asked for an analogy (which should be clearly labeled as an analogy).`;

  const schema = {
    type: "object",
    properties: {
      answer: { type: "string", description: "Your response to the student" },
      confidence_level: { type: "number", description: "0-100 confidence that the student understands" },
      confidence_reason: { type: "string", description: "Brief reason for the confidence estimate" },
      related_concepts: { type: "array", items: { type: "string" }, description: "Concept names from the lecture that are relevant" }
    }
  };

  return callLLMProxy('invoke_llm', { prompt, schema });
}

export async function generatePracticeQuiz(transcript, studentRequest, count = 10) {
  const prompt = `You are OmniScribe, an AI tutor creating an ORIGINAL practice quiz based on the strategies and concepts taught in the lecture transcript below.

The student asked: "${studentRequest}"

LECTURE TRANSCRIPT:
"""
${transcript}
"""

Create exactly ${count} original practice questions that exercise the strategy or concept the student is asking to practice, as taught in the transcript. These questions should NOT be lifted verbatim from the transcript — generate new, realistic practice examples that apply the same skill, the way a tutor would write fresh practice problems for a student, while staying grounded in what the lecture actually taught (do not introduce strategies or content the lecture never covered).

Each question must have exactly 4 answer options, exactly one correct answer, and a detailed explanation of why the correct answer is right and why each of the other three options is wrong.

Also return a short quiz title summarizing the topic (e.g. "Command of Evidence Practice").`;

  const schema = {
    type: "object",
    properties: {
      title: { type: "string", description: "Short title summarizing the quiz topic" },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: { type: "array", items: { type: "string" }, description: "Exactly 4 answer options" },
            correct_answer_index: { type: "number", description: "0-based index of the correct option" },
            explanation: { type: "string", description: "Explains why the correct answer is right and why each other option is wrong" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
          }
        }
      }
    }
  };

  return callLLMProxy('invoke_llm', { prompt, schema });
}

export async function generateStudyPlan(concepts, examDate, lectureTitle) {
  const now = new Date();
  const exam = new Date(examDate);
  const daysUntil = Math.max(1, Math.ceil((exam - now) / (1000 * 60 * 60 * 24)));

  const conceptList = concepts.map(c =>
    `- ${c.name}: mastery=${c.mastery_level}, importance=${c.importance}${c.confusion_risk ? ", CONFUSION RISK" : ""}`
  ).join("\n");

  const prompt = `You are an adaptive study planner. Create a personalized study plan for a student.

Lecture: ${lectureTitle}
Days until exam: ${daysUntil}

CONCEPT MASTERY:
${conceptList}

Create a study plan that:
1. Prioritizes weak and unknown concepts first
2. Reviews partial concepts
3. Only briefly touches mastered concepts for retention
4. Estimates daily study time (15-45 minutes)
5. Projects a readiness percentage if the plan is followed
6. Focuses extra time on high-importance and confusion-risk concepts

For each session, include a "day" number starting at 1. Do NOT include a date field — dates will be calculated separately.

Return the current readiness, projected readiness, and daily sessions.`;

  const schema = {
    type: "object",
    properties: {
      current_readiness: { type: "number", description: "0-100 current readiness" },
      projected_readiness: { type: "number", description: "0-100 projected readiness if plan is followed" },
      total_study_hours: { type: "number" },
      daily_sessions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "number", description: "Day number (1, 2, 3...)" },
            duration_minutes: { type: "number" },
            focus_concepts: { type: "array", items: { type: "string" } },
            activity: { type: "string", description: "What to study/do" }
          }
        }
      }
    }
  };

  const result = await callLLMProxy('invoke_llm', { prompt, schema });

  // Calculate real calendar dates ourselves instead of trusting the model
  // to invent them — LLMs have no reliable sense of "today," so we anchor
  // each session's date to `now` + (day - 1), spacing sessions daily.
  if (result?.daily_sessions) {
    result.daily_sessions = result.daily_sessions.map(session => {
      const sessionDate = new Date(now);
      sessionDate.setDate(now.getDate() + (session.day - 1));
      return {
        ...session,
        date: sessionDate.toISOString().split('T')[0], // YYYY-MM-DD
      };
    });
  }

  return result;
}
