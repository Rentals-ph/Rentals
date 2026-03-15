'use client'

import { useState } from 'react'
import { ASSETS } from '@/shared/utils/assets'
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'
import DigitalBusinessCard from './DigitalBusinessCard'

interface FlippableBusinessCardProps {
  /** Personal card props */
  firstName: string
  lastName?: string
  fullName: string
  title: string
  sinceYear: string
  phone: string
  email: string
  image: string
  initials: string
  profileUrl?: string
  /** Agency / company info for the front side */
  companyName?: string
  companyImage?: string | null
  officeAddress?: string
  /** PRC license number shown on front */
  licenseNumber?: string
}

function FlippableBusinessCard({
  firstName,
  lastName,
  fullName,
  title,
  sinceYear,
  phone,
  email,
  image,
  initials,
  profileUrl,
  companyName,
  companyImage,
  officeAddress,
  licenseNumber,
}: FlippableBusinessCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => setIsFlipped((prev) => !prev)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card container with perspective */}
      <div
        className="w-full max-w-[560px] aspect-[1.6] min-h-[300px] cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleFlip()
          }
        }}
        aria-label={isFlipped ? 'Click to see company side' : 'Click to see contact side'}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ─── FRONT SIDE: Agency / Company ─── */}
          <div
            className="absolute inset-0 rounded-[1.25rem] overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div
              className="relative w-full h-full flex flex-col items-center justify-center p-8"
              style={{
                background: 'linear-gradient(135deg, #0f2d52 0%, #1a4a7a 40%, #245d94 70%, #0f2d52 100%)',
                boxShadow: '0 8px 24px rgba(15, 45, 82, 0.4), 0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* Decorative wave pattern */}
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25 Q20 10 40 25 T80 25 M0 45 Q25 30 50 45 T80 45 M0 65 Q15 50 40 65 T80 65' stroke='%2359b3f5' fill='none' strokeWidth='1.5' opacity='0.9'/%3E%3C/svg%3E")`,
                }}
              />

              {/* Gold accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #eab308 50%, #fbbf24 100%)' }} />

              {/* Company logo / image */}
              <div className="relative z-10 flex flex-col items-center gap-4">
                {companyImage ? (
                  <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm p-2 flex items-center justify-center border border-white/20">
                    <img
                      src={companyImage}
                      alt={companyName || 'Company'}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.style.display = 'none'
                        const next = t.nextElementSibling as HTMLElement
                        if (next) next.classList.remove('hidden')
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center">
                      <HiOutlineOfficeBuilding className="text-white/60 text-4xl" />
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <HiOutlineOfficeBuilding className="text-white/60 text-4xl" />
                  </div>
                )}

                {/* Company name */}
                <h2 className="m-0 text-xl md:text-2xl font-bold text-white text-center leading-tight max-w-[400px]">
                  {companyName || 'Independent Agent'}
                </h2>

                {/* Divider */}
                <div className="w-16 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }} />

                {/* Agent name + title */}
                <div className="flex flex-col items-center gap-0.5">
                  <p className="m-0 text-amber-400 text-sm font-semibold">{fullName}</p>
                  <p className="m-0 text-white/80 text-xs">{title}</p>
                </div>

                {/* Address & license */}
                <div className="flex flex-col items-center gap-1 mt-1">
                  {officeAddress && (
                    <div className="flex items-center gap-1.5 text-white/70">
                      <FiMapPin className="text-amber-400/80 text-xs flex-shrink-0" />
                      <span className="text-xs text-center max-w-[300px] truncate">{officeAddress}</span>
                    </div>
                  )}
                  {licenseNumber && (
                    <p className="m-0 text-white/50 text-[10px] tracking-wide uppercase">
                      PRC License #{licenseNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Rentals.ph branding at bottom */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <img src={ASSETS.LOGO_HERO_MAIN} alt="Rentals.ph" className="h-6 w-auto object-contain opacity-60" />
              </div>
            </div>
          </div>

          {/* ─── BACK SIDE: Personal Contact Card ─── */}
          <div
            className="absolute inset-0 rounded-[1.25rem] overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <DigitalBusinessCard
              firstName={firstName}
              lastName={lastName}
              fullName={fullName}
              title={title}
              sinceYear={sinceYear}
              phone={phone}
              email={email}
              image={image}
              initials={initials}
              profileUrl={profileUrl}
            />
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <p className="m-0 text-xs text-gray-400 select-none animate-pulse">
        {isFlipped ? 'Click to see company side' : 'Click to see contact details'}
      </p>
    </div>
  )
}

export default FlippableBusinessCard
