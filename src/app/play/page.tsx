import { redirect } from 'next/navigation'
import MeditationPlayerClient from '@/components/meditation-player/MeditationPlayerClient'
import type { ActiveSession, Mood, GuidanceLevel, Duration } from '@/lib/types'
import {moods} from "@/lib/masterdata";

interface Props {
  searchParams: Promise<{
    sessionId?: string
    duration?: string
    guidance?: string
    moodId?: string
  }>
}

export default async function PlayPage({ searchParams }: Props) {
  const params = await searchParams
  const { sessionId, duration, guidance, moodId } = params

  if (!sessionId || !duration || !guidance || !moodId) {
    redirect('/mood')
  }

  const moodRow = moods.find(m => m.id === moodId);

  if (!moodRow) {
    redirect('/mood')
  }

  const activeSession: ActiveSession = {
    id: sessionId,
    title: 'Meditation Session',
    selectedDuration: Number(duration) as Duration,
    selectedGuidance: guidance as GuidanceLevel,
  }


  const mood: Mood = {
    id: moodId,
    label: moodRow.label,
    icon: moodRow.icon,
  }

  return <MeditationPlayerClient activeSession={activeSession} mood={mood} />
}
