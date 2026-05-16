'use client'

import { useState } from 'react'

interface MoodCardProps {
  icon: string
  label: string
  onSelect?: () => void
}

export function MoodCard({ icon, label, onSelect }: MoodCardProps) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`
        group relative flex flex-col items-center justify-center gap-3
        aspect-square rounded-2xl
        bg-white dark:bg-slate-800/60
        border border-slate-200/80 dark:border-slate-700/50
        transition-all duration-300 ease-out
        hover:border-teal-300 dark:hover:border-teal-600
        hover:shadow-[0_0_24px_-4px_rgba(20,184,166,0.15)]
        dark:hover:shadow-[0_0_24px_-4px_rgba(20,184,166,0.1)]
        active:scale-[0.97]
        cursor-pointer
        ${pressed ? 'scale-[0.97] border-teal-400 dark:border-teal-500' : ''}
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-teal-50/0 to-teal-50/0 group-hover:from-teal-50/50 group-hover:to-transparent dark:group-hover:from-teal-900/20 dark:group-hover:to-transparent transition-all duration-300" />

      <span
        className="relative text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
        role="img"
        aria-label={label}
      >
        {icon}
      </span>

      <span className="relative text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors duration-300">
        {label}
      </span>
    </button>
  )
}
