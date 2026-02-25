const $ = (id) => document.getElementById(id);

// Elements
const settingsToggle = $("settings-toggle");
const settingsPanel = $("settings-panel");
const providerSelect = $("provider-select");
const apiKeyInput = $("api-key");
const apiKeyLabel = $("api-key-label");
const keyLink = $("key-link");
const geminiModelGroup = $("gemini-model-group");
const modelSelect = $("model-select");
const saveKeyBtn = $("save-key");
const keyStatus = $("key-status");
const interpretBtn = $("interpret-btn");
const captureAudioCheckbox = $("capture-audio");
const mainSection = $("main-section");
const loadingSection = $("loading");
const loadingText = $("loading-text");
const errorSection = $("error");
const errorText = $("error-text");
const resultsSection = $("results");
const againBtn = $("again-btn");
const durationRow = $("duration-row");
const audioDuration = $("audio-duration");
const durationLabel = $("duration-label");
const audioHint = $("audio-hint");
const audioWarning = $("audio-warning");
const audioWarningText = $("audio-warning-text");

// Show/hide duration slider with checkbox
captureAudioCheckbox.addEventListener("change", () => {
  durationRow.classList.toggle("hidden", !captureAudioCheckbox.checked);
});

// Update label as slider moves
audioDuration.addEventListener("input", () => {
  durationLabel.textContent = `${audioDuration.value}s`;
});

// Provider UI switching
function updateProviderUI(provider) {
  if (provider === "gemini") {
    apiKeyLabel.textContent = "Gemini API Key";
    keyLink.href = "https://aistudio.google.com/apikey";
    keyLink.textContent = "aistudio.google.com";
    geminiModelGroup.classList.remove("hidden");
    captureAudioCheckbox.disabled = false;
    audioHint.classList.add("hidden");
  } else {
    apiKeyLabel.textContent = "Groq API Key";
    keyLink.href = "https://console.groq.com/keys";
    keyLink.textContent = "console.groq.com";
    geminiModelGroup.classList.add("hidden");
    captureAudioCheckbox.disabled = true;
    captureAudioCheckbox.checked = false;
    durationRow.classList.add("hidden");
    audioHint.classList.remove("hidden");
  }
}

providerSelect.addEventListener("change", () => {
  updateProviderUI(providerSelect.value);
});

// Load saved settings on popup open
chrome.storage.local.get(
  ["apiKey", "provider", "geminiModel"],
  ({ apiKey, provider, geminiModel }) => {
    const activeProvider = provider || "groq";
    providerSelect.value = activeProvider;
    updateProviderUI(activeProvider);
    if (apiKey) {
      apiKeyInput.value = apiKey;
      keyStatus.textContent = "Key saved";
      keyStatus.className = "status-text";
    }
    if (geminiModel) {
      modelSelect.value = geminiModel;
    }
  }
);

// Toggle settings
settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("hidden");
});

// Save settings
saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = "Please enter a key";
    keyStatus.className = "status-text error";
    return;
  }
  chrome.storage.local.set(
    {
      apiKey: key,
      provider: providerSelect.value,
      geminiModel: modelSelect.value,
    },
    () => {
      keyStatus.textContent = "Settings saved";
      keyStatus.className = "status-text";
    }
  );
});

