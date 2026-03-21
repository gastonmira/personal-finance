import en from './locales/en'
import es from './locales/es'

const locales = { en, es }

export function useTranslation() {
  const override = new URLSearchParams(window.location.search).get('lang')
  const detected = navigator.language?.startsWith('es') ? 'es' : 'en'
  const lang = override ?? detected
  const strings = locales[lang] ?? locales.en
  return (key, vars) => {
    const val = strings[key] ?? key
    if (!vars || typeof val !== 'string') return val
    return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
  }
}
