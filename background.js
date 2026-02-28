const SYSTEM_PROMPT = `You are part of a language-learning tool designed to help users fully understand short-form social media content in any language.

Purpose of this system:
The user wants to perfectly understand Instagram Reels and TikTok videos in a foreign language. The goal is not just translation, but deep comprehension — including slang, tone, exaggeration, meme formats, and cultural context.

Detect the language automatically from the content.

Platform context:
- The content comes from Instagram Reels or TikTok.
- These platforms often use short sentences.
- Humor may rely on exaggeration, sarcasm, "POV" formats, relatable situations, or trending audio.
- The same audio may be reused in different contexts.

You will receive:
- A screenshot of the reel currently playing (contains on-screen text, subtitles, visual context).
- Optionally, a recorded audio clip from the reel.

Important considerations:
- On-screen text may be partially obscured or styled.
- Audio may contain background music mixed with speech.
- Text and audio may overlap or complement each other.
- Slang and informal language are common.
- Humor is often subtle or exaggerated.
- Do NOT invent cultural references that are not clearly implied.

Your task:
Help the learner clearly and accurately understand the reel as a native speaker of that language would.

Return ONLY valid JSON in this structure:

{
  "detected_language": "",
  "literal_translation": "",
  "natural_translation": "",
  "word_breakdown": [
    {
      "original": "",
      "meaning": "",
      "grammar_note": ""
    }
  ],
  "combined_meaning": "",
  "tone": "",
  "meme_format": "",
  "context_explanation": "",
  "slang_explanation": "",
  "why_it_is_funny_or_relatable": "",
  "confidence": "",
  "key_vocabulary": [
    {
      "word": "",
      "meaning": "",
      "notes": ""
    }
  ]
}

Field-specific instructions:
- "detected_language": The language detected in the content.
- "literal_translation": Direct word-for-word translation to English.
- "natural_translation": How a native English speaker would naturally say the same thing.
- "word_breakdown": Break down EVERY single word from the original text, in order. Include articles, prepositions, pronouns — everything. For each word, provide the original word, its English meaning, and an optional grammar note (e.g. "informal conjugation", "slang", "contraction", "definite article", "preposition"). Do not skip any words. This is the most important field — a learner depends on it.
- "key_vocabulary": List EVERY word or phrase a learner should study from this content. Include verbs (with infinitive form), nouns, adjectives, adverbs, expressions, and any grammatically interesting constructions. Aim for at least 5-10 entries. Do not limit to just slang or uncommon words — include common useful vocabulary too.

Output rules:
- Be accurate, not creative.
- Prefer clarity over cleverness.
- If both on-screen text and audio exist, merge them intelligently.
- If they repeat each other, do not duplicate explanation.
- If one clarifies the other, explain how.
- If slang exists, explain it clearly.
- If no slang exists, set "slang_explanation" to null.
- Keep explanations concise but complete.
- If unsure, lower the "confidence" field.
- Output JSON only. No extra commentary.`;

// Listen for messages from popup and offscreen document only
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  if (message.action === "captureAndInterpret") {
    handleCaptureAndInterpret(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  }

  if (message.action === "audioData") {
    if (pendingAudioResolve) {
      const resolve = pendingAudioResolve;
      pendingAudioResolve = null;
      resolve(message.data);
    }
  }
});

let pendingAudioResolve = null;

async function handleCaptureAndInterpret({ withAudio, audioDuration }) {
  const storage = await chrome.storage.local.get([
    "apiKey",
    "provider",
    "geminiModel",
  ]);
  const apiKey = storage.apiKey;
  const provider = storage.provider || "groq";

  if (!apiKey) {
    throw new Error("API key not set. Open settings and add your API key.");
  }

  // 1. Capture screenshot
  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: "jpeg",
    quality: 60,
  });
  const screenshotBase64 = screenshotDataUrl.replace(
    /^data:image\/jpeg;base64,/,
    ""
  );

  // 2. Optionally capture audio (only with Gemini — Groq doesn't support audio)
  let audioBase64 = null;
  let audioWarning = null;

  if (withAudio) {
    if (provider !== "gemini") {
      audioWarning = "Audio capture requires the Gemini provider. Groq only supports screenshot analysis.";
    } else {
      try {
        audioBase64 = await captureTabAudio(audioDuration || 5000);
        if (!audioBase64) {
          audioWarning = "Audio capture returned empty data. The tab may not be playing audio.";
        }
      } catch (err) {
        console.warn("Audio capture failed:", err);
        audioWarning = `Audio capture failed: ${err.message}. Proceeding with screenshot only.`;
      }
    }
  }

  const userPrompt = audioBase64
    ? "Analyze this reel. The screenshot shows the visual content and the audio clip contains what was said. Detect the language and interpret everything for a language learner."
    : "Analyze this reel screenshot. Read all on-screen text (including subtitles, captions, overlays). Detect the language and interpret everything for a language learner.";

  // 3. Call the selected provider
  let responseText;
  if (provider === "groq") {
    responseText = await callGroq(apiKey, screenshotBase64, userPrompt);
  } else {
    responseText = await callGemini(
      apiKey,
      storage.geminiModel || "gemini-2.0-flash-lite",
      screenshotBase64,
      audioBase64,
      userPrompt
    );
  }

  // Strip markdown code fences
  const cleaned = responseText
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI response. Please try again.");
  }
  return { data, audioUsed: !!audioBase64, audioWarning };
}

// --- Groq API (OpenAI-compatible, free tier: 14,400 req/day) ---
async function callGroq(apiKey, imageBase64, userPrompt) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              { type: "text", text: userPrompt },
            ],
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Groq API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// --- Gemini API ---
const ALLOWED_GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGemini(apiKey, model, imageBase64, audioBase64, userPrompt) {
  if (!ALLOWED_GEMINI_MODELS.includes(model)) {
    throw new Error("Invalid Gemini model selected.");
  }

  const parts = [
    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
  ];

  if (audioBase64) {
    parts.push({
      inlineData: { mimeType: "audio/webm", data: audioBase64 },
    });
  }

  parts.push({ text: userPrompt });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts }],
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Gemini API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// --- Tab Audio Capture ---
async function captureTabAudio(duration) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id,
  });

  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Recording tab audio for reel interpretation",
    });
  }

  // Cancel any stale pending audio resolve from a previous attempt
  if (pendingAudioResolve) {
    pendingAudioResolve(null);
    pendingAudioResolve = null;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingAudioResolve = null;
      reject(new Error("Audio capture timed out"));
    }, duration + 5000);

    pendingAudioResolve = (data) => {
      clearTimeout(timeout);
      resolve(data);
    };

    chrome.runtime.sendMessage({
      action: "startRecording",
      streamId,
      duration,
    }).catch((err) => {
      clearTimeout(timeout);
      pendingAudioResolve = null;
      reject(new Error(`Failed to start recording: ${err.message}`));
    });
  });
}
