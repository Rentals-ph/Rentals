/**
 * Message Bubble Component
 * Displays chat messages from user or AI assistant
 */

import React from 'react'
import { getAsset } from '@/utils/assets'
import type { ListingAssistantMessage } from '../../types/listingAssistant'

interface MessageButton {
  label: string
  value: string | number
  onClick: () => void
  variant?: 'default' | 'selected' | 'primary' | 'success'
}

interface MessageBubbleProps {
  message: ListingAssistantMessage
  isLatest?: boolean
  buttons?: MessageButton[]
}

export function MessageBubble({ message, isLatest = false, buttons }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : ''

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}
    >
      {isUser ? (
        <div className="max-w-[90%] sm:max-w-[85%] p-3 px-4 bg-gray-100 rounded-2xl rounded-br-sm font-outfit text-sm leading-relaxed break-words text-left text-gray-900">
          <div className="whitespace-pre-wrap">{message.content}</div>
          {formattedTime && (
            <div className="text-xs mt-1.5 text-gray-500">
              {formattedTime}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-start max-w-[90%] sm:max-w-[85%]">
          {/* AI response: avatar + bubble */}
          <div className="flex items-start gap-2">
            <img
              src={getAsset('LOGO_AI')}
              alt=""
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full object-cover"
            />
            <div
              className="p-3 px-4 bg-white rounded-2xl rounded-tl-sm font-outfit text-sm leading-relaxed break-words text-left border-[3px] border-[#0A369D]"
              style={{ border: '3px solid #0A369D' }}
            >
              <div className="whitespace-pre-wrap text-gray-800">
                {message.content}
              </div>
              {formattedTime && (
                <div className="text-xs mt-1.5 text-gray-400">
                  {formattedTime}
                </div>
              )}
            </div>
          </div>
          {/* Options/buttons below the AI response */}
          {buttons && buttons.length > 0 && (
            <div className="mt-2 ml-12 sm:ml-14 flex flex-wrap gap-2">
              {buttons.map((button, idx) => {
                let buttonClass = 'font-outfit text-sm font-medium py-2 px-4 rounded-full transition-colors touch-manipulation'
                switch (button.variant) {
                  case 'selected':
                    buttonClass += ' bg-rental-blue-700 text-white hover:bg-rental-blue-800'
                    break
                  case 'primary':
                    buttonClass += ' bg-rental-blue-600 text-white hover:bg-rental-blue-700'
                    break
                  case 'success':
                    buttonClass += ' bg-green-600 text-white hover:bg-green-700'
                    break
                  default:
                    buttonClass += ' bg-rental-blue-600 text-white hover:bg-rental-blue-700'
                }
                return (
                  <button
                    key={idx}
                    onClick={button.onClick}
                    className={buttonClass}
                  >
                    {button.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Typing Indicator Component
 * Shows when AI is processing
 */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 max-w-[90%] sm:max-w-[85%]">
      <img
        src={getAsset('LOGO_AI')}
        alt=""
        className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full object-cover"
      />
      <div className="p-3 px-4 bg-white border border-gray-200 rounded-2xl rounded-tl-sm font-outfit">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

/**
 * Welcome Message Component
 * Shows initial greeting
 */
export function WelcomeMessage() {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg 
          className="w-8 h-8 text-blue-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        AI Listing Assistant
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Tell me about the property you want to list. I'll help you fill out all the details!
      </p>
    </div>
  )
}

export default MessageBubble
