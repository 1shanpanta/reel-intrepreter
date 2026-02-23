# Reel Interpreter

Chrome extension that helps you understand French Instagram Reels and TikToks — slang, humor, and all.

Watch a reel, click the extension, get a full breakdown: translations, slang, cultural context, and vocabulary.

## Install

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Click the extension icon in your toolbar

## Setup

1. Get a [Gemini API key](https://aistudio.google.com/apikey)
2. Click the extension icon, open settings (gear icon)
3. Paste your API key and save

## Usage

1. Go to Instagram or TikTok in your browser
2. Play a reel you want to understand
3. Click the Reel Interpreter extension icon
4. Hit **Interpret This Reel**
5. Optionally check "Also capture audio" for spoken content (takes ~10s)

## How It Works

- Takes a screenshot of the visible tab (reads on-screen text, subtitles, captions)
- Optionally records 10s of tab audio (captures spoken French)
- Sends both to Gemini 2.0 Flash for multimodal analysis
- Returns structured interpretation with translations, slang breakdowns, and vocabulary
