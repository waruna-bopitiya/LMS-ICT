'use client'

import { useEffect, useState } from 'react'

const CODE_SEGMENTS = [
  { text: 'const', className: 'text-primary font-semibold' },
  { text: ' ', className: '' },
  { text: 'progress', className: 'text-foreground' },
  { text: ' = ', className: 'text-foreground' },
  { text: 'await', className: 'text-emerald-500 font-semibold' },
  { text: ' student.track(', className: 'text-foreground' },
  { text: "'AL_ICT_2028'", className: 'text-amber-500 font-mono' },
  { text: ')\n', className: '' },
  { text: '// video lessons · notes · past papers · live grading\n', className: 'text-muted-foreground italic' },
  { text: 'return', className: 'text-primary font-semibold' },
  { text: ' progress.', className: 'text-foreground' },
  { text: 'grade', className: 'text-primary font-semibold' },
  { text: ' === ', className: 'text-foreground' },
  { text: "'A'", className: 'text-amber-500 font-mono' },
  { text: ' ✓', className: 'text-emerald-500 font-bold text-sm ml-1' }
]

export default function TypewriterCode() {
  const [charCount, setCharCount] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const totalChars = CODE_SEGMENTS.reduce((sum, seg) => sum + seg.text.length, 0)
    const interval = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= totalChars) {
          setIsPaused(true)
          setTimeout(() => {
            setCharCount(0)
            setIsPaused(false)
          }, 3500) // Pause for 3.5 seconds before typing again
          return prev
        }
        return prev + 1
      })
    }, 45) // 45ms typing speed per character
    return () => clearInterval(interval)
  }, [isPaused])

  let currentPos = 0

  return (
    <div className="rounded-b-xl border border-border bg-card/60 backdrop-blur-md p-5 sm:p-6 text-left font-mono text-[11px] sm:text-sm leading-relaxed shadow-sm min-h-[145px] sm:min-h-[130px] relative select-none overflow-hidden flex flex-col justify-start">
      <p className="break-words">
        {CODE_SEGMENTS.map((seg, idx) => {
          const start = currentPos
          const end = currentPos + seg.text.length
          currentPos = end

          if (charCount <= start) {
            return null
          }

          const visibleText = seg.text.slice(0, charCount - start)
          if (visibleText.includes('\n')) {
            const parts = visibleText.split('\n')
            return (
              <span key={idx} className={seg.className}>
                {parts.map((part, pIdx) => (
                  <span key={pIdx}>
                    {part}
                    {pIdx < parts.length - 1 && <br />}
                  </span>
                ))}
              </span>
            )
          }

          return (
            <span key={idx} className={seg.className}>
              {visibleText}
            </span>
          )
        })}
        <span className="animate-pulse bg-primary ml-1 inline-block h-3.5 w-1.5 align-middle" />
      </p>
    </div>
  )
}
