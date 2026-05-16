'use client'

import { Check } from 'lucide-react'
import type { ActiveSession, Mood } from '@/lib/types'

interface CompletionScreenProps {
  session: ActiveSession
  mood: Mood
  onComplete?: () => void
}

export function CompletionScreen({ session, mood, onComplete }: CompletionScreenProps) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Success icon */}
      <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mb-8">
        <Check className="w-8 h-8 text-teal-400" strokeWidth={2} />
      </div>

      <h2 className="text-2xl font-semibold text-white mb-2">Session Complete</h2>
      <p className="text-slate-400 text-sm mb-10">Well done. Take a moment before you go.</p>

      {/* Summary */}
      <div className="w-full max-w-xs space-y-4 mb-12">
        <div className="flex items-center justify-between py-3 border-b border-slate-800">
          <span className="text-xs uppercase tracking-widest text-slate-500">Session</span>
          <span className="text-sm text-slate-200">{session.title}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-800">
          <span className="text-xs uppercase tracking-widest text-slate-500">Duration</span>
          <span className="text-sm text-slate-200">{session.selectedDuration} min</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-slate-800">
          <span className="text-xs uppercase tracking-widest text-slate-500">Mood</span>
          <span className="text-sm text-slate-200">
            {mood.icon} {mood.label}
          </span>
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onComplete}
        className="px-10 py-3.5 rounded-full bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm transition-colors active:scale-[0.97]"
      >
        Done
      </button>
    </div>
  )
}
