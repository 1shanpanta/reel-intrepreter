# Privacy Policy — Reel Interpreter

**Last updated:** February 25, 2026

## Overview

Reel Interpreter is a browser extension that helps users understand French Instagram Reels and TikToks by providing translations, slang breakdowns, and cultural context.

## Data Collection

Reel Interpreter does **not** collect, store, or transmit any personal data to us. We have no servers, no analytics, and no tracking.

## What the Extension Accesses

- **Visible tab screenshot:** A screenshot of the current tab is captured when you click "Interpret This Reel." This image is sent directly from your browser to the AI provider you selected (Groq or Google Gemini) and is not stored or seen by us.
- **Tab audio (optional):** If you enable audio capture, a short audio clip (2–30 seconds) is recorded from the current tab and sent directly to your selected AI provider. It is not stored or seen by us.
- **API key:** Your API key for the selected AI provider is stored locally in your browser using Chrome's storage API. It never leaves your device except when making requests to the AI provider you configured.

## Third-Party Services

When you use the extension, your screenshot and optional audio are sent directly to the AI provider you chose:

- **Groq** — https://groq.com/privacy-policy
- **Google Gemini** — https://ai.google.dev/terms

Your use of these services is governed by their respective privacy policies. We have no access to your requests or their responses.

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | To capture a screenshot of the current tab |
| `tabCapture` | To optionally record audio from the current tab |
| `storage` | To save your API key and preferences locally |
| `offscreen` | To run the audio recording process in the background |
| `scripting` | To detect the current page URL for site validation |
| Host permissions (Instagram, TikTok) | To allow the extension to operate on these sites |

## Data Retention

We retain nothing. All processing happens locally in your browser or directly between your browser and your chosen AI provider.

## Contact

If you have questions about this privacy policy, open an issue at: https://github.com/ishanaudichya/reel-intrepreter/issues

## Changes

We may update this policy as the extension evolves. Changes will be reflected in this document with an updated date.
