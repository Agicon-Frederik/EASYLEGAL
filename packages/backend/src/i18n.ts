import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';
import { i18nConfig, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from '@easylegal/common';

// Initialize i18next with filesystem backend for backend
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    ...i18nConfig,
    backend: {
      // Load translations from common package
      loadPath: path.join(__dirname, '../../node_modules/@easylegal/common/dist/locales/{{lng}}/{{ns}}.json'),
    },
    detection: {
      order: ['querystring', 'cookie', 'header'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      caches: ['cookie'],
    },
    preload: ['en', 'fr', 'nl'],
  });

export default i18next;
export const i18nextMiddleware = middleware.handle(i18next);
