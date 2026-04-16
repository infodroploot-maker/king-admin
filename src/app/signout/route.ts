import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function logout(request: NextRequest) {
  const supabase = await createClient()
  const { nextUrl: { origin } } = request
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', origin))
}

export async function POST(request: NextRequest) { return logout(request) }
export async function GET(request: NextRequest) { return logout(request) }
