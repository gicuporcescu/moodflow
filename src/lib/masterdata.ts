import {Mood} from "@/lib/types";

export const moods = [
    { id: 'mood-calm', label: 'Calm', icon: '🌿', audioFile: '/audio/calm.mp3' },
    { id: 'mood-anxious', label: 'Anxious', icon: '🌊', audioFile:  '/audio/calm.mp3' },
    { id: 'mood-tired', label: 'Tired', icon: '🌙', audioFile:  '/audio/calm.mp3' },
    { id: 'mood-energized', label: 'Energized', icon: '⚡', audioFile:  '/audio/calm.mp3' },
    { id: 'mood-focused', label: 'Focused', icon: '🎯', audioFile:  '/audio/calm.mp3' },
    { id: 'mood-restless', label: 'Restless', icon: '💨', audioFile:  '/audio/calm.mp3' },
] as Mood[]
