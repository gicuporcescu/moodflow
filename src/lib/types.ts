export type SessionType = 'sleep' | 'morning' | 'body scan' | 'focus'
export type GuidanceLevel = 'none' | 'light' | 'full'
export type Duration = 5 | 10 | 15 | 30

export interface User {
  id: string
  name: string
  avatarUrl?: string
}

export interface Mood {
  id: string
  label: string
  icon: string
}

export interface Session {
  id: string
  title: string
  type: SessionType
  durations: Duration[]
  guidanceLevels: GuidanceLevel[]
  soundscape: string
  moodIds: string[]
}

export interface ActiveSession {
  id: string
  title: string
  selectedDuration: number
  selectedGuidance: GuidanceLevel
}

export interface CompletedSession {
  id: string
  sessionTitle: string
  sessionType: SessionType
  moodLabel: string
  moodIcon: string
  duration: number
  completedAt: string
}

export interface MoodSummary {
  label: string
  icon: string
}

export interface Stats {
  totalSessions: number
  currentStreak: number
  mostCommonMood: MoodSummary
}
