const SYSTEM_PROMPT = `You are part of a language-learning tool designed to help a non-native speaker fully understand French short-form social media content.

Purpose of this system:
The user is learning French and wants to perfectly understand Instagram Reels and TikTok videos. The goal is not just translation, but deep comprehension — including slang, tone, exaggeration, meme formats, and cultural context.

Assume the content is in French unless clearly another language.

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
Help the learner clearly and accurately understand the reel as a native French social media user would.

Return ONLY valid JSON in this structure:

{
  "detected_language": "",
  "literal_translation": "",
  "natural_translation": "",
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "captureAndInterpret") {
    handleCaptureAndInterpret(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  }

  if (message.action === "audioData") {
    if (pendingAudioResolve) {
      pendingAudioResolve(message.data);
      pendingAudioResolve = null;
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
  if (withAudio && provider === "gemini") {
    try {
      audioBase64 = await captureTabAudio(audioDuration || 5000);
    } catch (err) {
      console.warn("Audio capture failed, proceeding with screenshot only:", err);
    }
  }

  const userPrompt = audioBase64
    ? "Analyze this reel. The screenshot shows the visual content and the audio clip contains what was said. Interpret everything for a French learner."
    : "Analyze this reel screenshot. Read all on-screen text (including subtitles, captions, overlays) and interpret everything for a French learner.";

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

  return JSON.parse(cleaned);
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
async function callGemini(apiKey, model, imageBase64, audioBase64, userPrompt) {
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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  return new Promise((resolve, reject) => {
    pendingAudioResolve = resolve;

    const timeout = setTimeout(() => {
      pendingAudioResolve = null;
      reject(new Error("Audio capture timed out"));
    }, duration + 5000);

    chrome.runtime.sendMessage({
      action: "startRecording",
      streamId,
      duration,
    });

    const originalResolve = pendingAudioResolve;
    pendingAudioResolve = (data) => {
      clearTimeout(timeout);
      originalResolve(data);
    };
  });
}
