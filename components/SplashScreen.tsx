
import React from 'react';
import { ChatBubbleLeftRightIcon } from '../assets/icons';
// import { useTranslation } from '../hooks/useTranslation'; // Settings not available yet

const SplashScreen: React.FC = () => {
  // const { t } = useTranslation(); // Can't use yet as settings aren't loaded

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-200 via-indigo-200 to-slate-200 dark:from-gray-900 dark:via-indigo-900 dark:to-slate-900 text-gray-800 dark:text-white animate-fadeIn">
      <div className="animate-fadeInUp-icon">
        <ChatBubbleLeftRightIcon className="w-20 h-20 sm:w-24 sm:h-24 text-indigo-600 dark:text-indigo-400 mb-5 sm:mb-6" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold mb-2 sm:mb-3 tracking-tight animate-fadeInUp-title">
        Esraa Safwat {/* t('appName') - Keep it simple or use a non-translated version */}
      </h1>
      <p className="text-lg sm:text-xl text-indigo-700 dark:text-indigo-300 animate-fadeInUp-subtitle">
        Initializing... {/* t('initializing') */}
      </p>
    </div>
  );
};

export default SplashScreen;
