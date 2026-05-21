'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Share2, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

const LS_KEY = 'moodflow-install-dismissed'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < COOLDOWN_MS
  } catch {
    return false
  }
}

function recordDismissal(): void {
  try {
    localStorage.setItem(LS_KEY, String(Date.now()))
  } catch {
    // localStorage unavailable (e.g. Safari private browsing)
  }
}

export function InstallPrompt() {
  const [promptType, setPromptType] = useState<'android' | 'ios' | null>(null)
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('[SW] registration failed:', err))
    }

    if (isDismissedRecently()) return
    if (window.location.pathname === '/play') return

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (isIOS && !isStandalone) {
      const t = setTimeout(() => setPromptType('ios'), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setPromptType('android')
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    recordDismissal()
    setPromptType(null)
  }

  const install = async () => {
    if (!deferredRef.current) return
    await deferredRef.current.prompt()
    await deferredRef.current.userChoice
    deferredRef.current = null
    recordDismissal()
    setPromptType(null)
  }

  if (!promptType) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-700 max-w-lg mx-auto px-5 pb-8 pt-3">
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Mini app icon */}
            <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shrink-0">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-[50%_0_50%_50%] -rotate-45" />
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Add MoodFlow to Home Screen
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Get quick access to your daily meditation
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {promptType === 'android' && (
          <button
            onClick={install}
            className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-teal-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Install App
          </button>
        )}

        {promptType === 'ios' && (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
              How to install on iOS
            </p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                  1
                </span>
                <span>
                  Tap the{' '}
                  <Share2
                    className="inline w-3.5 h-3.5 mb-0.5 text-slate-500"
                    strokeWidth={1.5}
                  />{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-medium">Share</strong>{' '}
                  button in Safari&apos;s toolbar
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-medium">
                    &ldquo;Add to Home Screen&rdquo;
                  </strong>
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                  3
                </span>
                <span>
                  Tap{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-medium">
                    &ldquo;Add&rdquo;
                  </strong>{' '}
                  in the top right corner
                </span>
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="w-full pt-1 pb-0.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
