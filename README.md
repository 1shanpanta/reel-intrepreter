# Reel Interpreter

Chrome extension that helps you understand Instagram Reels and TikToks in any language — slang, humor, and all.

Watch a reel, click the extension, get a full breakdown: translations, slang, cultural context, and vocabulary. Language is detected automatically.

## Install

**From the Chrome Web Store:**

[Install Reel Interpreter](https://chromewebstore.google.com/detail/reel-interpreter) (pending review)

**Or load manually:**

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder

## Setup

1. Click the extension icon, open settings (gear icon)
2. Get a free Groq API key at [console.groq.com](https://console.groq.com) (14,400 requests/day)
3. Paste your API key and save

## Usage

1. Go to Instagram or TikTok in your browser
2. Play a reel you want to understand
3. Click the Reel Interpreter extension icon
4. Hit **Interpret This Reel**

## How It Works

- Takes a screenshot of the visible tab (reads on-screen text, subtitles, captions)
- Sends to Groq's AI for analysis (uses Llama 4 Scout)
- Returns structured interpretation with translations, slang breakdowns, and vocabulary

## Privacy

Your API key is stored locally and never leaves your device except when making requests to Groq. No data is collected or sent to us. See [Privacy Policy](PRIVACY_POLICY.md).
