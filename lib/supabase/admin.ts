import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const ASSETS_BUCKET = 'lms-assets'

/** How long a signed read URL stays valid. Long enough to open a document. */
export const SIGNED_URL_TTL_SECONDS = 60 * 15

type UploadKind = 'image' | 'document' | 'any-attachment'

// The stored content type comes from this table, never from the client. An
// uploader that controls Content-Type can host an HTML page on the project's
// own storage origin, which is a ready-made phishing surface.
const ALLOWED: Record<UploadKind, { mime: Record<string, string>; maxBytes: number }> = {
  image: {
    mime: {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
    },
    maxBytes: 8 * 1024 * 1024,
  },
  document: {
    mime: {
      'application/pdf': 'pdf',
    },
    maxBytes: 25 * 1024 * 1024,
  },
  'any-attachment': {
    mime: {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
      'application/zip': 'zip',
    },
    maxBytes: 15 * 1024 * 1024,
  },
}

export class UploadValidationError extends Error {}

/**
 * Uploads to the private assets bucket and returns the storage path.
 *
 * Callers get a path, not a URL: reads go through createSignedAssetUrl so that
 * bank slips and course material are not permanently readable by anyone who
 * has ever seen a link.
 */
export async function uploadToSupabase(
  file: File,
  pathPrefix: string,
  kind: UploadKind = 'any-attachment'
): Promise<string> {
  const rules = ALLOWED[kind]
  const contentType = file.type?.split(';')[0]?.trim().toLowerCase() || ''
  const extension = rules.mime[contentType]

  if (!extension) {
    throw new UploadValidationError(
      `Unsupported file type. Allowed: ${Object.values(rules.mime).join(', ')}`
    )
  }

  if (file.size <= 0) {
    throw new UploadValidationError('File is empty')
  }

  if (file.size > rules.maxBytes) {
    throw new UploadValidationError(
      `File is too large. Maximum size is ${Math.floor(rules.maxBytes / (1024 * 1024))} MB`
    )
  }

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  // The extension is derived from the allowlist, not from the supplied name, so
  // a crafted filename cannot change how the object is served.
  const baseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60) || 'file'
  const path = `${pathPrefix}/${Date.now()}-${baseName}.${extension}`

  const { error } = await admin.storage.from(ASSETS_BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    console.error('Supabase storage upload error:', error.message)
    throw new Error('Upload failed')
  }

  return path
}

/**
 * Signs a stored path for reading.
 *
 * Tolerates values that are already absolute URLs: rows written before the
 * bucket was made private hold public URLs, and material added by hand may
 * point at Google Drive or YouTube.
 */
export async function createSignedAssetUrl(
  storedValue: string | null | undefined
): Promise<string | null> {
  if (!storedValue) return null

  if (/^https?:\/\//i.test(storedValue)) {
    // Legacy public URL or an external link — pass through unchanged.
    return storedValue
  }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(ASSETS_BUCKET)
    .createSignedUrl(storedValue, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    console.error('Failed to sign asset URL:', error?.message)
    return null
  }

  return data.signedUrl
}

/** Signs many paths at once, preserving order. */
export async function createSignedAssetUrls(
  storedValues: (string | null | undefined)[]
): Promise<(string | null)[]> {
  return Promise.all(storedValues.map(createSignedAssetUrl))
}
