#!/usr/bin/env tsx
/**
 * Test Supabase Connection
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', SUPABASE_URL?.substring(0, 40) + '...')
console.log('Key:', SUPABASE_SERVICE_KEY ? '✓ Present' : '✗ Missing')
console.log('')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (...args) => {
      console.log('🌐 Making request to:', args[0])
      return fetch(...args)
    }
  }
})

async function testConnection() {
  try {
    console.log('📡 Testing organizations table access...')
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Error:', error.message)
      console.error('Code:', error.code)
      console.error('Details:', error.details)
      console.error('Hint:', error.hint)
      return false
    }

    console.log('✅ Successfully connected to Supabase!')
    console.log('Data:', data)
    return true

  } catch (err: any) {
    console.error('❌ Connection failed:', err.message)
    console.error('Stack:', err.stack)
    return false
  }
}

testConnection()
