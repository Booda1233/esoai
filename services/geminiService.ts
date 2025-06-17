
import { GoogleGenAI, Chat, GenerateContentResponse, Part, Content } from "@google/genai";
import { AppMessage, MessagePart } from '../types';
import { GEMINI_CHAT_MODEL, GEMINI_SYSTEM_INSTRUCTION } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

if (!process.env.API_KEY) {
  console.error("Gemini API Key is missing from environment variables (process.env.API_KEY). The application will not be able to connect to the AI service.");
}

const activeChats: Map<string, Chat> = new Map();

// Removed getLocalizedSystemInstruction function. The main GEMINI_SYSTEM_INSTRUCTION is now used.

const getChatSession = (sessionId: string, historyFromUI: AppMessage[]): Chat => {
  if (activeChats.has(sessionId)) {
    return activeChats.get(sessionId)!;
  }

  const geminiHistory: Content[] = historyFromUI
    .slice(0, -1) 
    .filter(msg => msg.parts && msg.parts.length > 0) 
    .map(msg => {
      const geminiParts: Part[] = msg.parts.map(part => {
        if (part.text !== undefined) return { text: part.text };
        if (part.inlineData) return { inlineData: { mimeType: part.inlineData.mimeType, data: part.inlineData.data }};
        return null; 
      }).filter(p => p !== null) as Part[]; 

      return {
        role: msg.role, 
        parts: geminiParts,
      };
    }).filter(content => content.parts.length > 0); 

  const chat = ai.chats.create({
    model: GEMINI_CHAT_MODEL,
    history: geminiHistory,
    config: {
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION, // Use the global, dynamic instruction
    }
  });
  activeChats.set(sessionId, chat);
  return chat;
};

export const sendMessageToAI = async (
  sessionId: string,
  uiHistoryForSessionInit: AppMessage[],
  userPromptParts: MessagePart[]
  // language parameter removed
): Promise<AppMessage> => {
  if (!process.env.API_KEY) {
    // Error message defaults to English as UI is English
    const errorText = "API Key is not configured. Please ensure the API_KEY environment variable is set.";
    return {
      id: Date.now().toString() + '_err_apikey',
      role: 'model',
      parts: [{ text: errorText }],
      timestamp: Date.now(),
    };
  }
  // No language parameter needed for getChatSession
  const chat = getChatSession(sessionId, uiHistoryForSessionInit);

  const geminiRequestParts: Part[] = userPromptParts.map(part => {
    if (part.text !== undefined) {
      return { text: part.text };
    }
    if (part.inlineData) {
      return { inlineData: { mimeType: part.inlineData.mimeType, data: part.inlineData.data } };
    }
    throw new Error("Invalid message part structure: must have text or inlineData.");
  }).filter(p => p !== null) as Part[];


  if (geminiRequestParts.length === 0) {
    // Error message defaults to English
    const errorText = "Cannot send an empty message.";
    return {
      id: Date.now().toString() + '_err_empty',
      role: 'model',
      parts: [{ text: errorText }],
      timestamp: Date.now(),
    };
  }

  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message: geminiRequestParts }); 
    
    const aiResponse: AppMessage = {
      id: Date.now().toString() + '_ai',
      role: 'model',
      parts: [{ text: result.text }], 
      timestamp: Date.now(),
    };
    return aiResponse;
  } catch (error: any) {
    console.error("Error sending message to Gemini AI:", error.message);
    console.error("Full error object from Gemini AI:", error);
    
    // Error messages default to English
    let baseErrorMessages = {
        default: "Sorry, I encountered an error communicating with the AI. Please try again later.",
        invalidKey: "The API Key is invalid. Please check your configuration.",
        quotaExceeded: "You have exceeded your API quota. Please check your Google AI Studio account.",
        safetyBlocked: "My response was blocked due to safety settings. Please rephrase your request.",
        badRequest: "The request was malformed. There might be an issue with the content sent (e.g., empty text part for multimodal request)."
    };

    let errorMessage = baseErrorMessages.default;

    if (error.message) {
        if (error.message.includes("API key not valid")) {
            errorMessage = baseErrorMessages.invalidKey;
        } else if (error.message.toLowerCase().includes("quota")) {
            errorMessage = baseErrorMessages.quotaExceeded;
        } else if (error.message.toLowerCase().includes("candidate was blocked due to safety")) {
            errorMessage = baseErrorMessages.safetyBlocked;
        } else if (error.message.includes("[400 Bad Request]")) {
            errorMessage = baseErrorMessages.badRequest;
        }
    }
    
    if (error.cause && typeof error.cause === 'object' && 'message' in error.cause) {
      const causeMessage = (error.cause as {message: string}).message;
      if (causeMessage) errorMessage += ` (Details: ${causeMessage})`;
    } else if (error.details) {
       errorMessage += ` (Details: ${JSON.stringify(error.details)})`;
    }

    const errorResponse: AppMessage = {
        id: Date.now().toString() + '_err_api',
        role: 'model',
        parts: [{ text: errorMessage }],
        timestamp: Date.now(),
    };
    return errorResponse;
  }
};

export const clearChatSessionFromMemory = (sessionId: string) => {
    activeChats.delete(sessionId);
};