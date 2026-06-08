'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, X, AlertCircle } from 'lucide-react'

interface SecurePdfViewerProps {
  title: string
  fileUrl: string
  watermark: string
}

export default function SecurePdfViewer({
  title,
  fileUrl,
  watermark,
}: SecurePdfViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' })

  // Convert Google Drive share links to preview link so it embeds correctly in iframe
  const getEmbedUrl = (url: string) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([^/]+)/)
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`
      }
    }
    return url
  }

  const embedUrl = getEmbedUrl(fileUrl)

  // Move watermark around randomly to prevent screen recording/captures
  useEffect(() => {
    if (!isOpen) return

    const timer = setInterval(() => {
      const randomTop = Math.floor(Math.random() * 75) + 10 // 10% to 85%
      const randomLeft = Math.floor(Math.random() * 75) + 10 // 10% to 85%
      setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` })
    }, 5000)

    return () => clearInterval(timer)
  }, [isOpen])

  const blockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <>
      <Card
        onClick={() => setIsOpen(true)}
        className="glass-panel border-border hover:shadow-md hover:border-primary/30 transition-all duration-300 rounded-xl overflow-hidden h-full cursor-pointer group"
      >
        <CardContent className="p-5 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">SECURE PDF NOTE</span>
            <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate mt-0.5">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Click to open securely</p>
          </div>
        </CardContent>
      </Card>

      {/* Full-screen Overlay Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-200"
          onContextMenu={blockContextMenu}
        >
          <div className="relative w-full max-w-5xl h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-secondary/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5.5 w-5.5 text-rose-500" />
                <h3 className="font-bold text-foreground truncate max-w-md sm:max-w-xl text-base sm:text-lg">
                  {title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body / Iframe Viewer Container */}
            <div className="flex-1 bg-secondary/15 relative overflow-hidden">
              
              {/* PDF Iframe */}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0 select-none"
                allow="autoplay"
                title={title}
              />

              {/* Watermark Overlay (floating dynamically) */}
              {watermark && (
                <div
                  style={{
                    position: 'absolute',
                    top: watermarkPos.top,
                    left: watermarkPos.left,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: 0.18,
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    zIndex: 40,
                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                    transition: 'top 2s ease-in-out, left 2s ease-in-out',
                    transform: 'rotate(-15deg)',
                  }}
                  className="bg-black/25 px-3 py-1 rounded-md border border-white/10 select-none tracking-widest font-mono"
                >
                  {watermark} (I See ICT)
                </div>
              )}

              {/* Prevent interaction covering layer to block right clicks and saves */}
              <div 
                className="absolute inset-0 z-30 pointer-events-none" 
                style={{ background: 'transparent' }}
              />

            </div>

            {/* Modal Footer warning */}
            <div className="p-4 border-t border-border bg-secondary/10 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <AlertCircle className="h-4 w-4 text-primary shrink-0" />
              <span>Warning: Document downloads are disabled. This document is watermarked with your registration ID: {watermark}. Sharing is strictly monitored.</span>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
