'use client'
import { useEffect, useState } from 'react'
import { SERVICE_LABELS, type Booking } from '@/lib/types'

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function RichiestePage() {
  const [richieste, setRichieste] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [appDate, setAppDate] = useState('')
  const [appTime, setAppTime] = useState('09:00')

  useEffect(() => { fetchRichieste() }, [])

  async function fetchRichieste() {
    setLoading(true)
    const res = await fetch('/api/bookings?status=nuova_richiesta')
    const { data } = await res.json()
    setRichieste((data || []) as Booking[]); setLoading(false)
  }

  function startAccept(id: string) {
    setAppDate(localDateStr(new Date()))
    setAppTime('09:00')
    setConfirmingId(id)
  }

  async function confirmAccept() {
    if (!confirmingId || !appDate) return
    setUpdating(confirmingId)
    const localDt = new Date(`${appDate}T${appTime}:00`)
    const data_appuntamento = localDt.toISOString()
    await fetch(`/api/bookings/${confirmingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'appuntamento_fissato', data_appuntamento }),
    })
    setRichieste((prev) => prev.filter((r) => r.id !== confirmingId))
    setConfirmingId(null); setUpdating(null)
  }

  const todayMin = localDateStr(new Date())

  if (loading) return (
    <div className="p-4 md:p-8"><h1 className="text-2xl font-bold text-white mb-6">Nuove Richieste</h1>
      <div className="space-y-4">{[1,2,3].map((i) => (<div key={i} className="glass p-6 animate-pulse"><div className="h-4 bg-white/10 rounded w-1/3 mb-3"/><div className="h-3 bg-white/5 rounded w-2/3 mb-2"/><div className="h-3 bg-white/5 rounded w-1/2"/></div>))}</div></div>)

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Nuove Richieste</h1>
      <p className="text-sm text-gray-500 mb-6">{richieste.length > 0 ? `${richieste.length} richieste in attesa` : 'Nessuna nuova richiesta'}</p>
      {richieste.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div>
          <p className="text-gray-400 font-medium">Tutto gestito!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {richieste.map((r) => (
            <div key={r.id} className="glass-strong p-5 animate-fade-in-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{r.nome} {r.cognome}</h3>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-medium border border-yellow-500/20">Nuova</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><span className="text-gray-500">Tel: </span><a href={`tel:${r.telefono}`} className="text-primary-400 font-medium hover:underline">{r.telefono}</a></div>
                    <div><span className="text-gray-500">Servizio: </span><span className="font-medium text-gray-200">{SERVICE_LABELS[r.servizio]}</span></div>
                    <div><span className="text-gray-500">Veicolo: </span><span className="font-medium text-gray-200">{r.marca} {r.modello} ({r.anno})</span></div>
                    <div><span className="text-gray-500">Targa: </span><span className="font-medium text-gray-200">{r.targa}</span></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Ricevuta il {new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {confirmingId === r.id ? (
                  <div className="w-full md:w-auto animate-fade-in">
                    <div className="glass p-4 space-y-3 min-w-[240px]">
                      <p className="text-sm font-semibold text-white">Fissa appuntamento</p>
                      <div>
                        <label className="label-glass">Data</label>
                        <input type="date" value={appDate} onChange={(e) => setAppDate(e.target.value)} min={todayMin} className="input-glass text-sm" />
                      </div>
                      <div>
                        <label className="label-glass">Ora</label>
                        <select value={appTime} onChange={(e) => setAppTime(e.target.value)} className="select-glass text-sm">
                          {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
                            '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={confirmAccept} disabled={updating === r.id || !appDate} className="btn-primary text-sm py-2 px-4 flex-1">{updating === r.id ? 'Confermo...' : 'Conferma'}</button>
                        <button onClick={() => setConfirmingId(null)} className="btn-ghost text-sm py-2 px-3">Annulla</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 md:flex-col">
                    <button onClick={() => startAccept(r.id)} disabled={updating === r.id} className="btn-primary text-sm py-2 px-4">{updating === r.id ? 'Accettando...' : 'Accetta'}</button>
                    <a href={`tel:${r.telefono}`} className="btn-ghost text-sm py-2 px-4 text-center">Chiama</a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
