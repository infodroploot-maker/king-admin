'use client'

import { Booking, BookingStatus, STATUS_CONFIG } from '@/lib/types'

interface DayDrawerProps {
  isOpen: boolean
  day: Date | null
  bookings: Booking[]
  onClose: () => void
  onAddManual: () => void
  onManage: (b: Booking) => void
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = STATUS_CONFIG[status]
  return <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.bg} ${c.color}`}>{c.label}</span>
}

export default function DayDrawer({ isOpen, day, bookings, onClose, onAddManual, onManage }: DayDrawerProps) {
  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm px-4" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:max-w-md bg-gray-900 border-l border-white/10 shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gray-900/50 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">
              {day?.toLocaleDateString('it-IT', { weekday: 'long' })}
            </h2>
            <p className="text-sm text-gray-500">
              {day?.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Clienti del giorno</h3>
            <span className="bg-primary-500/10 text-primary-400 text-[10px] px-2 py-0.5 rounded-full border border-primary-500/20">
              {bookings.length} Lavori
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-gray-500 text-sm">Nessun appuntamento in programma.</p>
            </div>
          ) : (
            bookings.map((b) => {
              const time = b.data_appuntamento ? new Date(b.data_appuntamento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
              return (
                <div key={b.id} className="glass p-4 border-white/5 hover:border-primary-500/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-black text-primary-400">{time}</span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="mb-4">
                    <p className="text-white font-bold">{b.nome} {b.cognome}</p>
                    <p className="text-xs text-gray-500">{b.marca} {b.modello} · {b.targa}</p>
                  </div>
                  <button 
                     onClick={() => {
                       onClose(); 
                       onManage(b);
                     }}
                     className="w-full py-2 bg-white/5 hover:bg-primary-500/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all">
                     Gestisci Scheda
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="p-5 bg-gray-950/50 backdrop-blur-xl border-t border-white/10">
          <button 
            onClick={() => { onClose(); onAddManual(); }} 
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
             <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
             Aggiungi Cliente Offline
          </button>
        </div>
      </div>
    </div>
  )
}
