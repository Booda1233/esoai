
import React, { useState, useEffect } from 'react';
import { AppMessage, MessagePart } from '../types';
import { 
    UserCircleIcon, 
    SparklesIcon, 
    ClipboardDocumentIcon, 
    ArrowPathIcon, 
    SpeakerWaveIcon, 
    SpeakerXMarkIcon,
    CheckIcon
} from '../assets/icons';
import IconButton from './IconButton';
import { UseTextToSpeechReturn } from '../hooks/useTextToSpeech';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTranslation } from '../hooks/useTranslation';

// Helper to render message parts (text or image)
const renderPart = (part: MessagePart, index: number, isMobile: boolean): React.ReactNode => {
  if (part.text) {
    const linkRegex = /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g;
    const elements: (string | React.ReactElement)[] = []; 
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(part.text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(part.text.substring(lastIndex, match.index));
      }
      elements.push(
        <a
          key={`part-${index}-link-${match.index}`} 
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline"
        >
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < part.text.length) {
      elements.push(part.text.substring(lastIndex));
    }
    
    const segmentsWithBreaks: React.ReactNode[] = elements.flatMap((el, el_idx) => 
        typeof el === 'string' ? el.split('\n').map((line, line_idx, arr) => (
            <React.Fragment key={`part-${index}-el-${el_idx}-line-${line_idx}`}>
                {line}
                {line_idx < arr.length - 1 && <br />}
            </React.Fragment>
        )) : [el]
    );

    return <div key={`part-text-content-${index}`} className="whitespace-pre-wrap">{segmentsWithBreaks}</div>;
  }

  if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
    return (
      <img
        key={`part-image-${index}`}
        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
        alt="Chat content"
        className={`rounded-lg mt-2 shadow ${isMobile ? 'max-w-[180px] xs:max-w-[200px]' : 'max-w-xs md:max-w-sm'}`}
      />
    );
  }
  return null;
};


interface MessageBubbleProps {
  message: AppMessage;
  onResendMessageRequest: (text: string, file?: File) => void;
  ttsGlobal: UseTextToSpeechReturn;
  isMobile: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onResendMessageRequest, ttsGlobal, isMobile }) => {
  const isUser = message.role === 'user';
  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser 
    ? 'bg-indigo-600 text-white' 
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  
  const avatarSize = isMobile ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-8 h-8';
  const avatarIcon = isUser 
    ? <UserCircleIcon className={`${avatarSize} text-indigo-400 dark:text-indigo-300`} /> 
    : <SparklesIcon className={`${avatarSize} text-teal-500 dark:text-teal-400`} />;
  
  const textAlignmentClass = isUser ? 'items-end' : 'items-start';

  const [isCopied, setIsCopied] = useState(false);
  const [isThisMessagePlayingAudio, setIsThisMessagePlayingAudio] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const { language } = useAppSettings();
  const { t } = useTranslation();

  const messageTextContent = message.parts.reduce((acc, part) => {
    if (part.text) return acc + part.text + "\n";
    return acc;
  }, "").trim();

  useEffect(() => {
    if (!ttsGlobal.isSpeaking && isThisMessagePlayingAudio) {
      setIsThisMessagePlayingAudio(false);
    }
  }, [ttsGlobal.isSpeaking, isThisMessagePlayingAudio]);

  const handleCopy = async () => {
    if (!messageTextContent) return;
    try {
      await navigator.clipboard.writeText(messageTextContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleResend = () => {
    const textToResend = message.parts.find(p => p.text)?.text || '';
    // This is simplistic. If a message had a file, we don't have the File object here.
    // For now, only resends text. File resend needs original File object access.
    onResendMessageRequest(textToResend); 
  };

  const handlePlayAudio = () => {
    if (!messageTextContent) return;
    if (isThisMessagePlayingAudio && ttsGlobal.isSpeaking) {
      ttsGlobal.cancel();
      setIsThisMessagePlayingAudio(false);
    } else {
      ttsGlobal.cancel();
      ttsGlobal.speak(messageTextContent, language === 'ar' ? 'ar-EG' : 'en-US');
      setIsThisMessagePlayingAudio(true);
    }
  };
  
  const actionIconSize = isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const actionButtonPadding = isMobile ? 'p-1' : 'p-1.5';
  const actionButtonClasses = `${actionButtonPadding} bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white rounded`;

  return (
    <div 
        className={`flex ${bubbleAlignment} mb-3 sm:mb-4 group/bubble relative`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-end max-w-lg sm:max-w-xl lg:max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'ms-1.5 sm:ms-2' : 'me-1.5 sm:me-2'}`}>
          {avatarIcon}
        </div>
        <div className={`${textAlignmentClass} flex flex-col`}>
          <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl shadow-md ${bubbleColor} relative text-sm sm:text-base`}>
            {message.uiImageUrl && (
              <img 
                src={message.uiImageUrl} 
                alt={t('uploadedContentAlt')} 
                className={`rounded-lg mb-2 shadow ${isMobile ? 'max-w-[180px] xs:max-w-[200px]' : 'max-w-xs md:max-w-sm'}`} 
              />
            )}
            {message.fileName && !message.uiImageUrl && (
                 <div className="text-xs italic text-gray-500 dark:text-gray-400 mb-1 p-1.5 sm:p-2 border border-gray-400 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800">
                    {t('fileAttachedLabel')}: {message.fileName}
                 </div>
            )}
            {message.parts.map((part, index) => renderPart(part, index, isMobile))}
            
            {showActions && (
            <div className={`absolute -top-3 ${isUser ? 'start-0 transform -translate-x-full ps-0 pe-1 rtl:-translate-x-0 rtl:translate-x-full rtl:ps-1 rtl:pe-0' : 'end-0 transform translate-x-full pe-0 ps-1 rtl:translate-x-0 rtl:-translate-x-full rtl:pe-1 rtl:ps-0'} flex items-center space-x-1 rtl:space-x-reverse opacity-100 transition-opacity duration-150`}>
                {messageTextContent && (
                    <IconButton
                        icon={isCopied ? <CheckIcon className={`${actionIconSize} text-green-500 dark:text-green-400`} /> : <ClipboardDocumentIcon className={actionIconSize} />}
                        onClick={handleCopy}
                        ariaLabel={isCopied ? t('copied') : t('copyMessage')}
                        title={isCopied ? t('copied') : t('copy')}
                        className={actionButtonClasses}
                    />
                )}
                {isUser && messageTextContent && (
                    <IconButton
                        icon={<ArrowPathIcon className={actionIconSize} />}
                        onClick={handleResend}
                        ariaLabel={t('resendMessage')}
                        title={t('resend')}
                        className={actionButtonClasses}
                    />
                )}
                {!isUser && messageTextContent && ttsGlobal.isSupported && (
                    <IconButton
                        icon={isThisMessagePlayingAudio && ttsGlobal.isSpeaking ? <SpeakerXMarkIcon className={`${actionIconSize} text-red-500 dark:text-red-400`} /> : <SpeakerWaveIcon className={actionIconSize} />}
                        onClick={handlePlayAudio}
                        ariaLabel={isThisMessagePlayingAudio && ttsGlobal.isSpeaking ? t('stopAudio') : t('playAudio')}
                        title={isThisMessagePlayingAudio && ttsGlobal.isSpeaking ? t('stop') : t('play')}
                        className={actionButtonClasses}
                    />
                )}
            </div>
            )}
          </div>
          <p className={`text-xs text-gray-500 dark:text-gray-500 mt-1 px-1 ${isUser ? 'text-end' : 'text-start'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
