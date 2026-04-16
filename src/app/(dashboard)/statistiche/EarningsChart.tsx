'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { type MonthlySnapshot } from '@/lib/types'

const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export default function EarningsChart({ snapshots }: { snapshots: MonthlySnapshot[] }) {
  const currentYear = new Date().getFullYear()
  
  // Costruisce i dati per l'intero anno corrente
  const data = MESI.map((meseStr, idx) => {
    // Array dei mesi parte da 1 per gennaio nel DB
    const monthIndex = idx + 1
    const snapshot = snapshots.find(s => s.anno === currentYear && s.mese === monthIndex)
    
    return {
      name: meseStr,
      Guadagni: snapshot ? Number(snapshot.totale_euro) : 0,
    }
  })

  // Tooltip customizzato per mantenere il tema "Glassmorphism"
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong p-3 border-primary-500/30 shadow-[0_0_20px_rgba(251,146,60,0.15)]">
          <p className="text-gray-400 text-xs font-semibold uppercase mb-1">{label} {currentYear}</p>
          <p className="text-primary-400 font-bold text-lg">€ {payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="glass-strong p-4 md:p-6 mt-6">
      <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Andamento Fiscale {currentYear}
      </h3>
      
      <div className="h-[200px] sm:h-[250px] md:h-[350px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGuadagni" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FB923C" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
              minTickGap={5}
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              width={65}
              tickFormatter={(value) => `€${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="Guadagni" 
              stroke="#FB923C" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorGuadagni)" 
              activeDot={{ r: 6, fill: '#FB923C', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
