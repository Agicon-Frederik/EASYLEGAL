import i18next, { InitOptions } from 'i18next';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './types';
import { resources } from './resources';

export const i18nConfig: InitOptions = {
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
};

export function createI18nInstance() {
  const instance = i18next.createInstance();
  return instance;
}
