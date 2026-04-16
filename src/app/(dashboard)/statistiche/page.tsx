'use client'

import { useEffect, useState } from 'react'
import { type Booking, type MonthlySnapshot } from '@/lib/types'
import EarningsChart from './EarningsChart'

export default function StatistichePage() {
  const [consegnati, setConsegnati] = useState<Booking[]>([])
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [closing, setClosing] = useState(false)
  const [closeResult, setCloseResult] = useState<{ totale: number; lavori: number; dati?: Booking[] } | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [bRes, sRes] = await Promise.all([
      fetch('/api/bookings?status=consegnato').then(r => r.json()),
      fetch('/api/snapshots').then(r => r.json()),
    ])
    setConsegnati((bRes.data || []) as Booking[]); setSnapshots((sRes.data || []) as MonthlySnapshot[]); setLoading(false)
  }

  const totaleMese = consegnati.reduce((sum, b) => sum + (b.preventivo_euro || 0), 0)
  const numLavori = consegnati.length

  async function handleChiudiMese() {
    setClosing(true)
    try {
      // Salvo i lavori di questo mese prima di eliminarli
      const lavoriDelMese = [...consegnati]
      
      const res = await fetch('/api/month/close', { method: 'POST' }); const result = await res.json()
      if (result.success) {
        setCloseResult({ totale: result.data.totale_euro, lavori: result.data.num_lavori, dati: lavoriDelMese })
        setShowConfirm(false); setShowUndo(true); fetchData()
      }
    } catch { alert('Errore nella chiusura.') }
    setClosing(false)
  }

  const mesiNomi = ['','Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

  function scaricaExcel(lavoriDelMese: Booking[]) {
    // Intestazioni per il file CSV
    const headers = ['Nome', 'Cognome', 'Telefono', 'Marca', 'Modello', 'Targa', 'Data', 'Preventivo']
    // Righe dati
    const rows = lavoriDelMese.map(b => [
      b.nome,
      b.cognome,
      b.telefono,
      b.marca,
      b.modello,
      b.targa,
      b.data_appuntamento || '',
      b.preventivo_euro?.toString() || '0'
    ])
    
    // Converti in CSV
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    // Scarica
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // uFEFF per supporto BOM Excel/UTF8
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `chiusura_mese_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) return (
    <div className="p-4 md:p-8"><h1 className="text-2xl font-bold text-white mb-6">Statistiche</h1>
      <div className="grid grid-cols-2 gap-4">{[1,2].map((i) => (<div key={i} className="glass p-6 animate-pulse"><div className="h-4 bg-white/10 rounded w-1/3 mb-3"/><div className="h-8 bg-white/5 rounded w-1/2"/></div>))}</div></div>)

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Statistiche</h1>
      <p className="text-sm text-gray-500 mb-6">Riepilogo mensile</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-strong p-5"><p className="text-xs text-gray-500 font-medium mb-1">Incasso Mese</p><p className="text-3xl font-bold text-primary-400">€{totaleMese.toFixed(2)}</p></div>
        <div className="glass-strong p-5"><p className="text-xs text-gray-500 font-medium mb-1">Consegnati</p><p className="text-3xl font-bold text-white">{numLavori}</p></div>
      </div>

      {numLavori > 0 && (
        <div className="glass-strong p-5 mb-6">
          <h3 className="font-semibold text-white mb-3">Lavori da Archiviare</h3>
          <div className="divide-y divide-white/[0.06]">
            {consegnati.map((b) => (
              <div key={b.id} className="flex justify-between items-center py-2">
                <div><p className="text-sm font-medium text-gray-200">{b.nome} {b.cognome} — {b.marca} {b.modello}</p><p className="text-xs text-gray-600">{b.targa}</p></div>
                <span className="text-sm font-semibold text-primary-400">{b.preventivo_euro ? `€${b.preventivo_euro.toFixed(2)}` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-6 py-3 rounded-xl transition-all">Chiudi Mese</button>
            ) : (
              <div className="glass p-4 border-red-500/20 animate-fade-in">
                <p className="text-sm text-red-400 font-semibold mb-2">Sei sicuro?</p>
                <p className="text-xs text-gray-500 mb-4">Verranno archiviati {numLavori} lavori per €{totaleMese.toFixed(2)}.</p>
                <div className="flex gap-2">
                  <button onClick={handleChiudiMese} disabled={closing} className="bg-red-500/20 text-red-400 border border-red-500/30 font-medium px-4 py-2 rounded-xl text-sm transition-all">{closing ? 'Chiusura...' : 'Sì, Chiudi'}</button>
                  <button onClick={() => setShowConfirm(false)} className="btn-ghost text-sm py-2">Annulla</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showUndo && closeResult && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 glass p-5 animate-fade-in-up z-50 shadow-2xl shadow-primary-500/10 border-primary-500/20">
          <p className="text-sm font-medium text-white mb-1">Mese archiviato con successo!</p>
          <p className="text-xs text-gray-400 mb-4">{closeResult.lavori} lavori per {closeResult.totale.toFixed(2)} EUR</p>
          
          <p className="text-xs font-semibold text-gray-300 mb-2">Vuoi esportare il riepilogo in Excel?</p>
          <div className="flex gap-2">
            <button onClick={() => { if(closeResult.dati) scaricaExcel(closeResult.dati); setShowUndo(false) }} className="btn-primary text-xs py-2 flex-1">Scarica Excel CSV</button>
            <button onClick={() => setShowUndo(false)} className="bg-white/5 hover:bg-white/10 text-white font-medium text-xs py-2 px-4 rounded-xl transition-all">Chiudi</button>
          </div>
        </div>
      )}

      {snapshots.length > 0 && (
        <EarningsChart snapshots={snapshots} />
      )}
    </div>
  )
}
