
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceInputOptions {
  onTranscriptUpdate?: (transcript: string) => void;
  onFinalTranscriptReady?: (transcript: string) => void;
  lang?: string; // Make lang configurable
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognition, ev: any) => any) | null;
  onerror: ((this: SpeechRecognition, ev: any) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

export const useVoiceInput = ({ onTranscriptUpdate, onFinalTranscriptReady, lang = 'en-US' }: UseVoiceInputOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopRecordingInternal = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    if (isRecording) setIsRecording(false);
  }, [isRecording]);


  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    // Abort previous instance if lang changes
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    recognition.continuous = false; 
    recognition.interimResults = true;
    recognition.lang = lang; // Use the lang prop

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      if (onTranscriptUpdate) {
        onTranscriptUpdate(currentTranscript);
      }

      if (finalTranscript.trim()) { // Ensure finalTranscript is not just whitespace
        if (onFinalTranscriptReady) {
          onFinalTranscriptReady(finalTranscript.trim());
        }
        // Do not call stopRecordingInternal here if continuous is false,
        // as onend will handle it. If continuous were true, this would be needed.
        // For continuous=false, it stops automatically after a final result.
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = "An unknown speech recognition error occurred.";
      // More specific error messages can be internationalized if needed
      if (event.error === 'no-speech') {
        errorMessage = "No speech was detected. Please try again.";
      } else if (event.error === 'audio-capture') {
        errorMessage = "Audio capture failed. Ensure microphone is enabled and working.";
      } else if (event.error === 'not-allowed') {
        errorMessage = "Microphone access denied. Please allow microphone permission in your browser settings.";
      } else if (event.error === 'network') {
        errorMessage = "Network error during speech recognition. Please check your internet connection.";
      } else if (event.error === 'aborted') {
        // This can happen if we change language and abort the previous recognition instance.
        // Usually, we don't want to show an error for this specific case.
        // setError(null); // Or a less prominent message.
        // console.log('Speech recognition aborted, likely due to language change.');
        // return; // Don't set generic error for aborted
      }
      console.error('Speech recognition error:', event.error, event.message);
      setError(errorMessage);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onTranscriptUpdate, onFinalTranscriptReady]); // Removed stopRecordingInternal from deps

  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setTranscript('');
          setError(null);
          recognitionRef.current!.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error("Microphone access error:", err);
          setError("Microphone access denied or microphone not found. Please check permissions and hardware.");
          setIsRecording(false);
        });
    }
  }, [isRecording]);

  const manualStopRecording = useCallback(() => {
    stopRecordingInternal();
  }, [stopRecordingInternal]);


  return { isRecording, transcript, startRecording, stopRecording: manualStopRecording, error, setError };
};
