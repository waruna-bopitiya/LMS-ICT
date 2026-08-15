'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Exchanges a private storage path for a short-lived signed URL.
 *
 * Values that are already absolute URLs (rows written before the bucket was
 * made private, or hand-entered Google Drive links) are passed through, so the
 * same components work either way.
 */
export function useSignedAssetUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(
    path && /^https?:\/\//i.test(path) ? path : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const sign = useCallback(async () => {
    if (!path || /^https?:\/\//i.test(path)) return

    setLoading(true)
    setError(false)

    try {
      const response = await fetch('/api/assets/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })

      if (!response.ok) throw new Error('Failed to sign asset')

      const data = await response.json()
      setUrl(data.url)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    if (path && /^https?:\/\//i.test(path)) {
      setUrl(path)
      return
    }
    setUrl(null)
    void sign()
  }, [path, sign])

  return { url, loading, error, refresh: sign }
}

export function AssetLink({
  path,
  children,
  className,
}: {
  path: string | null | undefined
  children: React.ReactNode
  className?: string
}) {
  const { url, loading, error } = useSignedAssetUrl(path)

  if (loading) {
    return <span className={className}>Preparing link…</span>
  }

  if (error || !url) {
    return <span className={className}>Unavailable</span>
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  )
}

export function AssetImage({
  path,
  alt,
  className,
}: {
  path: string | null | undefined
  alt: string
  className?: string
}) {
  const { url, loading, error } = useSignedAssetUrl(path)

  if (loading) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center text-xs text-muted-foreground`}>
        Loading…
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center text-xs text-muted-foreground`}>
        Slip unavailable
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />
}
