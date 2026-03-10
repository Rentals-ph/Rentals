'use client'

import { useState } from 'react'
import Footer from '@/components/layout/Footer'
import { ASSETS } from '@/utils/assets'

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      {/* Hero section - align height with About hero */}
      <section className="w-full relative min-h-[220px] xs:min-h-[260px] sm:min-h-[320px] md:min-h-[400px] flex flex-col overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full z-[1]">
          <img
            src={ASSETS.BG_CONTACT_HORIZONTAL}
            alt="Contact hero background"
            className="w-full h-full object-cover object-center"
          />
          <div
            className="absolute top-0 left-0 w-full h-full z-[2]"
            style={{
              background:
                'linear-gradient(90deg, rgba(0, 0, 0, 0.70) 0%, rgba(0, 0, 0, 0.55) 35%, rgba(0, 0, 0, 0.40) 65%, rgba(0, 0, 0, 0.30) 100%)',
            }}
          />
        </div>

        <div className="relative z-[3] max-w-6xl mx-auto py-10 sm:py-14 md:py-16 w-full flex items-center justify-start flex-1 px-4 sm:px-6 md:px-10 lg:px-0">
          <div className="text-left flex flex-col items-start justify-center max-w-2xl">
            <h1 className="font-outfit font-extrabold text-white tracking-tight leading-tight m-0 text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              CONTACT US
            </h1>
            <p className="max-w-3xl font-outfit text-white m-0 mt-3 text-sm xs:text-base md:text-xl">
              Have questions about a property? Our team is ready to assist. Reach out via WhatsApp or Email
              for a fast response and expert guidance on your next home.
            </p>
          </div>
        </div>
      </section>

      {/* Main content area: contact cards + form, following reference layout */}
      <section className="w-full bg-[#F5F9FF] page-x py-10 sm:py-14 md:py-16">
        <div className="page-w">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 sm:gap-8 lg:gap-10 items-start">
            {/* Left column - stacked contact info cards */}
            <div className="flex flex-col gap-4 sm:gap-5">
              {/* Our Mails */}
              <div className="flex items-center sm:items-stretch gap-4 sm:gap-5 bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#FFF7ED]">
                  <svg className="w-7 h-7 text-[#F97316]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 font-outfit uppercase tracking-[0.14em] mb-1">
                    Our Mails
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-outfit mb-1">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#2563EB] font-outfit break-all">
                    rentals.ph@gmail.com
                  </p>
                </div>
              </div>

              {/* Our Phones */}
              <div className="flex items-center sm:items-stretch gap-4 sm:gap-5 bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#EFF6FF]">
                  <svg className="w-7 h-7 text-[#2563EB]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 font-outfit uppercase tracking-[0.14em] mb-1">
                    Our Phones
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-outfit mb-1">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#2563EB] font-outfit">
                    +1 (7777) 124 2343
                  </p>
                </div>
              </div>

              {/* Our Address */}
              <div className="flex items-center sm:items-stretch gap-4 sm:gap-5 bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#EFF6FF]">
                  <svg className="w-7 h-7 text-[#2563EB]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 font-outfit uppercase tracking-[0.14em] mb-1">
                    Our Address
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 font-outfit mb-1">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#2563EB] font-outfit">
                    Juana Osmeña St, Cebu City, 6000 Cebu, Philippines
                  </p>
                </div>
              </div>
            </div>

            {/* Right column - message form card */}
            <div className="w-full max-w-xl lg:ml-auto">
              <div className="rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.12)] bg-white">
                <div className="bg-[#2563EB] px-5 sm:px-6 py-4">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white font-outfit">
                    Send us a Message
                  </h2>
                </div>
                <div className="px-5 sm:px-6 py-5 sm:py-6 md:py-7">
                  <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label htmlFor="firstName" className="font-outfit text-xs sm:text-sm font-semibold text-gray-800">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                        className="min-h-[44px] rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 font-outfit text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label htmlFor="email" className="font-outfit text-xs sm:text-sm font-semibold text-gray-800">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="min-h-[44px] rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 font-outfit text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label htmlFor="phone" className="font-outfit text-xs sm:text-sm font-semibold text-gray-800">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+63 xxx xxx xxxx"
                        required
                        className="min-h-[44px] rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 font-outfit text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label htmlFor="subject" className="font-outfit text-xs sm:text-sm font-semibold text-gray-800">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        required
                        className="min-h-[44px] rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 font-outfit text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <label htmlFor="message" className="font-outfit text-xs sm:text-sm font-semibold text-gray-800">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={4}
                        required
                        className="min-h-[120px] resize-y rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 font-outfit text-sm outline-none transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>

                    <button
                      type="submit"
                      className="mt-1 min-h-[44px] w-full rounded-md bg-[#2563EB] px-6 py-2.5 font-outfit text-sm sm:text-base font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

