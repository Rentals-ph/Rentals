/**
 * API Module Index
 * Central export point for all API endpoints
 */

export { default as apiClient } from './client'
export * from './types'

// Export all API endpoints
// Shared APIs (moved to shared/api)
export { propertiesApi, authApi, messagesApi } from '../shared/api'
// Feature-specific APIs
export { blogsApi } from './endpoints/blogs'
export { newsApi } from './endpoints/news'
export { testimonialsApi } from './endpoints/testimonials'
export { agentsApi } from './endpoints/agents'
export { pageBuilderApi } from './endpoints/pageBuilder'
export { listingAssistantApi } from './endpoints/listingAssistant'
export { brokerApi } from './endpoints/broker'
export type { TeamProductivityRow } from './endpoints/broker'
export { downloadablesApi } from './endpoints/downloadables'
export type { Downloadable } from './endpoints/downloadables'
export { adminApi } from './endpoints/admin'
export type { AdminAgent, AdminProperty, CreateAgentData, UpdateAgentData, CreatePropertyData, UpdatePropertyData } from './endpoints/admin'
export { contactApi } from './endpoints/contact'
export type { ContactInquiry, SubmitContactData, GetContactInquiriesParams } from './endpoints/contact'

// Export types from endpoints
// Shared API types (moved to shared/api)
export type { GetPropertiesParams, Message, SendMessageData, GetMessagesParams, LoginCredentials, LoginResponse } from '../shared/api'
// Feature-specific API types
export type { GetBlogsParams, CreateBlogData, UpdateBlogData } from './endpoints/blogs'
export type { GetNewsParams, News } from './endpoints/news'
export type { Agent, AgentRegistrationData, AgentRegistrationResponse } from './endpoints/agents'
export type { PageBuilderData, PageBuilderResponse } from './endpoints/pageBuilder'

