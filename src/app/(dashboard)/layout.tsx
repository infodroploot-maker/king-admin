import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signOutAction } from '@/lib/actions/auth'

export default async function AdminShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Badge count via API? No, layout is server component, use service_role
  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { count } = await admin.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'nuova_richiesta')
  const newCount = count || 0

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 glass border-0 border-r border-white/[0.06] rounded-none flex-col z-30">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex flex-col items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Autofficina King" 
              width={200} 
              height={200} 
              className="w-40 h-40 object-contain drop-shadow-[0_0_15px_rgba(251,146,60,0.3)] mb-2"
            />
            <p className="text-[10px] text-gray-500 font-medium">Pannello Gestione</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard
          </Link>
          <Link href="/richieste" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            Nuove Richieste
            {newCount > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{newCount}</span>}
          </Link>
          <Link href="/lavori" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            Lavori
          </Link>
          <Link href="/statistiche" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Statistiche
          </Link>
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-xs text-gray-600 mb-2 truncate">{user.email}</p>
          <form action={signOutAction}><button className="text-xs text-gray-500 hover:text-red-400 transition">Disconnetti</button></form>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-40 glass border-0 border-b border-white/[0.06] rounded-none h-20 flex items-center justify-between px-4">
          <div className="flex flex-col">
            <Image 
              src="/logo.png" 
              alt="Autofficina King" 
              width={144} 
              height={144} 
              className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(251,146,60,0.3)]"
            />
          </div>
        <Link href="/richieste" className="relative">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          {newCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{newCount}</span>}
        </Link>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 glass border-0 border-t border-white/[0.06] rounded-none pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center text-gray-500 hover:text-white transition"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg><span className="text-[10px] mt-1">Home</span></Link>
          <Link href="/richieste" className="flex flex-col items-center text-gray-500 hover:text-white transition relative"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg><span className="text-[10px] mt-1">Richieste</span>{newCount > 0 && <span className="absolute -top-1 right-3 bg-red-500 w-2 h-2 rounded-full"/>}</Link>
          <Link href="/lavori" className="flex flex-col items-center text-gray-500 hover:text-white transition"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><span className="text-[10px] mt-1">Lavori</span></Link>
          <Link href="/statistiche" className="flex flex-col items-center text-gray-500 hover:text-white transition"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg><span className="text-[10px] mt-1">Stats</span></Link>
        </div>
      </nav>

      <main className="md:ml-64 pt-24 md:pt-0 pb-20 md:pb-0 min-h-screen">{children}</main>
    </div>
  )
}
