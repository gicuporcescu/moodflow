'use client'

import { useRouter } from 'next/navigation'
import { MeditationPlayer } from './MeditationPlayer'
import type { ActiveSession, Mood } from '@/lib/types'

interface MeditationPlayerClientProps {
  activeSession: ActiveSession
  mood: Mood
}

export default function MeditationPlayerClient({ activeSession, mood }: MeditationPlayerClientProps) {
  const router = useRouter()

  const handleComplete = async () => {
    console.log('Session complete! Logging completion and redirecting to mood check-in...')

    router.push('/mood')
  }

  return (
    <MeditationPlayer
      activeSession={activeSession}
      mood={mood}
      onEndSession={() => router.back()}
      onComplete={handleComplete}
    />
  )
}
