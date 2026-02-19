import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import es from '../locales/es.json';

// Locale resource configuration
const resources = {
  en: { translation: en },
  es: { translation: es },
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'es', // Default language is Spanish
  fallbackLng: 'es', // Fallback to Spanish if key not found
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  ns: ['translation'],
  defaultNS: 'translation',
  showSupportNotice: false, // Disable i18next support notice in console
});

export default i18n;
