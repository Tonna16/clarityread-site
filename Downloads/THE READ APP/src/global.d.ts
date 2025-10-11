// src/global.d.ts
// Minimal ambient types so your React UI can reference chrome in TS without full @types/chrome
declare const chrome: any;

// Ensure SpeechSynthesis is present on Window (prevents some TS warnings)
interface Window {
  speechSynthesis: SpeechSynthesis;
}

export {}; // keep file a module to avoid polluting the global type scope too strongly
