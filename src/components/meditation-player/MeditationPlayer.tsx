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

function rampGain(gain: GainNode, ctx: AudioContext, to: number, ms: number) {
  const now = ctx.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  if (ms <= 0) {
    gain.gain.setValueAtTime(to, now)
  } else {
    gain.gain.linearRampToValueAtTime(to, now + ms / 1000)
  }
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
  const [volume, setVolume] = useState(0.3)
  const [showVolume, setShowVolume] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  // Triggers the play effect once the decoded buffer is available.
  const [bufferReady, setBufferReady] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  // Track playback position so pause/resume is seamless.
  const playOffsetRef = useRef(0)
  const playStartCtxTimeRef = useRef(0)
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

  // Create AudioContext, connect gain, fetch + decode the audio file.
  useEffect(() => {
    if (!mood.audioFile) {
      console.warn(`[MeditationPlayer] no audioFile for mood ${mood.id}; running silent`)
      return
    }

    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)
    audioCtxRef.current = ctx
    gainNodeRef.current = gain

    fetch(mood.audioFile)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        audioBufferRef.current = decoded
        setBufferReady(true)
      })
      .catch(() => {})

    return () => {
      setBufferReady(false)
      clearPendingPause()
      try {
        sourceNodeRef.current?.stop()
      } catch (_) {}
      sourceNodeRef.current = null
      audioBufferRef.current = null
      playOffsetRef.current = 0
      ctx.close().catch(() => {})
      audioCtxRef.current = null
      gainNodeRef.current = null
    }
  }, [mood.audioFile, mood.id, clearPendingPause])

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

  // Play / pause / completion — reruns when buffer arrives (bufferReady).
  useEffect(() => {
    const ctx = audioCtxRef.current
    const gain = gainNodeRef.current
    if (!ctx || !gain) return

    clearPendingPause()

    if (isComplete) {
      rampGain(gain, ctx, 0, FADE_COMPLETE_MS)
      pendingPauseRef.current = window.setTimeout(() => {
        pendingPauseRef.current = null
        try {
          sourceNodeRef.current?.stop()
        } catch (_) {}
        sourceNodeRef.current = null
      }, FADE_COMPLETE_MS + 20)
      return
    }

    if (isPlaying) {
      ctx.resume().catch(() => {})
      const buffer = audioBufferRef.current
      if (!buffer) return // buffer not loaded yet; bufferReady will re-trigger

      try {
        sourceNodeRef.current?.stop()
      } catch (_) {}
      sourceNodeRef.current = null

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true // gap-free loop at the sample level
      source.connect(gain)

      const offset = playOffsetRef.current % buffer.duration
      source.start(0, offset)
      playStartCtxTimeRef.current = ctx.currentTime
      playOffsetRef.current = offset
      sourceNodeRef.current = source

      rampGain(gain, ctx, volume, FADE_PLAY_MS)
    } else {
      // Snapshot current position before stopping so resume is seamless.
      const buffer = audioBufferRef.current
      if (buffer && sourceNodeRef.current) {
        const elapsed = ctx.currentTime - playStartCtxTimeRef.current
        playOffsetRef.current = (playOffsetRef.current + elapsed) % buffer.duration
      }

      rampGain(gain, ctx, 0, FADE_PAUSE_MS)
      pendingPauseRef.current = window.setTimeout(() => {
        pendingPauseRef.current = null
        try {
          sourceNodeRef.current?.stop()
        } catch (_) {}
        sourceNodeRef.current = null
      }, FADE_PAUSE_MS + 20)
    }
    // volume excluded intentionally — slider changes are handled by the [volume] effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isComplete, bufferReady])

  useEffect(() => {
    if (volumeFirstRunRef.current) {
      volumeFirstRunRef.current = false
      return
    }
    const ctx = audioCtxRef.current
    const gain = gainNodeRef.current
    if (!ctx || !gain || !isPlaying || isComplete) return
    rampGain(gain, ctx, volume, FADE_SLIDER_MS)
    // isPlaying / isComplete are read defensively; their transitions belong to the effect above
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
