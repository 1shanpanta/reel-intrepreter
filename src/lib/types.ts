export interface KeyVocabulary {
  word: string;
  meaning: string;
  notes: string;
}

export interface InterpretationResult {
  detected_language: string;
  literal_translation: string;
  natural_translation: string;
  combined_meaning: string;
  tone: string;
  meme_format: string;
  context_explanation: string;
  slang_explanation: string | null;
  why_it_is_funny_or_relatable: string;
  confidence: string;
  key_vocabulary: KeyVocabulary[];
}
