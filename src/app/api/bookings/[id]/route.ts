import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })

    const body = await request.json()
    const allowedFields = ['status', 'data_appuntamento', 'ore_lavoro', 'preventivo_euro', 'note_meccanico', 'user_id']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) { if (body[key] !== undefined) updateData[key] = body[key] }
    if (Object.keys(updateData).length === 0) return NextResponse.json({ success: false, error: 'Nessun campo' }, { status: 400 })

    const { data, error } = await supabaseAdmin.from('bookings').update(updateData).eq('id', id).select().single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    // Email di notifica al cliente registrato
    const shouldEmail = (
      updateData.status === 'appuntamento_fissato' ||
      updateData.status === 'pronto_al_ritiro'
    )

    if (shouldEmail && data.user_id && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data: { user: clientUser } } = await supabaseAdmin.auth.admin.getUserById(data.user_id)
        
        if (clientUser?.email) {
          // Formatta data appuntamento in modo leggibile (24h)
          let dataAppStr = ''
          if (data.data_appuntamento) {
            const dt = new Date(data.data_appuntamento)
            const giorno = dt.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
            const ora = dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })
            dataAppStr = `${giorno} alle ore ${ora}`
          }

          if (updateData.status === 'appuntamento_fissato') {
            // Email conferma appuntamento
            await resend.emails.send({
              from: 'Autofficina King <onboarding@resend.dev>',
              to: clientUser.email,
              subject: `Appuntamento confermato per ${data.marca} ${data.modello}`,
              html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <h2 style="color:#3B82F6">Appuntamento Confermato!</h2>
                <p>Ciao <strong>${data.nome}</strong>, il tuo appuntamento per la <strong>${data.marca} ${data.modello}</strong> (${data.targa}) è stato confermato.</p>
                ${dataAppStr ? `<p><strong>Data e ora:</strong> ${dataAppStr}</p>` : ''}
                <p><strong>Servizio:</strong> ${data.servizio}</p>
                ${data.note_meccanico ? `<p><strong>Note:</strong> ${data.note_meccanico}</p>` : ''}
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
                <p style="font-size:13px;color:#6B7280">Autofficina King · Tel: 000 000 0000 · Via Roma 1, 00100 Città</p>
              </div>`,
            })
          } else if (updateData.status === 'pronto_al_ritiro') {
            // Email pronto al ritiro
            await resend.emails.send({
              from: 'Autofficina King <onboarding@resend.dev>',
              to: clientUser.email,
              subject: `La tua ${data.marca} ${data.modello} è pronta!`,
              html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <h2 style="color:#16A34A">La tua auto è pronta!</h2>
                <p>Ciao <strong>${data.nome}</strong>, la tua <strong>${data.marca} ${data.modello}</strong> (${data.targa}) è pronta per il ritiro.</p>
                ${data.note_meccanico ? `<p><strong>Note:</strong> ${data.note_meccanico}</p>` : ''}
                ${data.preventivo_euro ? `<p><strong>Importo:</strong> €${data.preventivo_euro}</p>` : ''}
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
                <p style="font-size:13px;color:#6B7280">Autofficina King · Tel: 000 000 0000 · Via Roma 1, 00100 Città</p>
              </div>`,
            })
          }
        }
      } catch (e) { console.error('Email error:', e) }
    }

    return NextResponse.json({ success: true, data })
  } catch { return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 }) }
}
