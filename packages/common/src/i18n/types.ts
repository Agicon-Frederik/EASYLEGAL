// Supported languages
export type Language = 'en' | 'fr' | 'nl';

export const LANGUAGES: Language[] = ['en', 'fr', 'nl'];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  nl: 'Nederlands',
};

export const DEFAULT_LANGUAGE: Language = 'en';

// Fallback language when translation is missing
export const FALLBACK_LANGUAGE: Language = 'en';
