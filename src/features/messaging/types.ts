/**
 * Messaging Feature Types
 * Type definitions for messages and conversations
 */

export interface Message {
  id: number
  sender_id: number | null
  recipient_id: number | null
  conversation_id: number | null
  property_id: number | null
  sender_name: string
  sender_email: string
  sender_phone: string | null
  subject: string | null
  message: string
  type: 'contact' | 'property_inquiry' | 'general' | 'team_invitation' | 'broker_invitation'
  metadata?: {
    team_id?: number
    team_name?: string
    team_member_id?: number
    role?: string
    broker_id?: number
    broker_name?: string
  } | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  property?: {
    id: number
    title: string
    image: string | null
  } | null
  sender?: {
    id: number
    name: string
    email: string
  } | null
  conversation?: InquiryConversation
}

export interface InquiryConversation {
  id: number
  agent_id: number | null
  broker_id: number | null
  customer_email: string
  customer_name: string
  property_id: number | null
  type: 'contact' | 'property_inquiry' | 'general' | 'team_invitation' | 'broker_invitation'
  subject: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  property?: {
    id: number
    title: string
    image: string | null
  } | null
  agent?: {
    id: number
    name: string
    email: string
  } | null
  broker?: {
    id: number
    name: string
    email: string
  } | null
  latestMessage?: Message
}

export interface SendMessageData {
  recipient_id: number
  property_id?: number | null
  sender_name: string
  sender_email: string
  sender_phone?: string | null
  subject?: string | null
  message: string
  type?: 'contact' | 'property_inquiry' | 'general'
}

export interface GetMessagesParams {
  type?: 'contact' | 'property_inquiry' | 'general'
  is_read?: boolean
  property_id?: number
}

export interface ReplyMessageData {
  message: string
}


