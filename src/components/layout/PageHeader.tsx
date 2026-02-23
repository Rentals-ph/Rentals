interface PageHeaderProps {
  title: string
}

const PageHeader = ({ title }: PageHeaderProps) => {
  return (
    <div className="relative bg-rental-blue-600 px-6 md:px-10 lg:px-[var(--page-padding-desktop)] py-8 md:py-10 overflow-hidden min-h-[70px] md:min-h-[90px] lg:min-h-[115px] flex items-center w-full shadow-md">
      <div className="relative z-[2] max-w-[var(--page-max-width)] mx-auto w-full">
        <h1 className="font-inter text-xl md:text-[32px] lg:text-[28px] font-bold italic text-white m-0 uppercase tracking-wide">
          {title}
        </h1>
      </div>
      
      {/* Diagonal Accent - White and Orange */}
      <div className="absolute top-0 right-0 w-full h-full z-[1] pointer-events-none">
        {/* White stripe */}
        <div 
          className="absolute top-0 right-0 w-full h-full bg-white z-[2]"
          style={{ clipPath: 'polygon(100% 0%, calc(100% - 50px) 0%, calc(100% - 130px) 100%, calc(100% - 75px) 100%)' }}
        />
        {/* Orange stripe */}
        <div 
          className="absolute top-0 right-0 left-0 w-full h-full bg-rental-orange-500 z-[1]"
          style={{ clipPath: 'polygon(calc(100% - 50px) 0%, 100% 0%, 100% 100%, calc(100% - 130px) 100%)' }}
        />
      </div>
    </div>
  )
}

export default PageHeader

