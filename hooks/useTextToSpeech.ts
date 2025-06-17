
import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseTextToSpeechReturn {
  speak: (text: string, lang?: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;

      const initUtterance = () => {
        // Ensure synthRef.current is available
        if (!synthRef.current) return;
        
        // Always create a new utterance instance or clear previous one's handlers
        // This avoids issues with stale onend/onstart if the utterance object is reused heavily.
        const utterance = new SpeechSynthesisUtterance();
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance Error:', event.error);
            setIsSpeaking(false);
        };
        utteranceRef.current = utterance;
      };
      
      // Wait for voices to be loaded
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = () => {
          initUtterance();
        };
      } else {
        initUtterance();
      }

    } else {
      console.warn('Speech synthesis not supported by this browser.');
    }

    return () => { 
      if (synthRef.current) {
        if (synthRef.current.speaking) synthRef.current.cancel();
        synthRef.current.onvoiceschanged = null; // Clean up event listener
      }
    };
  }, []); 

  const speak = useCallback((text: string, lang: string = 'en-US') => {
    if (!isSupported || !utteranceRef.current || !synthRef.current) {
      console.warn('Speech synthesis not started: not supported or synth/utterance not initialized.');
      return;
    }
    
    if (synthRef.current.speaking) {
      synthRef.current.cancel(); 
      // isSpeaking will be set to false by the 'onend' of the cancelled utterance,
      // or by the cancel function itself.
    }
    
    // Re-assign text and lang to the current utterance instance
    utteranceRef.current.text = text;
    utteranceRef.current.lang = lang;

    const voices = synthRef.current.getVoices();
    let chosenVoice = null;

    if (voices.length > 0) {
      // Try to find a voice that matches the full lang string (e.g., 'ar-EG', 'en-US')
      chosenVoice = voices.find(voice => voice.lang === lang);
      
      // If not found, try to find a voice that matches the primary language (e.g., 'ar', 'en')
      if (!chosenVoice) {
        const primaryLang = lang.split('-')[0];
        chosenVoice = voices.find(voice => voice.lang === primaryLang && voice.default) || // Prefer default for primary lang
                      voices.find(voice => voice.lang === primaryLang) ||
                      voices.find(voice => voice.lang.startsWith(primaryLang + "-") && voice.default) ||
                      voices.find(voice => voice.lang.startsWith(primaryLang + "-"));
      }
       // For Arabic, specifically try to find a female voice if no specific match
       if (!chosenVoice && lang.startsWith('ar')) {
        chosenVoice = voices.find(voice => voice.lang.startsWith('ar') && voice.name.toLowerCase().includes('female')) ||
                      voices.find(voice => voice.lang.startsWith('ar'));
      }
    }
    
    if (chosenVoice) {
      utteranceRef.current.voice = chosenVoice;
    } else if (voices.length > 0) {
      // Fallback: use the first available voice if no match, though this might not be ideal.
      // utteranceRef.current.voice = voices[0];
      console.warn(`No voice found for lang ${lang}. Speech might use a default system voice.`);
    }


    const attemptSpeak = () => {
        if (!utteranceRef.current || !synthRef.current) return;
        try {
            synthRef.current.speak(utteranceRef.current);
        } catch (e) {
            console.error("Error speaking:", e);
            setIsSpeaking(false); 
        }
    };
    
    // A small delay can help ensure cancel() has fully processed or voices are ready.
    setTimeout(attemptSpeak, 50);

  }, [isSupported]);

  const cancel = useCallback(() => {
    if (isSupported && synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false); 
    }
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
};

export default useTextToSpeech;
