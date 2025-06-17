
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Spinner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ms-2">{t('aiThinking')}</span>
    </div>
  );
};

export default Spinner;
