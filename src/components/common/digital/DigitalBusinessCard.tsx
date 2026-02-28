'use client'

import { ASSETS } from '@/utils/assets'
import { FiMail, FiPhone } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

interface DigitalBusinessCardProps {
  firstName: string
  lastName?: string
  fullName: string
  title: string
  sinceYear: string
  phone: string
  email: string
  image: string
  initials: string
}

function DigitalBusinessCard({
  firstName,
  lastName = '',
  fullName,
  title,
  sinceYear,
  phone,
  email,
  image,
  initials,
}: DigitalBusinessCardProps) {
  const displayLastName = lastName.trim()

  return (
    <div 
      className="relative w-full max-w-[560px] rounded-[1.25rem] overflow-hidden flex flex-row aspect-[1.6] min-h-[300px]"
      style={{
        background: 'linear-gradient(135deg, #0f2d52 0%, #1a4a7a 50%, #0f2d52 100%)',
        boxShadow: '0 8px 24px rgba(15, 45, 82, 0.4), 0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Wave pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q15 10 30 20 T60 20 M0 35 Q20 25 40 35 T60 35 M0 50 Q10 40 30 50 T60 50' stroke='%2359b3f5' fill='none' strokeWidth='1.5' opacity='0.8'/%3E%3Cpath d='M20 0 Q25 15 20 30 T20 60 M35 0 Q40 20 35 40 T35 60 M50 0 Q45 18 50 35 T50 60' stroke='%2359b3f5' fill='none' strokeWidth='1.2' opacity='0.6'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Left: photo, name, title, Since, contacts */}
      <div className="relative z-10 flex-1 flex flex-col p-6 min-w-0">
        <div 
          className="w-20 h-20 rounded-full p-1 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 50%, #fbbf24 100%)' }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#0f2d52]">
            <img
              src={image}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                const next = t.nextElementSibling as HTMLElement
                if (next) next.classList.remove('hidden')
              }}
            />
            <div 
              className="w-full h-full hidden flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #1a4a7a 0%, #0f2d52 100%)' }}
            >
              {initials}
            </div>
          </div>
        </div>
        <h3 className="mt-3 m-0 text-lg font-bold leading-tight truncate">
          <span className="text-white">{firstName}</span>
          {displayLastName && <span className="text-amber-400"> {displayLastName}</span>}
        </h3>
        <p className="m-0 mt-0.5 text-white/95 text-sm font-medium">{title}</p>
        <p className="m-0 text-white/80 text-xs">Since {sinceYear}</p>
        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-white/95">
            <FiPhone className="flex-shrink-0 text-amber-400 text-xs" />
            <span className="text-xs font-medium truncate">{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-white/95">
            <FaWhatsapp className="flex-shrink-0 text-amber-400 text-xs" />
            <span className="text-xs font-medium truncate">{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-white/95">
            <FiMail className="flex-shrink-0 text-amber-400 text-xs" />
            <span className="text-xs font-medium truncate max-w-[180px]">{email}</span>
          </div>
        </div>
      </div>

      {/* Right: logo, QR */}
      <div className="relative z-10 flex flex-col items-center justify-between p-6 border-l border-white/15 flex-shrink-0">
        <div className="flex flex-col items-center">
          <img src={ASSETS.LOGO_HERO_MAIN} alt="Rentals.ph" className="h-10 w-auto object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-24 h-24 rounded-lg bg-white p-1.5 flex items-center justify-center">
            <div 
              className="w-full h-full rounded"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #111 0, #111 2px, transparent 2px, transparent 8px), repeating-linear-gradient(90deg, #111 0, #111 2px, transparent 2px, transparent 8px)',
                backgroundSize: '8px 8px',
              }}
            />
          </div>
          <p className="m-0 text-white/80 text-xs font-medium">Scan to view my profile</p>
        </div>
      </div>
    </div>
  )
}

export default DigitalBusinessCard

