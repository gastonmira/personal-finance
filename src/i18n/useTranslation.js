import en from './locales/en'
import es from './locales/es'

const locales = { en, es }

export function useTranslation() {
  const lang = navigator.language?.startsWith('es') ? 'es' : 'en'
  const strings = locales[lang] ?? locales.en
  return (key) => strings[key] ?? key
}
