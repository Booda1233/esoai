
import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { PaperAirplaneIcon, PaperClipIcon, MicrophoneIcon, StopIcon } from '../assets/icons';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, SUPPORTED_FILE_TYPES } from '../constants';
import IconButton from './IconButton';
import { ChatInputHandle } from './ChatView';
import { useTranslation } from '../hooks/useTranslation';
import { useAppSettings } from '../hooks/useAppSettings';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
  stopSpeaking: () => void; 
  isSpeaking: boolean; 
  isMobile: boolean;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ onSendMessage, isLoading, stopSpeaking, isSpeaking, isMobile }, ref) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { t } = useTranslation();
  const { language } = useAppSettings();

  useImperativeHandle(ref, () => ({
    setContent: (newText: string, newFile?: File) => {
      setText(newText);
      setFile(newFile || null);
      if (fileInputRef.current) {
          if (!newFile) fileInputRef.current.value = '';
      }
      textareaRef.current?.focus();
    }
  }));

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSpeaking) { 
      stopSpeaking();
    }
    setText(e.target.value);
  };
  
  const handleFinalTranscript = useCallback((finalTranscript: string) => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (finalTranscript.trim()) {
      onSendMessage(finalTranscript.trim(), undefined); 
    }
  }, [onSendMessage, isSpeaking, stopSpeaking]);

  const { isRecording, transcript, startRecording, stopRecording: stopVoiceInput, error: voiceError } = useVoiceInput({
    onTranscriptUpdate: (newTranscript) => {
       if (isSpeaking) { 
         stopSpeaking();
       }
      setText(newTranscript)
    },
    onFinalTranscriptReady: handleFinalTranscript, 
    lang: language === 'ar' ? 'ar-EG' : 'en-US',
  });

  const handleSend = () => {
    if ((text.trim() || file) && !isLoading) {
      if (isSpeaking) stopSpeaking(); 
      onSendMessage(text.trim(), file || undefined);
      setText('');
      setFile(null);
      setFileError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      textareaRef.current?.style.setProperty('height', 'auto'); // Reset height
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Disable enter-to-send on mobile to allow easier multiline input
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    } else {
      if (isSpeaking) { 
        stopSpeaking();
      }
    }
     // Auto-resize textarea
    const textarea = e.currentTarget;
    textarea.style.height = 'auto'; // Temporarily shrink to get the true scrollHeight
    textarea.style.height = `${Math.min(textarea.scrollHeight, isMobile ? 96 : 128)}px`; // 96px is max-h-24, 128px is max-h-32

  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSpeaking) stopSpeaking(); 
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setFileError(t('fileTooLargeError', { size: MAX_FILE_SIZE_MB }));
        setFile(null);
        if(e.target) e.target.value = ''; // Clear file input
        return;
      }
      if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type) && selectedFile.type !== "") {
        console.warn(`File type "${selectedFile.type}" may not be fully supported by the AI.`);
        // Potentially set a non-blocking warning: setFileError(t('fileTypeWarning', { type: selectedFile.type }));
      }
      setFile(selectedFile);
      setFileError(null);
    }
  };

  const handleVoiceToggle = () => {
    if (isSpeaking) stopSpeaking(); 
    if (isRecording) {
      stopVoiceInput();
    } else {
      setText(''); 
      startRecording();
    }
  };
  
  useEffect(() => {
    if (!isRecording && transcript && text === '' && !voiceError) {
        setText(transcript);
    }
  }, [transcript, isRecording, text, voiceError]);

  const iconSize = isMobile ? "w-5 h-5" : "w-6 h-6";
  const buttonPadding = isMobile ? "p-2.5" : "p-3";


  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-1.5 sm:p-2 rounded-lg">
      {(fileError || voiceError) && (
        <div className="mb-2 text-xs sm:text-sm text-red-500 dark:text-red-400 p-2 bg-red-200 dark:bg-red-900 bg-opacity-50 rounded">
          {fileError || voiceError}
        </div>
      )}
      {file && (
        <div className="mb-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center p-2 bg-gray-200 dark:bg-gray-700 rounded">
          <span>{t('fileLabel')}: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          <button 
            onClick={() => { 
              setFile(null); 
              if (fileInputRef.current) fileInputRef.current.value = ''; 
              if (isSpeaking) stopSpeaking(); 
            }} 
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-xs"
          >
            {t('remove')}
          </button>
        </div>
      )}
      <div className="flex items-end space-x-1 sm:space-x-2 rtl:space-x-reverse">
        <IconButton
          icon={isRecording ? <StopIcon className={`${iconSize} text-red-500`} /> : <MicrophoneIcon className={`${iconSize} text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400`} />}
          onClick={handleVoiceToggle}
          disabled={isLoading && !isRecording} 
          ariaLabel={isRecording ? t('stopRecording') : t('startVoiceInput')}
          className={`${buttonPadding} bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg group`}
        />
        <IconButton
          icon={<PaperClipIcon className={`${iconSize} text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400`} />}
          onClick={() => { if (isSpeaking) stopSpeaking(); fileInputRef.current?.click();}}
          disabled={isLoading || isRecording} 
          ariaLabel={t('attachFile')}
          className={`${buttonPadding} bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg group`}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={SUPPORTED_FILE_TYPES.join(',')}
        />
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress} // Use onKeyDown for Enter key to allow Shift+Enter
          placeholder={isRecording ? t('listeningPlaceholder') : t('chatInputPlaceholder')}
          className={`flex-grow p-2.5 sm:p-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base ${isMobile ? 'max-h-24' : 'max-h-32'} overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-200 dark:scrollbar-track-gray-800`}
          disabled={isLoading || (isRecording && !text && transcript !== '')} 
          style={{height: 'auto'}} // Initial height
        />
        <IconButton
          icon={<PaperAirplaneIcon className={iconSize} />}
          onClick={handleSend}
          disabled={isLoading || (!text.trim() && !file) || isRecording} 
          ariaLabel={t('sendMessage')}
          className={`${buttonPadding} bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
    </div>
  );
});

export default ChatInput;
