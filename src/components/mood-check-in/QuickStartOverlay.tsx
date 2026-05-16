'use client'

import { useState } from 'react'
import { X, Play, Volume2 } from 'lucide-react'
import type { Session, Duration, GuidanceLevel } from '@/lib/types'

interface QuickStartOverlayProps {
  session: Session
  onStart?: (duration: Duration, guidance: GuidanceLevel) => void
  onClose?: () => void
}

const typeIcons: Record<string, string> = {
  sleep: '🌙',
  morning: '🌅',
  'body scan': '🧘',
  focus: '🎯',
}

const guidanceDescriptions: Record<string, string> = {
  none: 'Silent — no narration',
  light: 'Gentle prompts at key moments',
  full: 'Full narration throughout',
}

export function QuickStartOverlay({ session, onStart, onClose }: QuickStartOverlayProps) {
  const [selectedDuration, setSelectedDuration] = useState<Duration>(session.durations[0])
  const [selectedGuidance, setSelectedGuidance] = useState<GuidanceLevel>(session.guidanceLevels[0])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-700 max-w-lg mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="px-5 pb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
                  {typeIcons[session.type] || '🧘'}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {session.title}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    <Volume2 className="w-3 h-3" strokeWidth={1.5} />
                    {session.soundscape}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Duration picker */}
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Duration
              </p>
              <div className="flex gap-2">
                {session.durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        selectedDuration === d
                          ? 'bg-teal-500 text-white shadow-sm shadow-teal-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Guidance picker */}
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                Guidance
              </p>
              <div className="space-y-2">
                {session.guidanceLevels.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGuidance(g)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all duration-200 border
                      ${
                        selectedGuidance === g
                          ? 'border-teal-300 dark:border-teal-600 bg-teal-50/50 dark:bg-teal-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <span
                      className={`text-sm font-medium capitalize ${
                        selectedGuidance === g
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {g}
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {guidanceDescriptions[g]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => onStart?.(selectedDuration, selectedGuidance)}
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-teal-500/20 active:scale-[0.98]"
            >
              <Play className="w-4 h-4" fill="currentColor" strokeWidth={0} />
              Start — {selectedDuration} min
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
