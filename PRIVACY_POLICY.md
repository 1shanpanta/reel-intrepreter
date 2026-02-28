# Privacy Policy — Reel Interpreter

**Last updated:** February 25, 2026

## Overview

Reel Interpreter is a browser extension that helps users understand Instagram Reels and TikToks in any language by providing translations, slang breakdowns, and cultural context.

## Data Collection

Reel Interpreter does **not** collect, store, or transmit any personal data to us. We have no servers, no analytics, and no tracking.

## What the Extension Accesses

- **Visible tab screenshot:** A screenshot of the current tab is captured when you click "Interpret This Reel." This image is sent directly from your browser to Groq's API for analysis and is not stored or seen by us.
- **API key:** Your Groq API key is stored locally in your browser using Chrome's storage API. It never leaves your device except when making requests to Groq.

## Third-Party Services

When you use the extension, your screenshot is sent directly to Groq for AI analysis:

- **Groq** — https://groq.com/privacy-policy

Your use of Groq is governed by their privacy policy. We have no access to your requests or their responses.

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | To capture a screenshot of the current tab |
| `tabCapture` | Reserved for upcoming audio capture feature |
| `storage` | To save your API key and preferences locally |
| `offscreen` | Reserved for upcoming audio capture feature |
| Host permissions (Instagram, TikTok) | To allow the extension to operate on these sites |

## Data Retention

We retain nothing. All processing happens locally in your browser or directly between your browser and your chosen AI provider.

## Contact

If you have questions about this privacy policy, open an issue at: https://github.com/ishanaudichya/reel-intrepreter/issues

## Changes

We may update this policy as the extension evolves. Changes will be reflected in this document with an updated date.
