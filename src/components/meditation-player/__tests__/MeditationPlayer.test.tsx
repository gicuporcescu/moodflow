import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MeditationPlayer } from '../MeditationPlayer'
import type { ActiveSession, Mood } from '@/lib/types'

const activeSession: ActiveSession = {
  id: 'session-001',
  title: 'Letting Go',
  type: 'body scan',
  soundscape: 'Rain',
  selectedDuration: 1, // 1 minute for quick testing
  selectedGuidance: 'light',
}

const mood: Mood = {
  id: 'mood-anxious',
  label: 'Anxious',
  icon: '🌊',
  audioFile: '/audio/anxious.mp3',
}

describe('MeditationPlayer', () => {
  beforeEach(() => {
    // jsdom doesn't implement HTMLMediaElement playback — stub so the
    // player's audio wiring doesn't blow up unrelated tests.
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
    HTMLMediaElement.prototype.pause = vi.fn()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders session title and type', () => {
    render(<MeditationPlayer activeSession={activeSession} mood={mood} />)
    expect(screen.getByText('Letting Go')).toBeInTheDocument()
    expect(screen.getByText('body scan')).toBeInTheDocument()
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
    expect(screen.getByText('Rain')).toBeInTheDocument()
  })

  it('renders an audio element with src derived from mood.audioFile', () => {
    const { container } = render(<MeditationPlayer activeSession={activeSession} mood={mood} />)
    const audio = container.querySelector('audio')
    expect(audio).not.toBeNull()
    expect(audio?.getAttribute('src')).toBe('/audio/anxious.mp3')
    expect(audio?.hasAttribute('loop')).toBe(true)
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
