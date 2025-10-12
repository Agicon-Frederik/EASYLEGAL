import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import nlCommon from './locales/nl/common.json';

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
  nl: { common: nlCommon },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
