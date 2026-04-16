import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabaseAdmin.from('bookings').select('*').order('created_at', { ascending: false })
    if (status) {
      if (status.startsWith('!')) {
        query = query.neq('status', status.slice(1))
      } else {
        query = query.eq('status', status)
      }
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })

    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        ...body,
        status: body.status || 'appuntamento_fissato'
      })
      .select().single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 })
  }
}
