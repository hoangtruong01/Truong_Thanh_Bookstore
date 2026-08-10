import { createI18n } from 'vue-i18n';
import vi from './vi.json';
import en from './en.json';

const i18n = createI18n({
  legacy: false, // Composition API
  locale: localStorage.getItem('lang') || 'vi',
  fallbackLocale: 'vi',
  messages: {
    vi,
    en,
  },
});

export default i18n;
