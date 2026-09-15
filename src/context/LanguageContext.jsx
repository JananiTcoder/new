import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'ta', label: 'தமிழ்' },
  { id: 'hi', label: 'हिन्दी' },
]

function getInitialLanguage() {
  const stored = localStorage.getItem('geosentra-language')
  return LANGUAGES.some((l) => l.id === stored) ? stored : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguageRaw] = useState(getInitialLanguage)

  const setLanguage = (id) => {
    if (!LANGUAGES.some((l) => l.id === id)) return
    localStorage.setItem('geosentra-language', id)
    setLanguageRaw(id)
  }

  // Falls back to the English string (never a raw key) so a missing
  // translation never renders blank or ugly.
  const t = (key) => translations[language]?.[key] || translations.en[key] || key

  return <LanguageContext.Provider value={{ language, setLanguage, languages: LANGUAGES, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
