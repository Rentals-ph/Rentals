'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ASSETS } from '@/utils/assets'

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-rental-blue-900">
      <Navbar />

      {/* First Row - Contact Us and Form */}
      <section className="w-full pb-8 sm:pb-12 md:pb-5 text-center">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-26 items-stretch pt-4 sm:pt-7 px-2 sm:px-4 md:px-7">
            {/* Left Column - Contact Us with Horizontal Background */}
            <div 
              className="relative overflow-hidden rounded-lg w-full"
              style={{
                backgroundImage: `url(${ASSETS.BG_CONTACT_VERTICAL})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                minHeight: '400px'
              }}
            >
              <div className="absolute inset-0 w-full h-full justify-center items-center flex"></div>
              <div className="relative z-10 pt-8 sm:pt-12 px-4 sm:px-8 md:px-12 pb-4 sm:pb-5 flex flex-col h-full w-full items-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-outfit mb-3 sm:mb-4 text-center">
                  Contact Us
                </h1>
                <p className="text-white font-outfit text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-md text-center px-2">
                  Have questions about a property? Our team is ready to assist. Reach out via WhatsApp or Email for a fast response and expert guidance on your next home.
                </p>
                {/* Contact Person Image */}
                <div className="mt-auto relative">
                  <img 
                    src={ASSETS.CONTACT_PERSON} 
                    alt="Contact person" 
                    className="w-full max-w-md h-auto object-contain mx-auto"
                    style={{ maxHeight: 'clamp(200px, 50vh, 800px)' }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Send us a Message Form */}
            <div className="bg-white p-6 sm:p-8 md:p-12 rounded-lg shadow-lg w-full flex flex-col">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 font-outfit mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 font-outfit text-xs sm:text-sm mb-4 sm:mb-6">
                We would like to hear your feedbacks! just fill out the form below
              </p>
              <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="firstName" className="font-outfit text-sm font-semibold text-gray-800">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                      className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="lastName" className="font-outfit text-sm font-semibold text-gray-800">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                      className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-outfit text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="font-outfit text-sm font-semibold text-gray-800">
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
                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="font-outfit text-sm font-semibold text-gray-800">
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
                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="font-outfit text-sm font-semibold text-gray-800">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about you inquiry..."
                    rows={6}
                    required
                    className="min-h-[120px] resize-y rounded-lg border-2 border-gray-200 bg-white px-4 py-3 font-outfit text-sm outline-none transition-all focus:border-blue-600 focus:shadow-[0px_0px_0px_3px_rgba(32,94,215,0.1)]"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 rounded-lg bg-blue-900 px-6 sm:px-8 py-2.5 sm:py-3 font-outfit text-sm sm:text-base font-semibold text-white transition-all hover:bg-blue-800 hover:shadow-lg"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Second Row - Contact Information (Full Width) */}
      <section className="w-full pb-8 sm:pb-12 md:pb-16">
        <div className="px-4 sm:px-6 md:px-10 lg:px-[150px]">
          <div 
            className="relative overflow-hidden rounded-lg w-full min-h-[400px]"
            style={{
              backgroundImage: `url(${ASSETS.BG_CONTACT_HORIZONTAL})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%'
            }}
          >
            <div className="absolute inset-0 w-full h-full"></div>
            <div className="relative z-10 p-6 sm:p-8 md:p-12 w-full min-h-[400px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Left Side - Contact Information */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-outfit mb-3">
                Contact Information
              </h2>
              <p className="text-white font-outfit text-sm sm:text-base mb-6 sm:mb-8 opacity-90">
                You can also reach us through these channels.
              </p>
              
              <div className="flex flex-col gap-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-outfit text-sm font-semibold mb-1">
                      Phone numbers
                    </p>
                    <p className="text-white font-outfit text-base mb-1">
                      Globe: +639178886298
                    </p>
                    <p className="text-white font-outfit text-base">
                      Landline: (032) 254-8900
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-outfit text-sm font-semibold mb-1">
                      Email Address
                    </p>
                    <p className="text-white font-outfit text-base">
                      official.rentph@gmail.com
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="white" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-outfit text-sm font-semibold mb-1">
                      Office Address
                    </p>
                    <p className="text-white font-outfit text-base mb-1">
                      Rent.ph Headquarters
                    </p>
                    <p className="text-white font-outfit text-base mb-1">
                      Aznar Road Cebu City,
                    </p>
                    <p className="text-white font-outfit text-base">
                      Philippines, 6000
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Follow us on Social Media */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-outfit mb-6 sm:mb-8">
                Follow us on
              </h2>
              <div className="flex gap-4 sm:gap-6">
                {/* Facebook */}
                <a 
                  href="#facebook" 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <svg width="24" height="24" className="sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 17H19.5L20.5 13H18V11.5C18 10.67 18 10 19.25 10H20.5V7.355C20.355 7.245 19.355 7.25 18.25 7.25C15.9 7.25 14.5 8.395 14.5 11.1875V13H12.5V17H14.5V25H18V17Z" fill="white" />
                  </svg>
                </a>

                {/* Instagram */}
                <a 
                  href="#instagram" 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <svg width="24" height="24" className="sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 12C13.79 12 12 13.79 12 16C12 18.21 13.79 20 16 20C18.21 20 20 18.21 20 16C20 13.79 18.21 12 16 12ZM16 18.5C14.62 18.5 13.5 17.38 13.5 16C13.5 14.62 14.62 13.5 16 13.5C17.38 13.5 18.5 14.62 18.5 16C18.5 17.38 17.38 18.5 16 18.5ZM18.75 11.5C18.34 11.5 18 11.84 18 12.25C18 12.66 18.34 13 18.75 13C19.16 13 19.5 12.66 19.5 12.25C19.5 11.84 19.16 11.5 18.75 11.5ZM16 10C19.31 10 22 12.69 22 16C22 19.31 19.31 22 16 22C12.69 22 10 19.31 10 16C10 12.69 12.69 10 16 10Z" fill="white" />
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a 
                  href="#twitter" 
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                  aria-label="X (Twitter)"
                >
                  <svg width="24" height="24" className="sm:w-8 sm:h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 10.5C23.4 10.8 22.8 10.9 22.1 11C22.8 10.6 23.3 9.9 23.6 9.1C22.9 9.4 22.2 9.7 21.4 9.8C20.8 9.1 19.9 8.6 18.9 8.6C16.9 8.6 15.3 10.2 15.3 12.2C15.3 12.4 15.3 12.6 15.4 12.8C12.4 12.6 9.7 11.1 7.7 8.9C7.5 9.3 7.4 9.8 7.4 10.3C7.4 11.3 7.9 12.2 8.6 12.7C8.1 12.6 7.6 12.5 7.2 12.3C7.2 12.3 7.2 12.4 7.2 12.4C7.2 14.2 8.4 15.6 10 15.9C9.8 16 9.6 16 9.4 16C9.2 16 9.1 16 8.9 15.9C9.2 17.3 10.4 18.3 11.9 18.3C10.6 19.2 9 19.7 7.2 19.7C7 19.7 6.8 19.7 6.6 19.7C8.1 20.6 9.9 21.1 11.8 21.1C18.9 21.1 22.9 16.1 22.9 11.8C22.9 11.6 22.9 11.5 22.9 11.3C23.6 10.9 24.2 10.4 24.7 9.8C24.1 10 23.5 10.2 22.8 10.3C23.5 9.9 24 9.3 24.2 8.6C23.6 8.9 22.9 9.2 22.2 9.3C21.6 8.7 20.7 8.3 19.7 8.3C17.6 8.3 15.9 10 15.9 12.1C15.9 12.3 15.9 12.5 15.9 12.7C13.1 12.5 10.6 11.1 8.8 9C8.6 9.4 8.5 9.8 8.5 10.3C8.5 11.2 8.9 12 9.5 12.5C9 12.4 8.6 12.3 8.2 12.1C8.2 12.1 8.2 12.2 8.2 12.2C8.2 13.8 9.3 15.1 10.8 15.4C10.6 15.5 10.4 15.5 10.2 15.5C10 15.5 9.9 15.5 9.7 15.5C9.9 16.5 10.8 17.3 11.9 17.3C11 18 9.9 18.5 8.6 18.5C8.4 18.5 8.2 18.5 8 18.5C9.1 19.2 10.4 19.6 11.8 19.6C19.7 19.6 24.1 15.5 24.1 11.7C24.1 11.6 24.1 11.4 24.1 11.3C24.8 10.9 25.4 10.4 25.9 9.8C25.3 10 24.7 10.2 24 10.3L24 10.5Z" fill="white" />
                  </svg>
                </a>
              </div>
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
