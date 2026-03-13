import { ASSETS } from '@/utils/assets'

const Partners = () => {
  return (
    <section className="relative w-full bg-[#062858] min-h-[500px] flex flex-col items-center justify-center overflow-hidden py-24">

      {/* SVG Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <svg
          className="w-full max-h-[400px] min-h-[300px] object-fill sm:object-cover origin-top"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Orange Curve */}
          <path d="M0 250 Q 720 -50 1440 250 L 1440 600 L 0 600 Z" fill="#F37324" />

          {/* Light Blue Curve */}
          <path d="M0 330 Q 720 30 1440 330 L 1440 600 L 0 600 Z" fill="#EBEFF2" />

          {/* White Curve */}
          <path d="M0 430 Q 720 130 1440 430 L 1440 600 L 0 600 Z" fill="#FFFFFF" />

          {/* Top Right Concentric Circles */}
          <circle cx="1400" cy="50" r="70" stroke="white" strokeWidth="2" strokeOpacity="0.4" fill="none" />
          <circle cx="1400" cy="50" r="95" stroke="white" strokeWidth="2" strokeOpacity="0.3" fill="none" />
          <circle cx="1400" cy="50" r="120" stroke="white" strokeWidth="2" strokeOpacity="0.2" fill="none" />

          {/* Bottom Left Concentric Circles */}
          <circle cx="40" cy="500" r="100" stroke="#000000" strokeWidth="2" strokeOpacity="0.05" fill="none" />
          <circle cx="40" cy="500" r="130" stroke="#000000" strokeWidth="2" strokeOpacity="0.04" fill="none" />
          <circle cx="40" cy="500" r="160" stroke="#000000" strokeWidth="2" strokeOpacity="0.03" fill="none" />
        </svg>
      </div>

      {/* Content Layer */}
      <div className="relative bg-white z-10 w-full lg:px-[150px] mx-auto px-4 text-center mt-32 sm:mt-48 pb-10">
        <h2 className="font-outfit font-extrabold text-4xl sm:text-5xl tracking-tight leading-tight mb-2">
          <span className="text-[#2563eb]">OUR</span> <span className="text-[#f97316]">PARTNERS</span>
        </h2>
        <p className="font-outfit text-xl sm:text-2xl font-light text-gray-400 tracking-wide mb-12 sm:mb-16">
          Building dreams, together.
        </p>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="flex w-max animate-[partners-scroll_18s_linear_infinite] items-center gap-12 sm:gap-20 pr-12 sm:pr-20">
            {/* First Set */}
            <img src={ASSETS.PARTNER_1} alt="Taft Properties" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_2} alt="Cebu Landmasters" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_3} alt="Primeworld" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_5} alt="Partner 4" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />

            {/* Duplicate Set for Seamless Loop */}
            <img src={ASSETS.PARTNER_1} alt="Taft Properties" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_2} alt="Cebu Landmasters" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_3} alt="Primeworld" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
            <img src={ASSETS.PARTNER_5} alt="Partner 4" className="h-16 sm:h-20 lg:h-24 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partners