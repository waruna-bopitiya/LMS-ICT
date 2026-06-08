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

export async function uploadToSupabase(
  file: File,
  path: string
): Promise<string> {
  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const bucketName = 'lms-assets'

  try {
    const { error: getError } = await admin.storage.getBucket(bucketName)
    if (getError) {
      const { error: createError } = await admin.storage.createBucket(bucketName, {
        public: true,
      })
      if (createError) {
        console.warn('Could not create bucket, maybe it already exists:', createError.message)
      }
    }
  } catch (err) {
    console.warn('Error checking/creating bucket:', err)
  }

  const { data, error } = await admin.storage
    .from(bucketName)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })

  if (error) {
    console.error('Supabase storage upload error details:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: urlData } = admin.storage
    .from(bucketName)
    .getPublicUrl(path)

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to retrieve public URL from Supabase')
  }

  return urlData.publicUrl
}

