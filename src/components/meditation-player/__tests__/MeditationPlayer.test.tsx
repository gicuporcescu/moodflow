import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MeditationPlayer } from '../MeditationPlayer'
import type { ActiveSession, Mood } from '@/lib/types'

const activeSession: ActiveSession = {
  id: 'session-001',
  title: 'Letting Go',
  selectedDuration: 1, // 1 minute for quick testing
  selectedGuidance: 'light',
}

const mood: Mood = {
  id: 'mood-anxious',
  label: 'Anxious',
  icon: '🌊',
  audioFile: '/audio/anxious.mp3',
}

function makeMockGain() {
  return {
    gain: {
      value: 0,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
}

function makeMockAudioCtx() {
  return {
    currentTime: 0,
    destination: {},
    createGain: vi.fn(() => makeMockGain()),
    createBufferSource: vi.fn(() => ({
      buffer: null as AudioBuffer | null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    decodeAudioData: vi.fn(() => Promise.resolve({ duration: 120 } as AudioBuffer)),
  }
}

describe('MeditationPlayer', () => {
  beforeEach(() => {
    // Mock Web Audio API — jsdom doesn't implement it.
    // Must use a regular function (not an arrow) so `new AudioContext()` works.
    vi.stubGlobal('AudioContext', vi.fn(function () { return makeMockAudioCtx() }))
    global.fetch = vi.fn(() =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as unknown as Response),
    )
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders session title', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)
    expect(screen.getByText('Letting Go')).toBeInTheDocument()
  })

  it('displays initial timer value', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)
    expect(screen.getByText('1:00')).toBeInTheDocument()
  })

  it('counts down the timer', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('0:55')).toBeInTheDocument()
  })

  it('pauses and resumes the timer', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)

    // Timer starts at 1:00, advance 5s
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('0:55')).toBeInTheDocument()

    // Click pause - find the large play/pause button by class
    const findPlayPauseBtn = () =>
      screen.getAllByRole('button').find((btn) => btn.className.includes('w-16'))!
    fireEvent.click(findPlayPauseBtn())

    // Advance time - timer should not change
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('0:55')).toBeInTheDocument()

    // Resume
    fireEvent.click(findPlayPauseBtn())
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('0:50')).toBeInTheDocument()
  })

  it('calls onEndSession when X is clicked', () => {
    const onEndSession = vi.fn()
    render(
      <MeditationPlayer
        activeSession={activeSession}
        mood={mood}
        onEndSession={onEndSession}
      />
    )

    // Find the X/close button (small round button in top-right)
    const allButtons = screen.getAllByRole('button')
    const closeBtn = allButtons.find((btn) =>
      btn.className.includes('rounded-full') && btn.className.includes('text-slate-500')
    )!
    fireEvent.click(closeBtn)
    expect(onEndSession).toHaveBeenCalled()
  })

  it('shows completion screen when timer reaches 0', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)

    // Advance entire duration (60 seconds)
    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(screen.getByText('Session Complete')).toBeInTheDocument()
    expect(screen.getByText('Well done. Take a moment before you go.')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows session summary on completion', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(screen.getByText('Letting Go')).toBeInTheDocument()
    expect(screen.getByText('1 min')).toBeInTheDocument()
    expect(screen.getByText('🌊 Anxious')).toBeInTheDocument()
  })

  it('uses Web Audio API instead of an HTML audio element', () => {
    const { container } = render(<MeditationPlayer activeSession={activeSession} mood={mood} />)
    expect(container.querySelector('audio')).toBeNull()
    expect(AudioContext).toHaveBeenCalled()
  })

  it('calls onComplete when Done is clicked on completion screen', () => {
    const onComplete = vi.fn()
    render(
      <MeditationPlayer
        activeSession={activeSession}
        mood={mood}
        onComplete={onComplete}
      />
    )

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    fireEvent.click(screen.getByText('Done'))
    expect(onComplete).toHaveBeenCalled()
  })
})
