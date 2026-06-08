import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCourseDescription(rawDescription: string | null) {
  if (!rawDescription) return { description: '', imageUrl: null }
  const parts = rawDescription.split('||image_url||')
  return {
    description: parts[0]?.trim() || '',
    imageUrl: parts[1]?.trim() || null
  }
}

export function formatCourseDescription(description: string, imageUrl: string | null) {
  const cleanDesc = description.replace(/\|\|image_url\|\|.*/g, '').trim()
  if (!imageUrl) return cleanDesc
  return `${cleanDesc} ||image_url||${imageUrl.trim()}`
}

export function parseVideoTitle(rawTitle: string | null) {
  if (!rawTitle) return { title: '', thumbnailUrl: null }
  const parts = rawTitle.split('||thumbnail_url||')
  return {
    title: parts[0]?.trim() || '',
    thumbnailUrl: parts[1]?.trim() || null
  }
}

export function formatVideoTitle(title: string, thumbnailUrl: string | null) {
  const cleanTitle = title.replace(/\|\|thumbnail_url\|\|.*/g, '').trim()
  if (!thumbnailUrl) return cleanTitle
  return `${cleanTitle} ||thumbnail_url||${thumbnailUrl.trim()}`
}


