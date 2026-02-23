import { ASSETS } from '@/utils/assets'

const Partners = () => {
  return (
    <section className=" relative">
      <div className="w-full">
        <h2 className="text-center font-outfit text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Our Partners
        </h2>
        <div className="overflow-hidden w-full relative h-[auto]">
          <div className="flex w-max animate-[partners-scroll_18s_linear_infinite] items-center gap-12">
            <img src={ASSETS.PARTNER_1} alt="Partner 1" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_2} alt="Partner 2" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_3} alt="Partner 3" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_1} alt="Partner 4" className="h-20 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            {/* Duplicate for seamless loop */}
            <img src={ASSETS.PARTNER_1} alt="Partner 1" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_2} alt="Partner 2" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_3} alt="Partner 3" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
            <img src={ASSETS.PARTNER_1} alt="Partner 4" className="h-40 w-auto object-contain grayscale-[0.2] opacity-85 transition-all hover:grayscale-0 hover:opacity-100" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Partners