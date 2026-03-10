import Link from 'next/link'

const Footer = () => {
  return (
    <footer 
      className="text-white px-4 sm:px-6 md:px-10 lg:px-20 xl:px-[150px] pt-8 sm:pt-12 pb-4 sm:pb-5 relative bottom-0" 
      id="contact"
      style={{
        background: 'linear-gradient(to bottom, rgba(10, 54, 157, 0.95), #062858)'
      }}
    >
      <div className="w-full mx-auto flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
        {/* Left: Logo (with tagline in image) + subtitle */}
        <div className="flex flex-col gap-0">
          <Link href="/" className="inline-flex items-center no-underline">
            <img
              src="/assets/logos/rentals-logo-footer-tagline.png"
              alt="Rentals.ph - Philippines #1 Property Rental Website"
              className="h-14 sm:h-16 md:h-[72px] w-auto object-contain object-left"
            />
          </Link>
          <p className="text-white font-outfit text-base sm:text-lg font-normal leading-relaxed mt-5 sm:mt-6 max-w-[320px]">
            Unlock the door to your new beginning.
          </p>
        </div>

        {/* Right: Main nav row and contact buttons — all right-aligned */}
        <div className="flex flex-col items-start lg:items-end gap-6 sm:gap-7">
          {/* Main nav: Home, Properties, Agents, Contact Us — single horizontal row */}
          <nav className="flex flex-wrap gap-6 sm:gap-8 lg:gap-10" aria-label="Footer navigation">
            <Link href="/" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Home
            </Link>
            <Link href="/properties" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Properties
            </Link>
            <Link href="/agents" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Agents
            </Link>
            <Link href="/contact" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Contact Us
            </Link>
          </nav>
          {/* Email and WhatsApp buttons — horizontal row */}
          <div className="flex gap-3 sm:gap-4 items-center">
            <a 
              href="mailto:contact@rentals.ph" 
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-outfit text-sm sm:text-base font-normal hover:opacity-90 transition-opacity"
              style={{
                border: '1px solid white'
              }}
              aria-label="Email"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Email</span>
            </a>
            <a 
              href="https://wa.me/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-outfit text-sm sm:text-base font-normal hover:opacity-90 transition-opacity"
              style={{
                border: '1px solid white'
              }}
              aria-label="WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div 
        className="w-full my-4 sm:my-6" 
        style={{ 
          borderTop: '1px solid rgba(229, 231, 235, 0.3)'
        }}
      />

      {/* Bottom section: Copyright on left, Terms/Privacy on right */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Copyright — left-aligned */}
        <p className="text-white font-outfit text-sm sm:text-base font-normal m-0">
          © 2026 Rentals.ph. All rights reserved.
        </p>
        {/* Legal — right-aligned */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <a href="#terms" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
            Terms of Service
          </a>
          <a href="#privacy" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
