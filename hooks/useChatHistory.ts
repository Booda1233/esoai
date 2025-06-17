
import { useState, useCallback, useEffect } from 'react';
import { ChatSession, AppMessage } from '../types';

const STORAGE_KEY = 'esraaChatHistory';

export const useChatHistory = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions: ChatSession[] = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
            const sorted = [...parsedSessions].sort((a,b) => b.lastUpdatedAt - a.lastUpdatedAt);
            setActiveSessionIdState(sorted[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error);
    }
  }, []);

  const saveSessions = useCallback((updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (error)
      {
      console.error("Error saving chat history to localStorage:", error);
    }
  }, []);

  const setActiveSessionId = useCallback((sessionId: string | null) => {
    setActiveSessionIdState(sessionId);
  }, []);

  const createNewSession = useCallback((title: string): string => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: title,
      messages: [],
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    return newSession.id;
  }, [sessions, saveSessions]);

  const addMessageToSession = useCallback((sessionId: string, message: AppMessage) => {
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.map(session =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, message], lastUpdatedAt: Date.now() }
          : session
      );
      saveSessions(updatedSessions);
      return updatedSessions;
    });
  }, [saveSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prevSessions => {
      const updatedSessions = prevSessions.filter(session => session.id !== sessionId);
      saveSessions(updatedSessions);
      if (activeSessionId === sessionId) {
        const newActiveId = updatedSessions.length > 0 
          ? [...updatedSessions].sort((a,b) => b.lastUpdatedAt - a.lastUpdatedAt)[0].id 
          : null;
        setActiveSessionIdState(newActiveId);
      }
      return updatedSessions;
    });
  }, [saveSessions, activeSessionId]);

  const loadSessionMessages = useCallback((sessionId: string): AppMessage[] => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.messages : [];
  }, [sessions]);

  const updateSessionTitle = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session =>
          session.id === sessionId
            ? { ...session, title: newTitle, lastUpdatedAt: Date.now() } // Also update lastUpdatedAt for sorting
            : session
        );
        saveSessions(updatedSessions);
        return updatedSessions;
      });
  }, [saveSessions]);


  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    addMessageToSession,
    createNewSession,
    deleteSession,
    loadSessionMessages,
    updateSessionTitle,
  };
};
