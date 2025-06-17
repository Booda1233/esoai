
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ar';

interface AppSettingsContextType {
  theme: Theme;
  language: Language;
}

// Fixed settings
const fixedTheme: Theme = 'dark';
const fixedLanguage: Language = 'en'; // Changed to English

const defaultSettings: AppSettingsContextType = {
  theme: fixedTheme,
  language: fixedLanguage,
};

export const AppSettingsContext = createContext<AppSettingsContextType>(defaultSettings);

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const theme: Theme = fixedTheme;
  const language: Language = fixedLanguage; // Explicitly typed 'language'

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    // Since language is fixed to 'en', dir is always 'ltr'.
    // This resolves the TypeScript error regarding the 'en' === 'ar' comparison.
    root.dir = 'ltr';
  }, [language]);

  return (
    <AppSettingsContext.Provider value={{ theme, language }}>
      {children}
    </AppSettingsContext.Provider>
  );
};
