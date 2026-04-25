import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { TRANSLATIONS, type Lang } from './translations'

type LangContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (typeof TRANSLATIONS)['pt']
}

const LangContext = createContext<LangContextValue>({
  lang: 'pt',
  setLang: () => {},
  t: TRANSLATIONS['pt'],
})

const STORAGE_KEY = 'glepower_lang'

function detectBrowserLang(): Lang {
  const nav = navigator.language?.slice(0, 2)
  if (nav === 'en') return 'en'
  if (nav === 'es') return 'es'
  return 'pt'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored && (stored === 'pt' || stored === 'en' || stored === 'es')) return stored
    return detectBrowserLang()
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  // Keep lang in sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const v = e.newValue as Lang
        if (v === 'pt' || v === 'en' || v === 'es') setLangState(v)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

/** Standalone hook for client-facing pages (no LangProvider in tree).
 *  Reads lang from URL param first (?lang=en), then localStorage. */
export function useClientLang() {
  const paramLang = new URLSearchParams(window.location.search).get('lang') as Lang | null
  const initial: Lang =
    paramLang && (paramLang === 'pt' || paramLang === 'en' || paramLang === 'es')
      ? paramLang
      : (localStorage.getItem(STORAGE_KEY) as Lang | null) ?? detectBrowserLang()

  const [lang, setLangState] = useState<Lang>(initial)

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return { lang, setLang, t: TRANSLATIONS[lang] }
}
