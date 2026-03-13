/**
 * API Module Index
 * Central export point for all API endpoints
 */

export { default as apiClient } from './client'
export * from './types'

// Export all API endpoints
export { propertiesApi } from './endpoints/properties'
export { blogsApi } from './endpoints/blogs'
export { newsApi } from './endpoints/news'
export { testimonialsApi } from './endpoints/testimonials'
export { agentsApi } from './endpoints/agents'
export { authApi } from './endpoints/auth'
export { messagesApi } from './endpoints/messages'
export { pageBuilderApi } from './endpoints/pageBuilder'
export { listingAssistantApi } from './endpoints/listingAssistant'
export { brokerApi } from './endpoints/broker'
export type { TeamProductivityRow } from './endpoints/broker'
export { downloadablesApi } from './endpoints/downloadables'
export type { Downloadable } from './endpoints/downloadables'
export { adminApi } from './endpoints/admin'
export type { AdminAgent, AdminProperty, CreateAgentData, UpdateAgentData, CreatePropertyData, UpdatePropertyData } from './endpoints/admin'

// Export types from endpoints
export type { GetPropertiesParams } from './endpoints/properties'
export type { GetBlogsParams, CreateBlogData, UpdateBlogData } from './endpoints/blogs'
export type { GetNewsParams, News } from './endpoints/news'
export type { AgentRegistrationData, AgentRegistrationResponse } from './endpoints/agents'
export type { LoginCredentials, LoginResponse } from './endpoints/auth'
export type { Message, SendMessageData, GetMessagesParams } from './endpoints/messages'
export type { PageBuilderData, PageBuilderResponse } from './endpoints/pageBuilder'

