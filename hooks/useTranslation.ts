
import { useCallback, useEffect, useState } from 'react';
import { useAppSettings } from './useAppSettings';
// Use 'import type' for TypeScript to infer keys. This is erased at runtime.
import type enTranslationsForKeys from '@/locales/en.json';
import type arTranslationsForKeys from '@/locales/ar.json';

// Utility type to extract string keys from an object type
type StringKeys<T> = Extract<keyof T, string>;

// Assuming en.json and ar.json have a compatible set of keys.
// This provides type safety for keys used with the t() function.
// Ensure TranslationKey is explicitly a string by extracting string keys.
export type TranslationKey = StringKeys<typeof enTranslationsForKeys> & StringKeys<typeof arTranslationsForKeys>;

type TranslationsData = Record<string, string>; // e.g. { "key1": "value1", ... }
type AllTranslations = {
  en: TranslationsData | null;
  ar: TranslationsData | null;
};

const initialTranslations: AllTranslations = {
  en: null,
  ar: null,
};

export const useTranslation = () => {
  const { language } = useAppSettings();
  const [translations, setTranslations] = useState<AllTranslations>(initialTranslations);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);
  const [errorLoadingTranslations, setErrorLoadingTranslations] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoadingTranslations(true);
      setErrorLoadingTranslations(null);
      try {
        // Paths are relative to index.html due to import map resolution
        const [enResponse, arResponse] = await Promise.all([
          fetch('./locales/en.json'), 
          fetch('./locales/ar.json')  
        ]);

        if (!enResponse.ok) {
          throw new Error(`Failed to load English translations: ${enResponse.statusText}`);
        }
        if (!arResponse.ok) {
          throw new Error(`Failed to load Arabic translations: ${arResponse.statusText}`);
        }

        const enData = await enResponse.json();
        const arData = await arResponse.json();

        setTranslations({
          en: enData,
          ar: arData,
        });
      } catch (error: any) {
        console.error('Error fetching or parsing translation files:', error);
        setErrorLoadingTranslations(error.message || 'Failed to load translations');
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    fetchTranslations();
  }, []); // Fetch once on mount

  const t = useCallback(
    (key: TranslationKey, replacements?: Record<string, string | number>): string => {
      if (isLoadingTranslations) {
        // Since TranslationKey is now guaranteed to be a string, String(key) simplifies to key.
        return key; // Or a loading indicator string like "..."
      }
      if (errorLoadingTranslations) {
        // Since TranslationKey is string, direct use in template literal is fine.
        return ` (${key})`;
      }

      const langData = translations[language];
      const fallbackLangData = translations.en; // Default fallback to English

      // Since key is a string, and TranslationsData is Record<string, string>, this is type-safe.
      // Fallback to key itself if not found.
      let translation = langData?.[key] || fallbackLangData?.[key] || key; 
      
      if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
          translation = translation.replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
        });
      }
      return translation;
    },
    [language, translations, isLoadingTranslations, errorLoadingTranslations]
  );

  return { t, currentLanguage: language, isLoadingTranslations, errorLoadingTranslations };
};
