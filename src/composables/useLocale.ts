import { computed } from 'vue'
import { locale, setLocale, type Locale } from '@/i18n'

export function useLocale() {
  return computed({
    get: () => locale.value,
    set: (value: Locale) => setLocale(value),
  })
}
