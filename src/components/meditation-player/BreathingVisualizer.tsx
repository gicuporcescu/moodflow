'use client'

interface BreathingVisualizerProps {
  isPlaying: boolean
}

export function BreathingVisualizer({ isPlaying }: BreathingVisualizerProps) {
  return (
    <div className="relative w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center">
      {/* Outer glow ring */}
      <div
        className={`absolute inset-0 rounded-full bg-teal-500/10 ${
          isPlaying ? 'animate-breathe-outer' : ''
        }`}
      />

      {/* Middle ring */}
      <div
        className={`absolute inset-4 rounded-full bg-teal-500/15 ${
          isPlaying ? 'animate-breathe-mid' : ''
        }`}
      />

      {/* Inner core */}
      <div
        className={`absolute inset-10 rounded-full bg-gradient-to-br from-teal-400/40 to-teal-600/30 backdrop-blur-sm border border-teal-400/20 ${
          isPlaying ? 'animate-breathe-inner' : ''
        }`}
      />

      {/* Center dot */}
      <div className="relative w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.6)]" />
    </div>
  )
}
