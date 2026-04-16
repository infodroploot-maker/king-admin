import Link from 'next/link'
import { type Booking } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'
import { SERVICE_LABELS } from '@/lib/types'

const STATUS_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  nuova_richiesta: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Nuova' },
  appuntamento_fissato: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Fissato' },
  in_attesa_consegna: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Attesa' },
  in_lavorazione: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Lavoro' },
  pronto_al_ritiro: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Pronto' },
  consegnato: { color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', label: 'Fatto' },
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMonthDays(today: Date) {
  const days = []
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  return days
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default async function AdminDashboard() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: allBookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
  const bookings = (allBookings || []) as Booking[]

  const now = new Date()
  const todayStr = localDateStr(now)

  const nuove = bookings.filter((b) => b.status === 'nuova_richiesta').length
  const inLavoro = bookings.filter((b) => b.status === 'in_lavorazione').length
  const pronte = bookings.filter((b) => b.status === 'pronto_al_ritiro').length
  const consegnate = bookings.filter((b) => b.status === 'consegnato').length
  const totale = bookings.filter((b) => b.status === 'consegnato' && b.preventivo_euro).reduce((sum, b) => sum + (b.preventivo_euro || 0), 0)

  // Lavori di oggi
  const todayBookings = bookings.filter((b) =>
    b.data_appuntamento && b.data_appuntamento.startsWith(todayStr) && b.status !== 'consegnato'
  )



  return (
    <div className="p-4 md:p-8">
      {/* Header con data */}
      <div className="mb-8">
        <p className="text-xs font-medium text-primary-400 uppercase tracking-wider mb-1">
          {DAY_NAMES_SHORT[(now.getDay() + 6) % 7]}, {now.getDate()} {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Link href="/richieste" className="glass-strong p-3 md:p-4 hover:bg-white/[0.15] cursor-pointer transition-all group">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-0.5 md:mb-1">Nuove Richieste</p>
          <p className="text-xl md:text-2xl font-bold text-yellow-400">{nuove}</p>
          {nuove > 0 && <span className="text-[9px] text-yellow-400 mt-0.5 block">Da gestire</span>}
        </Link>
        <Link href="/lavori" className="glass-strong p-3 md:p-4 hover:bg-white/[0.15] cursor-pointer transition-all">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-0.5 md:mb-1">In Lavorazione</p>
          <p className="text-xl md:text-2xl font-bold text-red-400">{inLavoro}</p>
        </Link>
        <div className="glass-strong p-3 md:p-4">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-0.5 md:mb-1">Pronte al Ritiro</p>
          <p className="text-xl md:text-2xl font-bold text-green-400">{pronte}</p>
        </div>
        <Link href="/statistiche" className="glass-strong p-3 md:p-4 hover:bg-white/[0.15] cursor-pointer transition-all">
          <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-0.5 md:mb-1">Incasso Mese</p>
          <p className="text-xl md:text-2xl font-bold text-primary-400">{totale.toFixed(0)} EUR</p>
          <span className="text-[9px] text-gray-600 block">{consegnate} consegnate</span>
        </Link>
      </div>

      {/* Lavori di Oggi */}
      <div className="glass-strong p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-white">Oggi</h2>
            <p className="text-xs text-gray-500">{todayBookings.length > 0 ? `${todayBookings.length} appuntamenti` : 'Nessun appuntamento'}</p>
          </div>
          <Link href="/lavori" className="text-xs text-primary-400 font-medium hover:underline">Vedi tutti</Link>
        </div>
        {todayBookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">Nessun appuntamento per oggi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((b) => {
              const badge = STATUS_BADGE[b.status] || STATUS_BADGE.nuova_richiesta
              const time = b.data_appuntamento ? new Date(b.data_appuntamento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'
              return (
                <div key={b.id} className="flex items-center gap-4 py-3 border-b border-white/[0.06] last:border-0">
                  <div className="w-14 h-14 glass rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white leading-none">{time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.nome} {b.cognome}</p>
                    <p className="text-xs text-gray-500">{b.marca} {b.modello} · {SERVICE_LABELS[b.servizio]}</p>
                  </div>
                  <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.bg} ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>


    </div>
  )
}
