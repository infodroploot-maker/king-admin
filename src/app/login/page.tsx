'use client'
import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o password non corretti.'); setLoading(false); return }
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8 flex flex-col items-center">
          <Image 
            src="/logo.png" 
            alt="Autofficina King" 
            width={240} 
            height={240} 
            className="w-64 h-64 object-contain drop-shadow-[0_0_15px_rgba(251,146,60,0.3)] mb-4"
          />
          <p className="text-sm text-gray-500 font-medium">Pannello Gestione</p>
        </div>
        <div className="glass-strong p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-glass">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@autofficinaking.com" className="input-glass" required />
            </div>
            <div>
              <label htmlFor="password" className="label-glass">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-glass" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Accesso...' : 'Accedi'}
            </button>
          </form>
          {error && <div className="mt-3 glass p-3 border-red-500/20 text-sm text-red-400 text-center animate-fade-in">{error}</div>}
        </div>
      </div>
    </div>
  )
}
