'use client'

import { useEffect, useState, Suspense } from 'react'
import { SERVICE_LABELS, STATUS_CONFIG, type Booking, type BookingStatus } from '@/lib/types'
import DayDrawer from './DayDrawer'

const EDITABLE_STATUSES: BookingStatus[] = ['appuntamento_fissato','in_attesa_consegna','in_lavorazione','pronto_al_ritiro','consegnato']

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = STATUS_CONFIG[status]
  return <span className={`inline-flex items-center gap-1.5 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{c.label}</span>
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

export default function LavoriPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [manualData, setManualData] = useState({ nome: '', cognome: '', telefono: '', targa: '', marca: '', modello: '', anno: '' })
  const [searchQuery, setSearchQuery] = useState('')
  // Stati divisi per edit
  const [editData, setEditData] = useState({ status: '' as BookingStatus, ore_lavoro: '', preventivo_euro: '', note_meccanico: '' })
  const [appDate, setAppDate] = useState('')
  const [appTime, setAppTime] = useState('09:00')

  const now = new Date()
  const todayStr = localDateStr(now)
  const monthDays = getMonthDays(now)

  useEffect(() => { 
    fetchBookings() 
  }, [])

  async function fetchBookings() {
    setLoading(true)
    const res = await fetch('/api/bookings?status=!nuova_richiesta')
    const { data } = await res.json()
    const bData = (data || []) as Booking[]
    setBookings(bData)
    setLoading(false)

    // Se arrivo dalla dashboard con ?edit=ID
    const searchParams = new URLSearchParams(window.location.search)
    const editId = searchParams.get('edit')
    if (editId) {
      const targetBooking = bData.find((b) => b.id === editId)
      if (targetBooking) {
        startEdit(targetBooking)
        // Pulisco l'URL senza ricaricare la pagina
        window.history.replaceState({}, '', '/lavori')
      }
    }
  }

  function startEdit(b: Booking) {
    setEditingId(b.id)
    if (b.data_appuntamento) {
      const dt = new Date(b.data_appuntamento)
      // Estraiamo in locale così neutralizziamo i fusi orari
      setAppDate(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
      
      const hh = String(dt.getHours()).padStart(2, '0')
      const mm = String(dt.getMinutes()).padStart(2, '0')
      setAppTime(`${hh}:${mm}`)
    } else {
      setAppDate(todayStr)
      setAppTime('09:00')
    }
    setEditData({ 
      status: b.status, 
      ore_lavoro: b.ore_lavoro?.toString() || '', 
      preventivo_euro: b.preventivo_euro?.toString() || '', 
      note_meccanico: b.note_meccanico || '' 
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const payload: Record<string, unknown> = { status: editData.status }
    
    if (appDate) {
      // Combina e forza l'interpretazione come ora locale per poi generare un ISO UTC pulito e senza traslature di timezone dal server Supabase
      const localDt = new Date(`${appDate}T${appTime}:00`)
      payload.data_appuntamento = localDt.toISOString()
    } else if (editData.status === 'appuntamento_fissato') {
      // Obbligo di data se lo stato è fissato
      alert("Inserire una data per confermare l'appuntamento.")
      setSaving(false)
      return
    }

    if (editData.ore_lavoro) payload.ore_lavoro = parseFloat(editData.ore_lavoro)
    if (editData.preventivo_euro) payload.preventivo_euro = parseFloat(editData.preventivo_euro)
    if (editData.note_meccanico) payload.note_meccanico = editData.note_meccanico
    
    if (addingNew) {
      if (!manualData.nome || !manualData.targa) {
        alert("Inserire almeno Nome e Targa per il nuovo cliente.");
        setSaving(false);
        return;
      }
      const newPayload = { 
        ...payload, 
        ...manualData,
        servizio: 'altro',
        anno: manualData.anno || '2024'
      }
      try {
        await fetch(`/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPayload) })
      } catch (e) {
        console.error(e)
      }
      setAddingNew(false)
    } else {
      await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    
    setEditingId(null); 
    setSaving(false); 
    fetchBookings()
  }

  function handleAddManualBooking() {
    const dt = selectedDay || new Date()
    setAppDate(localDateStr(dt))
    setAppTime('09:00')
    setEditData({ status: 'appuntamento_fissato', ore_lavoro: '', preventivo_euro: '', note_meccanico: '' })
    setManualData({ nome: '', cognome: '', telefono: '', targa: '', marca: '', modello: '', anno: '' })
    setAddingNew(true)
    setEditingId('new_manual')
  }

  // Filtro ricerca
  const filteredBookings = bookings.filter(b => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return b.nome.toLowerCase().includes(q) || 
           b.cognome.toLowerCase().includes(q) || 
           b.telefono.includes(q) || 
           b.targa.toLowerCase().includes(q)
  })

  // Appuntamenti del mese per il calendario
  const monthBookings = bookings.filter((b) => {
    if (!b.data_appuntamento || b.status === 'consegnato') return false
    const bDate = b.data_appuntamento.split('T')[0]
    return bDate >= localDateStr(monthDays[0]) && bDate <= localDateStr(monthDays[monthDays.length - 1])
  })

  function getBookingsForDay(day: Date): Booking[] {
    const dayStr = localDateStr(day)
    return monthBookings.filter((b) => b.data_appuntamento?.startsWith(dayStr))
      .sort((a, b) => (a.data_appuntamento || '').localeCompare(b.data_appuntamento || ''))
  }

  if (loading) return (
    <div className="p-3 md:p-5"><h1 className="text-xl font-bold text-white mb-4">Lavori</h1>
      <div className="space-y-3">{[1,2,3].map((i) => (<div key={i} className="glass p-4 animate-pulse"><div className="h-4 bg-white/10 rounded w-1/4 mb-2"/><div className="h-3 bg-white/5 rounded w-1/2"/></div>))}</div></div>)

  return (
    <div className="p-3 md:p-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Gestione Lavori</h1>
          <p className="text-xs text-gray-500">{filteredBookings.length} lavori in elenco</p>
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Cerca nome, telefono, targa..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950/50 border border-white/10 text-white text-sm rounded-xl px-4 py-2 pl-10 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
          <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Calendario Mensile */}
      {!searchQuery && (
        <div className="glass-strong p-3 md:p-5 border-primary-500/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Calendario {MONTH_NAMES[now.getMonth()]}</h2>
            <span className="text-primary-400 text-sm font-medium bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
              {now.getFullYear()}
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {DAY_NAMES_SHORT.map(d => (
               <div key={d} className="text-center text-[10px] md:text-xs font-semibold text-gray-500 py-1 uppercase tracking-widest">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 lg:gap-3">
            {monthDays.map((day, i) => {
              const dayStr = localDateStr(day)
              const isToday = dayStr === todayStr
              const dayBookings = getBookingsForDay(day)
              const dayOfWeek = day.getDay()
              
              const colStart = dayOfWeek === 0 ? 7 : dayOfWeek
              const style = i === 0 ? { gridColumnStart: colStart } : {}

              return (
                <div key={i} style={style} 
                  onClick={() => setSelectedDay(day)}
                  className={`rounded-xl p-2 md:p-3 aspect-square transition-all cursor-pointer flex flex-col justify-between items-center relative ${
                    isToday ? 'bg-primary-500/10 border border-primary-500/50 shadow-[0_0_15px_rgba(251,146,60,0.15)]' : 'glass border-white/[0.04] hover:bg-white/[0.06]'
                  }`}
                >
                  <p className={`text-sm md:text-lg font-bold w-full text-left ${isToday ? 'text-primary-400' : 'text-gray-300'}`}>
                     {day.getDate()}
                  </p>
                  
                  {dayBookings.length > 0 && (
                    <div className="w-full mt-auto">
                      <div className="flex sm:hidden justify-center mb-1">
                        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
                      </div>
                      <div className="hidden sm:block text-center text-[10px] md:text-[11px] font-semibold text-white bg-primary-500/20 text-primary-400 py-1 rounded w-full border border-primary-500/20">
                        {dayBookings.length} Lavor{dayBookings.length === 1 ? 'o' : 'i'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 text-sm font-medium">Nessun lavoro trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Form per nuovo inserimento manuale */}
          {editingId === 'new_manual' && (
            <div className="glass border-primary-500/30 p-4 ring-2 ring-primary-500/20 shadow-[0_0_20px_rgba(251,146,60,0.1)] animate-slide-down">
              <h3 className="text-sm font-bold text-primary-400 uppercase tracking-widest mb-4">Nuova Scheda Cliente Offline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <input placeholder="Nome *" className="input-glass text-xs py-2" value={manualData.nome} onChange={(e) => setManualData({...manualData, nome: e.target.value})} />
                  <input placeholder="Cognome" className="input-glass text-xs py-2" value={manualData.cognome} onChange={(e) => setManualData({...manualData, cognome: e.target.value})} />
                  <input placeholder="Telefono" className="input-glass text-xs py-2" value={manualData.telefono} onChange={(e) => setManualData({...manualData, telefono: e.target.value})} />
                  <input placeholder="Targa *" className="input-glass text-xs py-2" value={manualData.targa} onChange={(e) => setManualData({...manualData, targa: e.target.value.toUpperCase()})} />
                  <input placeholder="Marca" className="input-glass text-xs py-2" value={manualData.marca} onChange={(e) => setManualData({...manualData, marca: e.target.value})} />
                  <input placeholder="Modello" className="input-glass text-xs py-2" value={manualData.modello} onChange={(e) => setManualData({...manualData, modello: e.target.value})} />
              </div>
              
              <div className="border-t border-white/[0.04] pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label-glass text-[10px]">Data</label>
                      <input type="date" min={todayStr} value={appDate} onChange={(e) => setAppDate(e.target.value)} className="input-glass text-xs py-1.5"/>
                    </div>
                    <div>
                      <label className="label-glass text-[10px]">Ora</label>
                      <select value={appTime} onChange={(e) => setAppTime(e.target.value)} className="select-glass text-xs py-1.5 min-h-0">
                        {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
                          '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label-glass text-[10px]">Note Meccanico</label>
                    <textarea value={editData.note_meccanico} onChange={(e) => setEditData({...editData, note_meccanico: e.target.value})} placeholder="Dettagli lavoro..." rows={2} className="input-glass text-xs resize-none p-2"/>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => saveEdit('new')} disabled={saving} className="btn-primary text-xs py-2 flex-1">{saving ? 'Creazione...' : 'Crea Scheda'}</button>
                    <button onClick={() => { setEditingId(null); setAddingNew(false); }} className="btn-ghost text-xs py-2 px-4 text-gray-400">Annulla</button>
                  </div>
              </div>
            </div>
          )}

          {filteredBookings.map((b) => (
            <div id={`booking-${b.id}`} key={b.id} className={`glass border-white/[0.04] p-4 transition-all duration-500 ${editingId === b.id ? 'ring-2 ring-primary-500/50 shadow-[0_0_20px_rgba(251,146,60,0.1)]' : ''}`}>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{b.nome} {b.cognome}</h3>
                  <p className="text-[11px] text-gray-500">{b.marca} {b.modello} · {b.targa} · <span className="text-gray-400">{SERVICE_LABELS[b.servizio]}</span></p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 mb-2">
                <span>Tel: <a href={`tel:${b.telefono}`} className="text-primary-400 hover:underline">{b.telefono}</a></span>
                {b.data_appuntamento && <span>Data: {new Date(b.data_appuntamento).toLocaleDateString('it-IT')} ore {new Date(b.data_appuntamento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
                {b.preventivo_euro && <span>{b.preventivo_euro.toFixed(2)} EUR</span>}
                {b.ore_lavoro && <span>{b.ore_lavoro}h</span>}
              </div>
              
              {b.note_meccanico && <div className="bg-amber-500/10 p-2 rounded border border-amber-500/20 mb-2"><p className="text-[10px] text-amber-400"><strong>Note:</strong> {b.note_meccanico}</p></div>}

              {editingId === b.id ? (
                <div className="border-t border-white/[0.04] pt-3 mt-2 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="label-glass text-[10px]">Stato</label>
                      <select value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value as BookingStatus})} className="select-glass text-xs py-1.5 min-h-0">
                        {EDITABLE_STATUSES.map((s) => (<option key={s} value={s}>{STATUS_CONFIG[s].label}</option>))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label-glass text-[10px]">Data</label>
                        <input type="date" min={todayStr} value={appDate} onChange={(e) => setAppDate(e.target.value)} className="input-glass text-xs py-1.5"/>
                      </div>
                      <div>
                        <label className="label-glass text-[10px]">Ora</label>
                        <select value={appTime} onChange={(e) => setAppTime(e.target.value)} className="select-glass text-xs py-1.5 min-h-0">
                          {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
                            '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label-glass text-[10px]">Ore Lavoro</label>
                      <input type="number" step="0.5" min="0" placeholder="3.5" value={editData.ore_lavoro} onChange={(e) => setEditData({...editData, ore_lavoro: e.target.value})} className="input-glass text-xs py-1.5"/>
                    </div>
                    <div>
                      <label className="label-glass text-[10px]">Preventivo (€)</label>
                      <input type="number" step="0.01" min="0" placeholder="250.00" value={editData.preventivo_euro} onChange={(e) => setEditData({...editData, preventivo_euro: e.target.value})} className="input-glass text-xs py-1.5"/>
                    </div>
                  </div>
                  <div>
                    <label className="label-glass text-[10px]">Note per il cliente</label>
                    <textarea value={editData.note_meccanico} onChange={(e) => setEditData({...editData, note_meccanico: e.target.value})} placeholder="es: Trovato freno a mano da sostituire..." rows={2} className="input-glass text-xs resize-none p-2"/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(b.id)} disabled={saving} className="btn-primary text-xs py-1.5 px-4">{saving ? 'Salvataggio...' : 'Salva'}</button>
                    <button onClick={() => { setEditingId(null); setAddingNew(false); }} className="btn-ghost text-xs py-1.5 px-3">Annulla</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => startEdit(b)} className="text-xs text-primary-400 font-medium hover:underline mt-1 bg-primary-500/10 px-2 py-1 rounded">Gestisci Lavoro</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PANNELLO LATERALE ESTERNO (DRAWER) */}
      <DayDrawer 
        isOpen={!!selectedDay}
        day={selectedDay}
        bookings={selectedDay ? getBookingsForDay(selectedDay) : []}
        onClose={() => setSelectedDay(null)}
        onAddManual={handleAddManualBooking}
        onManage={(b) => {
          startEdit(b);
          setTimeout(() => document.getElementById(`booking-${b.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
        }}
      />
    </div>
  )
}
