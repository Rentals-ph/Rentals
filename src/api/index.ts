/**
 * API Module Index
 * Central export point for all API endpoints
 * 
 * All endpoint functions now live in their respective feature modules.
 * This file only exports the API client and types for backward compatibility.
 */

export { default as apiClient } from './client'
export * from './types'

// Re-export all APIs from their feature locations for backward compatibility
// Shared APIs
export { propertiesApi, authApi, messagesApi, contactApi, downloadablesApi, testimonialsApi } from '../shared/api'
export type { GetPropertiesParams, Message, SendMessageData, GetMessagesParams, LoginCredentials, LoginResponse, ContactInquiry, SubmitContactData, GetContactInquiriesParams, Downloadable } from '../shared/api'

// Feature-specific APIs
export { blogsApi } from '../features/blog'
export type { GetBlogsParams, CreateBlogData, UpdateBlogData } from '../features/blog/api'

export { newsApi } from '../features/blog'
export type { GetNewsParams, News } from '../features/blog/newsApi'

export { agentsApi } from '../features/agents'
export type { Agent, AgentRegistrationResponse } from '../features/agents'
export type { AgentRegistrationData } from '../features/agents/api'

export { pageBuilderApi } from '../features/page-builder'
export type { PageBuilderData, PageBuilderResponse } from '../features/page-builder/api'

export { listingAssistantApi } from '../features/listing-assistant'

export { brokerApi } from '../features/broker'
export type { TeamProductivityRow, Broker, Company, Team, TeamMember, CustomStat, Award, BrokerDashboard } from '../features/broker'

export { adminApi } from '../features/admin'
export type { AdminAgent, AdminProperty, CreateAgentData, UpdateAgentData, CreatePropertyData, UpdatePropertyData } from '../features/admin'

