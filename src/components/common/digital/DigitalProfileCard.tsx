'use client'

interface DigitalProfileCardProps {
  label?: string
  className?: string
}

function DigitalProfileCard({ label = 'Scan to view my profile', className = '' }: DigitalProfileCardProps) {
  return (
    <div className={`w-full lg:w-1/3 lg:max-w-sm flex flex-col items-center lg:items-end justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className="bg-white rounded-2xl p-4 shadow-xl">
          <div className="aspect-square w-40 md:w-44 lg:w-48 rounded-xl bg-gray-900 flex items-center justify-center">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-md bg-white border-4 border-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 p-1">
                <div className="bg-gray-900" />
                <div className="bg-gray-900 col-start-4 row-start-1" />
                <div className="bg-gray-900 col-start-1 row-start-4" />
                <div className="bg-gray-900 col-start-4 row-start-4" />
                <div className="bg-gray-900 col-start-2 row-start-2" />
                <div className="bg-gray-900 col-start-3 row-start-3" />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs md:text-sm text-blue-100 text-center">
          {label}
        </p>
      </div>
    </div>
  )
}

export default DigitalProfileCard

