import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching course:', error)
  } else {
    console.log('Course columns:', Object.keys(data[0] || {}))
  }
}

test()
