'use client'

import { useRef, useState } from 'react'

export default function SecureVideoPlayer({
  videoId,
  title,
  youtubeId,
  initialProgress,
}: {
  videoId: string
  title: string
  youtubeId: string | null
  initialProgress: number
}) {
  const [progress, setProgress] = useState(initialProgress)
  const [playerError, setPlayerError] = useState('')
  const lastUpdateRef = useRef(0)

  const updateProgress = async (percentage: number) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < 5000) return
    lastUpdateRef.current = now

    await fetch('/api/student/video-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, percentage }),
    })
  }

  const handleVideoProgress = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    if (!video.duration) return

    const percentage = Math.round((video.currentTime / video.duration) * 100)
    setProgress(percentage)
    updateProgress(percentage)
  }

  const blockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div onContextMenu={blockContextMenu}>
      <div className="aspect-video bg-secondary/20 relative select-none">
        {youtubeId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&controls=1&disablekb=1&playsinline=1`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin"
            className="w-full h-full"
            onLoad={() => setPlayerError('')}
          />
        ) : (
          <video
            src={`/api/student/videos/${videoId}/stream`}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={blockContextMenu}
            onTimeUpdate={handleVideoProgress}
            onCanPlay={() => setPlayerError('')}
            onError={() => setPlayerError('Video could not be loaded. Please refresh or ask admin to re-upload the file.')}
            className="w-full h-full"
          />
        )}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-6 text-center">
            <p className="text-sm text-destructive">{playerError}</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {progress >= 80 && (
        <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
            Great! You&apos;ve watched most of this video.
          </p>
        </div>
      )}
    </div>
  )
}
