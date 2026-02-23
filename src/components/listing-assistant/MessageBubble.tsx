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
      className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'} mb-4`}
    >
      {isUser ? (
        <div className="max-w-[75%] !border-2 !border-[#002978] p-3 px-4 rounded-xl font-outfit text-sm leading-relaxed break-words text-left bg-[#205ED7] text-white rounded-br-sm shadow-sm"
          style={{
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#002978',
          }}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          {formattedTime && (
            <div className="text-xs mt-1.5 text-blue-200">
              {formattedTime}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2 max-w-[75%]">
          <img 
            src={getAsset('LOGO_AI')} 
            alt="AI Logo" 
            className="w-12 h-12 flex-shrink-0"
          />
          <div className="relative">
            {/* Speech bubble pointer pointing to the logo - top left */}
            <div 
              className="relative overflow-hidden p-3 px-4 bg-white !border-2 !border-[#002978] rounded-xl rounded-tl-sm shadow-lg font-outfit text-sm leading-relaxed break-words text-left"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#002978',
                boxShadow: '0 4px 12px rgba(0, 41, 120, 0.15), 0 2px 4px rgba(0, 41, 120, 0.1)',
              }}
            >
              <div className="relative z-10 whitespace-pre-wrap text-gray-800">
                {message.content}
              </div>
              {formattedTime && (
                <div className="text-xs mt-1.5 text-gray-400">
                  {formattedTime}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Buttons below AI messages */}
      {!isUser && buttons && buttons.length > 0 && (
        <div className="mt-2 ml-14 flex flex-wrap gap-2">
          {buttons.map((button, idx) => {
            let buttonClass = 'px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm'
            
            switch (button.variant) {
              case 'selected':
                buttonClass += ' bg-blue-700 text-white hover:bg-blue-800'
                break
              case 'primary':
                buttonClass += ' bg-blue-600 text-white hover:bg-blue-700'
                break
              case 'success':
                buttonClass += ' bg-green-600 text-white hover:bg-green-700'
                break
              default:
                buttonClass += ' bg-blue-600 text-white hover:bg-blue-700'
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
  )
}

/**
 * Typing Indicator Component
 * Shows when AI is processing
 */
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 mb-4">
      <img 
        src={getAsset('LOGO_AI')} 
        alt="AI Logo" 
        className="w-12 h-12 flex-shrink-0"
      />
      <div className="relative">
        <div 
          className="relative overflow-hidden p-3 px-4 bg-white !border-2 !border-[#002978] rounded-xl rounded-tl-sm shadow-lg font-outfit"
          style={{
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#002978',
            boxShadow: '0 4px 12px rgba(0, 41, 120, 0.15), 0 2px 4px rgba(0, 41, 120, 0.1)',
          }}
        >
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
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
