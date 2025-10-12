import enCommon from '../locales/en/common.json';
import frCommon from '../locales/fr/common.json';
import nlCommon from '../locales/nl/common.json';

export const resources = {
  en: {
    common: enCommon,
  },
  fr: {
    common: frCommon,
  },
  nl: {
    common: nlCommon,
  },
} as const;

export type TranslationResources = typeof resources;
