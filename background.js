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

Important considerations:
- On-screen text may be partially obscured or styled.
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
- If slang exists, explain it clearly.
- If no slang exists, set "slang_explanation" to null.
- Keep explanations concise but complete.
- If unsure, lower the "confidence" field.
- Output JSON only. No extra commentary.`;

// Listen for messages from popup only
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return;

  if (message.action === "captureAndInterpret") {
    handleCaptureAndInterpret()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // keep channel open for async response
  }
});

async function handleCaptureAndInterpret() {
  const { apiKey } = await chrome.storage.local.get(["apiKey"]);

  if (!apiKey) {
    throw new Error("API key not set. Open settings and add your API key.");
  }

  // Capture screenshot
  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: "jpeg",
    quality: 60,
  });
  const screenshotBase64 = screenshotDataUrl.replace(
    /^data:image\/jpeg;base64,/,
    ""
  );

  const userPrompt =
    "Analyze this reel screenshot. Read all on-screen text (including subtitles, captions, overlays). Detect the language and interpret everything for a language learner.";

  // Call Groq
  const responseText = await callGroq(apiKey, screenshotBase64, userPrompt);

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
  return { data };
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
