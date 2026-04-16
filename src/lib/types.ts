export type BookingStatus = 'nuova_richiesta' | 'appuntamento_fissato' | 'in_attesa_consegna' | 'in_lavorazione' | 'pronto_al_ritiro' | 'consegnato'
export type ServiceType = 'cambio_gomme' | 'carrozzeria' | 'elettrauto' | 'meccanica_generale' | 'tagliando' | 'revisione' | 'diagnosi' | 'altro'
export interface Booking { id: string; created_at: string; nome: string; cognome: string; telefono: string; servizio: ServiceType; marca: string; modello: string; anno: string; targa: string; status: BookingStatus; data_appuntamento: string | null; ore_lavoro: number | null; preventivo_euro: number | null; note_meccanico: string | null; user_id: string | null; }
export interface MonthlySnapshot { id: string; mese: number; anno: number; totale_euro: number; num_lavori: number; created_at: string; }
export const SERVICE_LABELS: Record<ServiceType, string> = { cambio_gomme: 'Cambio Gomme', carrozzeria: 'Carrozzeria', elettrauto: 'Elettrauto', meccanica_generale: 'Meccanica Generale', tagliando: 'Tagliando', revisione: 'Revisione', diagnosi: 'Diagnosi Elettronica', altro: 'Altro' }
export const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: string }> = {
  nuova_richiesta: { label: 'Nuova Richiesta', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: '' },
  appuntamento_fissato: { label: 'Appuntamento Fissato', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: '' },
  in_attesa_consegna: { label: 'In Attesa Consegna', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: '' },
  in_lavorazione: { label: 'In Lavorazione', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: '' },
  pronto_al_ritiro: { label: 'Pronto al Ritiro', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: '' },
  consegnato: { label: 'Consegnato', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: '' },
}
