#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function main() {
  const { data } = await supabase
    .from('organizations')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(15)

  console.log('Recent organizations:')
  data?.forEach(o => console.log(`  - ${o.name} (${o.id})`))
}

main()
