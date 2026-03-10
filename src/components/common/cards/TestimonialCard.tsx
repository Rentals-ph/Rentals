interface TestimonialCardProps {
  avatar: string
  text: string
  name: string
  role: string
}

function TestimonialCard({
  avatar,
  text,
  name,
  role,
}: TestimonialCardProps) {
  return (
    <article className="flex w-full flex-col bg-white rounded-lg sm:rounded-xl shadow-sm p-5 sm:p-6 md:pb-10 md:p-7 transition-transform hover:-translate-y-1 touch-manipulation min-h-[220px]">
      {/* Header section with profile, name/role, and quote icon */}
      <div className="relative flex items-start gap-3 mb-4">
        {/* Profile picture - circular, left side */}
        <div className="flex-shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
          />
        </div>
        
        {/* Name and role - next to profile picture */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="m-0 font-outfit text-base sm:text-lg font-bold text-gray-900 truncate">
            {name}
          </h3>
          <p className="m-0 mt-1 font-outfit text-sm sm:text-base font-normal text-gray-500 truncate">
            {role}
          </p>
        </div>
        
        {/* Quote icon - top right corner */}
        <div className="flex-shrink-0 absolute top-0 right-0">
          <div className="flex items-center justify-center">
            <svg 
              className="w-8 h-8 sm:w-8 sm:h-8 text-[#205ED7]" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Testimonial text */}
      <p className="m-0 line-clamp-3 font-outfit text-sm sm:text-base md:text-lg font-normal leading-relaxed text-gray-600">
        {text}
      </p>
    </article>
  )
}

export default TestimonialCard
