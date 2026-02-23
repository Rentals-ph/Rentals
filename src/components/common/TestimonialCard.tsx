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
    <article className="flex w-[300px] flex-shrink-0 flex-col overflow-visible rounded-xl border border-white/20 bg-white/8 backdrop-blur-lg transition-transform hover:-translate-y-1 sm:w-[360px] xs:w-[240px]">
      <div className="relative h-[400px] w-full overflow-visible sm:h-[340px] xs:h-[160px]">
        <img
          src={avatar}
          alt={name}
          className="h-full w-full rounded-t-xl object-cover"
        />
        <div className="absolute -bottom-5 left-5 z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
            <svg className="h-5.5 w-5.5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 7.5V14H7.5C7.5 15.3807 8.61929 16.5 10 16.5V18.5C7.51472 18.5 5.5 16.4853 5.5 14V7.5H11ZM18.5 7.5V14H15C15 15.3807 16.1193 16.5 17.5 16.5V18.5C15.0147 18.5 13 16.4853 13 14V7.5H18.5Z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-b-xl bg-white px-5 pb-5 pt-5 xs:px-4 xs:pb-4 xs:pt-6">
        <p className="m-0 flex-1 text-justify font-outfit text-lg font-normal italic leading-relaxed text-gray-700 sm:text-base">
          {text}
        </p>
        <div className="mt-auto">
          <h3 className="m-0 mb-0.5 font-outfit text-base font-bold text-gray-900">
            {name}
          </h3>
          <p className="m-0 font-outfit text-base font-normal text-gray-500">
            {role}
          </p>
        </div>
      </div>
    </article>
  )
}

export default TestimonialCard
