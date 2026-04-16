import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })

    const { data: consegnati } = await supabaseAdmin.from('bookings').select('preventivo_euro').eq('status', 'consegnato')
    const now = new Date(); const mese = now.getMonth() + 1; const anno = now.getFullYear()
    const totale = (consegnati || []).reduce((sum, b) => sum + (b.preventivo_euro || 0), 0)
    const numLavori = (consegnati || []).length

    await supabaseAdmin.from('monthly_snapshots').upsert({ mese, anno, totale_euro: totale, num_lavori: numLavori }, { onConflict: 'mese,anno' })
    await supabaseAdmin.from('bookings').delete().eq('status', 'consegnato')

    return NextResponse.json({ success: true, data: { mese, anno, totale_euro: totale, num_lavori: numLavori } })
  } catch { return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 }) }
}
