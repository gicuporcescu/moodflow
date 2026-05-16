'use client'

import { MoodCard } from './MoodCard'
import {QuickStartOverlay} from "./QuickStartOverlay";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {moods} from "@/lib/masterdata";
import {Mood} from "@/lib/types";

export function MoodCheckIn() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<Mood|null>(null)

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Subtle heading */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 tracking-widest uppercase mb-8">
          How are you feeling?
        </p>

        {/* Mood grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {moods.map((mood) => (
            <MoodCard
              key={mood.id}
              icon={mood.icon}
              label={mood.label}
              onSelect={() => setSelectedMood(mood)}
            />
          ))}
        </div>
      </div>

      {/* Quick-start overlay */}
      {selectedMood && (
        <QuickStartOverlay
            session={{
                id: 'session-1',
                moodIds: ['1', '2'],
                durations: [5, 10, 15],
                guidanceLevels: ['none', 'light', 'full'],
                soundscape: 'Rain',
                title: 'Relaxing Rain',
                type: 'sleep',
            }}
            onStart={(duration, guidance) => {
              console.log('Start session with duration:', duration, 'and guidance:', guidance, selectedMood);

              router.push(`/play?sessionId=session-1&duration=${duration}&guidance=${guidance}&moodId=${selectedMood.id}`)
            }}
            onClose={() => setSelectedMood(null)}
        />
      )}
    </div>
  )
}
