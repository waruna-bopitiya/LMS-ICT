'use client'

import { useEffect, useRef } from 'react'

interface Dot {
  baseX: number
  baseY: number
  x: number
  y: number
  phase: number
}

export default function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let dots: Dot[] = []
    const spacing = 32
    const mouse = { x: -1000, y: -1000, active: false }

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      initDots(width, height)
    }

    const initDots = (width: number, height: number) => {
      dots = []
      const cols = Math.ceil(width / spacing) + 1
      const rows = Math.ceil(height / spacing) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * spacing
          const baseY = j * spacing
          dots.push({
            baseX,
            baseY,
            x: baseX,
            y: baseY,
            phase: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    resize()

    let time = 0

    const render = () => {
      time += 0.04
      const width = window.innerWidth
      const height = window.innerHeight
      ctx.clearRect(0, 0, width, height)

      const isDark = document.documentElement.classList.contains('dark')
      // Crisp dot colors for light & dark themes
      const dotColor = isDark ? '255, 255, 255' : '30, 41, 59'
      const baseAlpha = isDark ? 0.35 : 0.25

      const maxDist = 130 // Interactive repulsion zone
      const repelForce = 18 // Displacement force

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]

        // 1. Live pulse / breathing animation
        const pulse = Math.sin(time + dot.phase) * 0.4
        const currentRadius = Math.max(1.2, 1.8 + pulse)
        const currentAlpha = Math.max(0.1, baseAlpha + pulse * 0.08)

        // 2. Mouse repulsion effect
        if (mouse.active) {
          const dx = dot.x - mouse.x
          const dy = dot.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDist && dist > 0) {
            const angle = Math.atan2(dy, dx)
            const force = (1 - dist / maxDist) * repelForce
            const targetX = dot.baseX + Math.cos(angle) * force
            const targetY = dot.baseY + Math.sin(angle) * force

            dot.x += (targetX - dot.x) * 0.18
            dot.y += (targetY - dot.y) * 0.18
          } else {
            dot.x += (dot.baseX - dot.x) * 0.10
            dot.y += (dot.baseY - dot.y) * 0.10
          }
        } else {
          dot.x += (dot.baseX - dot.x) * 0.10
          dot.y += (dot.baseY - dot.y) * 0.10
        }

        // 3. Draw high-contrast crisp dot
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, currentRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${dotColor}, ${currentAlpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
    />
  )
}
