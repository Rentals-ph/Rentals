import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-[#0A369D] text-white px-4 sm:px-6 md:px-10 lg:px-20 xl:px-[150px] pt-8 sm:pt-12 pb-4 sm:pb-5 relative bottom-0" id="contact">
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

        {/* Right: Main nav row, legal row, social row — all right-aligned */}
        <div className="flex flex-col items-start lg:items-end gap-6 sm:gap-7">
          {/* Main nav: Home, Properties, News, Contact — single horizontal row */}
          <nav className="flex flex-wrap gap-6 sm:gap-8 lg:gap-10" aria-label="Footer navigation">
            <Link href="/" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Home
            </Link>
            <Link href="/properties" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Properties
            </Link>
            <Link href="/news" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              News
            </Link>
            <Link href="/contact" className="text-white font-outfit text-sm sm:text-base font-normal hover:text-white/90 transition-colors">
              Contact
            </Link>
          </nav>
          {/* Legal — horizontal row */}
          <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <a href="#terms" className="text-white/90 font-outfit text-xs sm:text-sm font-normal hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#privacy" className="text-white/90 font-outfit text-xs sm:text-sm font-normal hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
          {/* Social icons — horizontal row */}
          <div className="flex gap-3 sm:gap-4 items-center">
            <a href="#facebook" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-opacity" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#instagram" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-opacity" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>
            <a href="#whatsapp" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-opacity" aria-label="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/30 w-full my-6 sm:my-8" />

      {/* Copyright — centered below separator */}
      <p className="text-white font-outfit text-sm sm:text-base font-normal text-center m-0 px-4">
        © 2026 Rentals.ph. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
