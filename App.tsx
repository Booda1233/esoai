
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import Sidebar from './components/Sidebar';
import ChatView, { ChatInputHandle } from './components/ChatView';
import { useChatHistory } from './hooks/useChatHistory';
import { AppMessage, ChatSession, MessagePart } from './types';
import { sendMessageToAI, clearChatSessionFromMemory as clearGeminiChatInstance } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { PlusIcon, Bars3Icon } from './assets/icons';
import useTextToSpeech from './hooks/useTextToSpeech';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { useTranslation } from './hooks/useTranslation';
import { useAppSettings } from './hooks/useAppSettings';

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    addMessageToSession,
    createNewSession,
    deleteSession,
    loadSessionMessages,
    updateSessionTitle,
  } = useChatHistory();

  const [currentMessages, setCurrentMessages] = useState<AppMessage[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const { t } = useTranslation();
  const { language } = useAppSettings(); // UI language, still 'en'

  // Unified sidebar state: controls the overlay visibility on all screen sizes
  const [isSidebarOverlayVisible, setIsSidebarOverlayVisible] = useState(false);
  // isMobile is still useful for other responsive adjustments (e.g. icon sizes, padding)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


  const tts = useTextToSpeech(); 
  const chatInputRef = useRef<ChatInputHandle>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (isMobile !== mobile) {
        setIsMobile(mobile);
        // Sidebar visibility is now fully user-controlled, not auto-adjusted on resize.
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);


  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      const messages = loadSessionMessages(activeSessionId);
      setCurrentMessages(messages);
    } else {
      setCurrentMessages([]);
    }
  }, [activeSessionId, loadSessionMessages]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOverlayVisible(prev => !prev);
  }, []);

  const handleCreateNewChat = useCallback(() => {
    tts.cancel(); 
    const newSessionId = createNewSession(t('newChat'));
    setActiveSessionId(newSessionId);
    setCurrentMessages([]);
    setIsSidebarOverlayVisible(true); // Open sidebar to show the new chat
  }, [createNewSession, setActiveSessionId, tts, t]);

  const handleSelectChat = useCallback((sessionId: string) => {
    tts.cancel(); 
    setActiveSessionId(sessionId);
    if (isSidebarOverlayVisible) {
      setIsSidebarOverlayVisible(false); // Close overlay after selection
    }
  }, [setActiveSessionId, tts, isSidebarOverlayVisible]);

  const handleDeleteChat = useCallback((sessionId: string) => {
    tts.cancel(); 
    deleteSession(sessionId);
    clearGeminiChatInstance(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setCurrentMessages([]);
    }
  }, [deleteSession, activeSessionId, setActiveSessionId, tts]);

  const handleResendMessageContent = useCallback((text: string, file?: File ) => {
    tts.cancel();
    chatInputRef.current?.setContent(text, file);
  }, [tts]);

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    let currentActiveSessionId = activeSessionId;

    if (!currentActiveSessionId) {
      currentActiveSessionId = createNewSession(t('newChat')); 
      setActiveSessionId(currentActiveSessionId);
    }
    
    if(!currentActiveSessionId) {
        alert(t('errorCreatingSession'));
        return;
    }

    const userMessageId = Date.now().toString() + '_user';
    const messageParts: MessagePart[] = [];
    let uiImageUrl: string | undefined = undefined;
    let fileNameForMessage: string | undefined = undefined;
    let originalInputText = text; 

    if (file) {
      try {
        const base64File = await fileToBase64(file);
        messageParts.push({
          inlineData: {
            mimeType: file.type,
            data: base64File.split(',')[1], 
          },
        });
        if (file.type.startsWith('image/')) {
          uiImageUrl = base64File;
        }
        fileNameForMessage = file.name; 
        
        if (originalInputText.trim() === '' && !file.type.startsWith('image/')) {
            text = `${t('fileLabel')}: ${file.name}`; 
        } else if (originalInputText.trim() !== '' && !file.type.startsWith('image/')) {
            text = `${originalInputText.trim()} (${t('fileLabel')}: ${file.name})`;
        }

      } catch (error) {
        console.error("Error processing file:", error);
        const errorMsg: AppMessage = {
          id: Date.now().toString(),
          role: 'model', 
          parts: [{ text: t('errorProcessingFile') }],
          timestamp: Date.now(),
        };
        addMessageToSession(currentActiveSessionId, errorMsg);
        setCurrentMessages(prev => [...prev, errorMsg]);
        return;
      }
    }
    
    if (text.trim()) { 
      messageParts.push({ text: text.trim() });
    }

    if (messageParts.length === 0) return; 

    const userMessage: AppMessage = {
      id: userMessageId,
      role: 'user',
      parts: messageParts,
      timestamp: Date.now(),
      uiImageUrl: uiImageUrl,
      fileName: fileNameForMessage,
    };

    addMessageToSession(currentActiveSessionId, userMessage);
    setCurrentMessages(prev => [...prev, userMessage]);
    
    const sessionToUpdate = sessions.find(s => s.id === currentActiveSessionId);
    if (sessionToUpdate && sessionToUpdate.messages.length === 0 && currentActiveSessionId) {
        let newTitleCandidate = '';
        if (originalInputText && originalInputText.trim() !== '') {
            newTitleCandidate = originalInputText.trim();
        } else if (file) { 
            newTitleCandidate = file.name; 
        }

        if (newTitleCandidate) {
            const titleMaxLength = 35;
            const finalTitle = newTitleCandidate.length > titleMaxLength 
                             ? newTitleCandidate.substring(0, titleMaxLength) + "..."
                             : newTitleCandidate;
            updateSessionTitle(currentActiveSessionId, finalTitle);
        }
    }

    setIsLoadingAI(true);
    try {
      const sessionMessages = loadSessionMessages(currentActiveSessionId);
      // Removed 'language' argument from sendMessageToAI call
      const aiResponse = await sendMessageToAI(currentActiveSessionId, sessionMessages, userMessage.parts); 
      addMessageToSession(currentActiveSessionId, aiResponse);
      setCurrentMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMsg: AppMessage = {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: t('errorAIResponse') }],
        timestamp: Date.now(),
      };
      addMessageToSession(currentActiveSessionId, errorMsg);
      setCurrentMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingAI(false);
    }
  }, [activeSessionId, addMessageToSession, loadSessionMessages, setIsLoadingAI, createNewSession, setActiveSessionId, sessions, updateSessionTitle, tts, t]);


  if (showSplash) {
    return <SplashScreen />;
  }

  const activeChatSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-screen antialiased text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onCreateNewChat={handleCreateNewChat}
        isOverlayVisible={isSidebarOverlayVisible} // Unified prop for overlay visibility
        onToggle={toggleSidebar}
        // isMobile is passed for potential internal responsive adjustments in Sidebar, if any remain
        // However, the core open/close mechanism is now unified.
      />
       {isSidebarOverlayVisible && ( // Backdrop for the overlay on all screen sizes
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOverlayVisible ? 'blur-sm pointer-events-none' : ''}`}>
        {activeSessionId && activeChatSession ? (
          <ChatView
            key={activeSessionId} 
            messages={currentMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingAI}
            sessionTitle={activeChatSession.title}
            chatInputRef={chatInputRef}
            onResendMessageRequest={handleResendMessageContent}
            ttsGlobal={tts}
            onToggleSidebar={toggleSidebar} 
            isMobile={isMobile} // Pass isMobile for internal ChatView responsive elements
            isSidebarOverlayVisible={isSidebarOverlayVisible} // Let ChatView know if sidebar is open
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
            {!isSidebarOverlayVisible && ( // Show menu button if sidebar is closed
                 <button
                    onClick={toggleSidebar}
                    className="fixed top-4 start-4 z-20 p-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    aria-label={t('openMenu')}
                 >
                    <Bars3Icon className="w-6 h-6"/>
                </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-600 dark:text-gray-400 mb-4">{t('welcomeTitle')}</h1>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-500 mb-6">{t('welcomeSubtitle')}</p>
            <button
              onClick={handleCreateNewChat}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-colors duration-150 ease-in-out flex items-center"
            >
              <PlusIcon className="w-5 h-5 me-2" />
              {t('startNewChat')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <AppSettingsProvider>
    <AppContent />
  </AppSettingsProvider>
);

export default App;