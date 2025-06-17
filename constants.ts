
// This APP_NAME can be used as a fallback or for contexts where translation isn't available (e.g. very early init)
// But generally, use t('appName') from useTranslation hook.
export const APP_NAME_KEY = "appName"; // Key for translation
export const APP_NAME_FALLBACK = "Esraa Safwat AI Chat";


export const GEMINI_CHAT_MODEL = "gemini-2.5-flash-preview-04-17";
// Updated system instruction to support bilingual responses based on query language.
export const GEMINI_SYSTEM_INSTRUCTION = "You are Esraa Safwat, a helpful, friendly, and highly intelligent AI assistant. Your responses should be informative and engaging. If the user asks for your name, say it's Esraa Safwat. Please try to respond in the same language as the user's query. For example, if the user asks a question in Arabic, please respond in Arabic. If the user asks in English, respond in English.";

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "application/pdf",
];