import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })

    const { data, error } = await supabaseAdmin.from('monthly_snapshots').select('*').order('anno', { ascending: false }).order('mese', { ascending: false }).limit(12)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch { return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 }) }
}
