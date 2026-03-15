import es from './locales/es'
import en from './locales/en'

const ALL_LOCALE_CATEGORIES = [es.categories, en.categories]

/**
 * Given a category name stored in any language, returns the equivalent
 * name in the current locale. Falls back to the stored value if not found.
 */
export function normalizeCategory(storedCat, localeCategories) {
  if (!storedCat) return storedCat
  // Already in current locale
  if (localeCategories.includes(storedCat)) return storedCat
  // Find the index in any known locale
  for (const known of ALL_LOCALE_CATEGORIES) {
    const idx = known.indexOf(storedCat)
    if (idx >= 0) return localeCategories[idx] ?? storedCat
  }
  return storedCat
}