// Interpret button
interpretBtn.addEventListener("click", async () => {
  // Check if we're on a supported site
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";
  const isSupported =
    url.includes("instagram.com") || url.includes("tiktok.com");

  if (!isSupported) {
    showError("Navigate to an Instagram Reel or TikTok video first.");
    return;
  }

  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) {
    showError("Please set your API key in settings first.");
    settingsPanel.classList.remove("hidden");
    return;
  }

  const withAudio = captureAudioCheckbox.checked;

  // Show loading
  mainSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
  loadingSection.classList.remove("hidden");

  const duration = parseInt(audioDuration.value, 10);

  if (withAudio) {
    loadingText.textContent = `Recording audio (${duration}s)...`;
    setTimeout(() => {
      if (!loadingSection.classList.contains("hidden")) {
        loadingText.textContent = "Analyzing with AI...";
      }
    }, (duration + 1) * 1000);
  } else {
    loadingText.textContent = "Analyzing reel...";
  }

  try {
    const result = await chrome.runtime.sendMessage({
      action: "captureAndInterpret",
      withAudio,
      audioDuration: duration * 1000,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Show audio warning if audio was requested but not used
    if (result.audioWarning) {
      audioWarning.classList.remove("hidden");
      audioWarningText.textContent = result.audioWarning;
    } else {
      audioWarning.classList.add("hidden");
    }

    if (!result.data) {
      throw new Error("No interpretation data received. Try again.");
    }

    showResults(result.data);
  } catch (err) {
    audioWarning.classList.add("hidden");
    showError(err.message || "Something went wrong");
  }
});

// Again button
againBtn.addEventListener("click", () => {
  resultsSection.classList.add("hidden");
  errorSection.classList.add("hidden");
  audioWarning.classList.add("hidden");
  mainSection.classList.remove("hidden");
});

function showError(message) {
  loadingSection.classList.add("hidden");
  errorSection.classList.remove("hidden");
  mainSection.classList.remove("hidden");
  errorText.textContent = message;
}

function showResults(data) {
  loadingSection.classList.add("hidden");
  mainSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");

  // Badges
  const badges = $("badges");
  badges.innerHTML = "";

  addBadge(badges, data.detected_language);
  addBadge(badges, data.tone);
  if (data.meme_format) addBadge(badges, data.meme_format);

  const confClass =
    data.confidence === "high"
      ? "confidence-high"
      : data.confidence === "medium"
        ? "confidence-medium"
        : "confidence-low";
  addBadge(badges, `Confidence: ${data.confidence}`, confClass);

  // Translations
  $("literal-translation").textContent = data.literal_translation;
  $("natural-translation").textContent = data.natural_translation;

  // Word Breakdown
  const breakdownList = $("breakdown-list");
  breakdownList.innerHTML = "";

  if (data.word_breakdown && data.word_breakdown.length > 0) {
    $("breakdown-card").classList.remove("hidden");
    data.word_breakdown.forEach((w) => {
      const item = document.createElement("div");
      item.className = "breakdown-item";
      item.innerHTML = `
        <span class="breakdown-french">${escapeHtml(w.french)}</span>
        <span class="breakdown-meaning"> — ${escapeHtml(w.meaning)}</span>
        ${w.grammar_note ? `<span class="breakdown-note">${escapeHtml(w.grammar_note)}</span>` : ""}
      `;
      breakdownList.appendChild(item);
    });
  } else {
    $("breakdown-card").classList.add("hidden");
  }

  // Meaning
  $("combined-meaning").textContent = data.combined_meaning;

  if (data.context_explanation) {
    $("context-section").classList.remove("hidden");
    $("context-explanation").textContent = data.context_explanation;
  } else {
    $("context-section").classList.add("hidden");
  }

  // Slang
  if (data.slang_explanation) {
    $("slang-card").classList.remove("hidden");
    $("slang-explanation").textContent = data.slang_explanation;
  } else {
    $("slang-card").classList.add("hidden");
  }

  // Funny/relatable
  if (data.why_it_is_funny_or_relatable) {
    $("funny-card").classList.remove("hidden");
    $("funny-explanation").textContent = data.why_it_is_funny_or_relatable;
  } else {
    $("funny-card").classList.add("hidden");
  }

  // Vocabulary
  const vocabList = $("vocab-list");
  vocabList.innerHTML = "";

  if (data.key_vocabulary && data.key_vocabulary.length > 0) {
    $("vocab-card").classList.remove("hidden");
    data.key_vocabulary.forEach((v) => {
      const item = document.createElement("div");
      item.className = "vocab-item";
      item.innerHTML = `
        <span class="vocab-word">${escapeHtml(v.word)}</span>
        <span class="vocab-meaning"> — ${escapeHtml(v.meaning)}</span>
        ${v.notes ? `<p class="vocab-notes">${escapeHtml(v.notes)}</p>` : ""}
      `;
      vocabList.appendChild(item);
    });
  } else {
    $("vocab-card").classList.add("hidden");
  }
}

function addBadge(container, text, extraClass = "") {
  const badge = document.createElement("span");
  badge.className = `badge ${extraClass}`;
  badge.textContent = text;
  container.appendChild(badge);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
