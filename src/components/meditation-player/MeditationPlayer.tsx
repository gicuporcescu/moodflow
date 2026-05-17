'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Pause, Play, X, Volume2 } from 'lucide-react'
import type { ActiveSession, Mood } from '@/lib/types'
import { BreathingVisualizer } from './BreathingVisualizer'
import { CompletionScreen } from './CompletionScreen'

interface MeditationPlayerProps {
  activeSession: ActiveSession
  mood: Mood
  onTogglePlay?: () => void
  onEndSession?: () => void
  onComplete?: () => void
}

const FADE_PLAY_MS = 400
const FADE_PAUSE_MS = 400
const FADE_SLIDER_MS = 200
const FADE_COMPLETE_MS = 1500
const RAMP_STEP_MS = 16

function rampVolume(
  el: HTMLAudioElement,
  to: number,
  ms: number,
  cancel: { id: number | null },
) {
  if (cancel.id !== null) {
    window.clearInterval(cancel.id)
    cancel.id = null
  }
  const from = el.volume
  if (ms <= 0 || from === to) {
    el.volume = to
    return
  }
  const start = performance.now()
  cancel.id = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / ms)
    el.volume = from + (to - from) * t
    if (t >= 1 && cancel.id !== null) {
      window.clearInterval(cancel.id)
      cancel.id = null
    }
  }, RAMP_STEP_MS)
}

export function MeditationPlayer({
  activeSession,
  mood,
  onTogglePlay,
  onEndSession,
  onComplete,
}: MeditationPlayerProps) {
  const totalSeconds = activeSession.selectedDuration * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(0.7)
  const [showVolume, setShowVolume] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeCancelRef = useRef<{ id: number | null }>({ id: null })
  const pendingPauseRef = useRef<number | null>(null)
  const volumeFirstRunRef = useRef(true)

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const clearPendingPause = useCallback(() => {
    if (pendingPauseRef.current !== null) {
      window.clearTimeout(pendingPauseRef.current)
      pendingPauseRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isPlaying && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            stopTimer()
            setIsComplete(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      stopTimer()
    }
    return stopTimer
  }, [isPlaying, secondsLeft, stopTimer])

  useEffect(() => {
    if (!mood.audioFile) {
      console.warn(`[MeditationPlayer] no audioFile for mood ${mood.id}; running silent`)
    }
  }, [mood.audioFile, mood.id])

  // Mount/unmount only — play & ramp belong to the next effect.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.volume = 0
    const cancel = fadeCancelRef.current
    return () => {
      if (cancel.id !== null) {
        window.clearInterval(cancel.id)
        cancel.id = null
      }
      clearPendingPause()
      el.pause()
    }
  }, [mood.audioFile, clearPendingPause])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    clearPendingPause()
    if (isComplete) {
      rampVolume(el, 0, FADE_COMPLETE_MS, fadeCancelRef.current)
      pendingPauseRef.current = window.setTimeout(() => {
        pendingPauseRef.current = null
        if (audioRef.current) audioRef.current.pause()
      }, FADE_COMPLETE_MS + 20)
      return
    }
    if (isPlaying) {
      const playPromise = el.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
      rampVolume(el, volume, FADE_PLAY_MS, fadeCancelRef.current)
    } else {
      rampVolume(el, 0, FADE_PAUSE_MS, fadeCancelRef.current)
      pendingPauseRef.current = window.setTimeout(() => {
        pendingPauseRef.current = null
        if (audioRef.current) audioRef.current.pause()
      }, FADE_PAUSE_MS + 20)
    }
    // Slider changes are handled by the dedicated [volume] effect below;
    // re-running here would double-ramp on every slider tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isComplete])

  useEffect(() => {
    if (volumeFirstRunRef.current) {
      volumeFirstRunRef.current = false
      return
    }
    const el = audioRef.current
    if (!el || !isPlaying || isComplete) return
    rampVolume(el, volume, FADE_SLIDER_MS, fadeCancelRef.current)
    // isPlaying / isComplete are read defensively but their transitions
    // are owned by the [isPlaying, isComplete] effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    onTogglePlay?.()
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const progress = 1 - secondsLeft / totalSeconds

  return (
    <>
      {mood.audioFile && (
        <audio ref={audioRef} src={mood.audioFile} loop preload="auto" />
      )}
      {isComplete ? (
        <CompletionScreen session={activeSession} mood={mood} onComplete={onComplete} />
      ) : (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-between px-6 py-8 select-none">
          {/* Ambient background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.06)_0%,_transparent_70%)]" />

          {/* Top bar: session info + end */}
          <div className="relative w-full flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mt-0.5">{activeSession.title}</p>
            </div>
            <button
              onClick={onEndSession}
              className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Center: visualizer + timer */}
          <div className="relative flex flex-col items-center gap-8">
            <BreathingVisualizer isPlaying={isPlaying} />

            {/* Timer */}
            <div className="text-center">
              <p className="text-5xl font-light text-white tracking-tight font-[var(--font-mono)]">
                {timeDisplay}
              </p>
              {/* Progress bar */}
              <div className="mt-4 w-48 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500/60 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="relative w-full flex items-center justify-center gap-6">
            {/* Volume */}
            <div className="relative">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className="p-3 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <Volume2 className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {showVolume && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 rounded-xl px-3 py-4 shadow-xl border border-slate-700">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 h-1 accent-teal-500 [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3"
                  />
                </div>
              )}
            </div>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center text-white shadow-[0_0_30px_rgba(20,184,166,0.3)] transition-all active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" strokeWidth={0} />
              ) : (
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" strokeWidth={0} />
              )}
            </button>

            {/* Spacer for symmetry */}
            <div className="w-11" />
          </div>
        </div>
      )}
    </>
  )
}
