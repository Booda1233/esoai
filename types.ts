
// Corresponds to Gemini API's Part structure
export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded string data
  };
}

// Represents a single message in the chat application
export interface AppMessage {
  id: string;
  role: 'user' | 'model'; // Aligns with Gemini's role ('user' or 'model')
  parts: MessagePart[];   // Aligns with Gemini's parts structure
  timestamp: number;
  uiImageUrl?: string; // For user-uploaded images to display in UI directly (base64 data URL)
  fileName?: string; // For displaying file name in UI
}

// Represents a chat session/conversation
export interface ChatSession {
  id: string;
  title: string;
  messages: AppMessage[]; // All messages in this session
  createdAt: number;
  lastUpdatedAt: number;
}
