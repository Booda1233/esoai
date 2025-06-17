
import React, { useRef, useEffect, RefObject } from 'react';
import { AppMessage } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import Spinner from './Spinner';
import { UseTextToSpeechReturn } from '../hooks/useTextToSpeech';
import { Bars3Icon } from '../assets/icons'; 
import { useTranslation } from '../hooks/useTranslation';

export interface ChatInputHandle {
  setContent: (text: string, file?: File) => void;
}

interface ChatViewProps {
  messages: AppMessage[];
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
  sessionTitle: string;
  isSidebarOverlayVisible: boolean; // Renamed for clarity and unified behavior
  chatInputRef: RefObject<ChatInputHandle>;
  onResendMessageRequest: (text: string, file?: File) => void;
  ttsGlobal: UseTextToSpeechReturn;
  onToggleSidebar: () => void; 
  isMobile: boolean; // Still useful for other responsive elements within ChatView
}

const ChatView: React.FC<ChatViewProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  sessionTitle, 
  isSidebarOverlayVisible,
  chatInputRef,
  onResendMessageRequest,
  ttsGlobal,
  onToggleSidebar,
  isMobile
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <header className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 border-b border-gray-300 dark:border-gray-700 shadow-sm flex items-center">
        {!isSidebarOverlayVisible && ( // Show menu icon if sidebar overlay is closed
          <button 
            onClick={onToggleSidebar} 
            className="me-2 sm:me-3 p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={t('openMenu')}
          >
            <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white truncate">{sessionTitle}</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 scroll-smooth">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            onResendMessageRequest={onResendMessageRequest}
            ttsGlobal={ttsGlobal}
            isMobile={isMobile}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center py-2">
            <Spinner />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-2 sm:p-4 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <ChatInput 
          ref={chatInputRef}
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          stopSpeaking={ttsGlobal.cancel}
          isSpeaking={ttsGlobal.isSpeaking}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default ChatView;
