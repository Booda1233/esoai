
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { PlusIcon, TrashIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '../assets/icons'; // Chevron icons removed
import Modal from './Modal';
import IconButton from './IconButton';
import { useTranslation } from '../hooks/useTranslation';


interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onCreateNewChat: () => void;
  isOverlayVisible: boolean; // Renamed to reflect unified behavior
  onToggle: () => void;
  // isMobile prop might be removed if not used for other specific stylings anymore
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectChat,
  onDeleteChat,
  onCreateNewChat,
  isOverlayVisible, // Use this prop
  onToggle,
}) => {
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const { t } = useTranslation();

  const handleDeleteClick = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteChat(sessionToDelete.id);
      setSessionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setSessionToDelete(null);
  };
  
  const sortedSessions = [...sessions].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);

  // Sidebar is now always an overlay, styled similarly to the previous mobile version
  const sidebarClasses = `
    flex flex-col h-full bg-gray-100 dark:bg-gray-800 border-e border-gray-300 dark:border-gray-700 
    transition-all duration-300 ease-in-out
    fixed inset-y-0 start-0 z-40 transform 
    ${isOverlayVisible ? 'translate-x-0 shadow-xl' : '-translate-x-full'} 
    w-4/5 max-w-[280px] sm:max-w-[300px]
  `;


  return (
    <>
      <div className={sidebarClasses}>
        {/* Header */}
        <div className="flex items-center p-3 sm:p-4 border-b border-gray-300 dark:border-gray-700 justify-between">
           <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white truncate">{t('Esraa Safwat')}</h1>
           <IconButton
            icon={<XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
            onClick={onToggle} // Always use onToggle to close
            ariaLabel={t('closeMenu')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
          />
        </div>

        {/* Content (always "expanded" when visible) */}
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="p-3 sm:p-4">
            <button
              onClick={onCreateNewChat}
              className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors duration-150 ease-in-out shadow-md text-sm sm:text-base"
              aria-label={t('createNewChat')}
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 me-2" />
              {t('newChat')}
            </button>
          </div>
          <h2 className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2 sm:mb-3 px-3 sm:px-4">{t('recentChats')}</h2>
          <div className="flex-grow overflow-y-auto space-y-1 sm:space-y-1.5 px-2 pb-4">
            {sortedSessions.length === 0 && (
              <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm px-2">{t('noChatsYet')}</p>
            )}
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectChat(session.id)}
                title={session.title}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out group
                            ${activeSessionId === session.id 
                              ? 'bg-indigo-500 dark:bg-indigo-600 text-white shadow-lg' 
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center overflow-hidden">
                    <ChatBubbleLeftRightIcon className={`w-4 h-4 sm:w-5 sm:h-5 me-2 sm:me-3 flex-shrink-0 ${activeSessionId === session.id ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-300'}`} />
                    <span className="truncate text-sm font-medium">{session.title}</span>
                </div>
                <IconButton
                  onClick={(e) => handleDeleteClick(e, session)}
                  icon={<TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                              ${activeSessionId === session.id ? 'text-indigo-100 hover:text-white hover:bg-indigo-400 dark:hover:bg-indigo-500 focus:opacity-100' : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-300 dark:hover:bg-gray-600 focus:opacity-100'}`}
                  ariaLabel={`${t('deleteChat')} ${session.title}`}
                />
              </div>
            ))}
          </div>
          {/* Settings button removed previously */}
        </div>
      </div>

      {sessionToDelete && (
        <Modal
          isOpen={!!sessionToDelete}
          onClose={cancelDelete}
          title={t('deleteChat')}
          description={`${t('confirmDeleteChat')} "${sessionToDelete.title}"? ${t('actionCannotBeUndone')}`}
          onConfirm={confirmDelete}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </>
  );
};

export default Sidebar;
