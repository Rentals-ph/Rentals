/**
 * Listing Assistant API Endpoints
 * AI-powered property listing assistant
 */

import apiClient from '../client'
import type {
  ProcessMessageRequest,
  ProcessMessageResponse,
  StartConversationResponse,
  GetConversationResponse,
  GenerateDescriptionResponse,
  UpdateDataResponse,
  SubmitListingResponse,
  ListConversationsResponse,
  ExtractedPropertyData,
  UploadImagesResponse,
  DeleteImageResponse,
  DescriptionTemplate,
} from '../../features/listing-assistant/types'

const BASE_PATH = '/listing/assistant'

/**
 * Process a message from the agent
 * Extracts property data and returns AI response
 */
export async function processMessage(
  message: string,
  conversationId?: string | null
): Promise<ProcessMessageResponse> {
  const payload: ProcessMessageRequest = {
    message,
    conversation_id: conversationId || null,
  }

  const response = await apiClient.post<ProcessMessageResponse>(
    BASE_PATH,
    payload
  )
  return response.data
}

/**
 * Start a new listing conversation
 */
export async function startNewConversation(): Promise<StartConversationResponse> {
  const response = await apiClient.post<StartConversationResponse>(
    `${BASE_PATH}/new`
  )
  return response.data
}

/**
 * Get conversation details
 */
export async function getConversation(
  conversationId: string
): Promise<GetConversationResponse> {
  const response = await apiClient.get<GetConversationResponse>(
    `${BASE_PATH}/${conversationId}`
  )
  return response.data
}

/**
 * Reset a conversation (clear all data)
 */
export async function resetConversation(
  conversationId: string
): Promise<StartConversationResponse> {
  const response = await apiClient.post<StartConversationResponse>(
    `${BASE_PATH}/${conversationId}/reset`
  )
  return response.data
}

/**
 * Generate AI property description
 */
export async function generateDescription(
  conversationId: string,
  template: DescriptionTemplate = 'narrative',
  agentContext: string = ''
): Promise<GenerateDescriptionResponse> {
  const response = await apiClient.post<GenerateDescriptionResponse>(
    `${BASE_PATH}/${conversationId}/generate-description`,
    { template, agent_context: agentContext }
  )
  return response.data
}

/**
 * Update extracted data manually
 */
export async function updateData(
  conversationId: string,
  data: Partial<ExtractedPropertyData>
): Promise<UpdateDataResponse> {
  const response = await apiClient.patch<UpdateDataResponse>(
    `${BASE_PATH}/${conversationId}/data`,
    { data }
  )
  return response.data
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `${BASE_PATH}/${conversationId}`
  )
  return response.data
}

/**
 * List all conversations for the user (requires auth)
 */
export async function listConversations(): Promise<ListConversationsResponse> {
  const response = await apiClient.get<ListConversationsResponse>(
    `${BASE_PATH}/conversations`
  )
  return response.data
}

/**
 * Submit the listing as a property (requires auth)
 */
export async function submitListing(
  conversationId: string
): Promise<SubmitListingResponse> {
  const response = await apiClient.post<SubmitListingResponse>(
    `${BASE_PATH}/${conversationId}/submit`
  )
  return response.data
}

/**
 * Upload images for a listing conversation
 */
export async function uploadImages(
  conversationId: string,
  images: File[]
): Promise<UploadImagesResponse> {
  const formData = new FormData()
  images.forEach((image) => {
    formData.append('images[]', image)
  })

  // Don't set Content-Type header - let browser set it with proper boundary
  const response = await apiClient.post<UploadImagesResponse>(
    `${BASE_PATH}/${conversationId}/upload-images`,
    formData
  )
  return response.data
}

/**
 * Delete an image from the listing conversation
 */
export async function deleteImage(
  conversationId: string,
  imageIndex: number
): Promise<DeleteImageResponse> {
  const response = await apiClient.delete<DeleteImageResponse>(
    `${BASE_PATH}/${conversationId}/images/${imageIndex}`
  )
  return response.data
}

/**
 * Auto-save draft progress
 */
export async function autoSave(
  conversationId: string,
  currentStep?: string,
  data?: Partial<ExtractedPropertyData>
): Promise<{ success: boolean; conversation_id: string; current_step?: string; extracted_data: ExtractedPropertyData }> {
  const response = await apiClient.post(
    `${BASE_PATH}/${conversationId}/auto-save`,
    { current_step: currentStep, data }
  )
  return response.data
}

/**
 * Save map coordinates
 */
export async function saveMapCoordinates(
  conversationId: string,
  latitude: number,
  longitude: number
): Promise<{ success: boolean; latitude: string; longitude: string }> {
  const response = await apiClient.post(
    `${BASE_PATH}/${conversationId}/map-coordinates`,
    { latitude, longitude }
  )
  return response.data
}

/**
 * Set field value via button
 */
export async function setField(
  conversationId: string,
  field: string,
  value: string | number,
  nextStep?: string
): Promise<{
  success: boolean;
  field: string;
  value: string | number;
  current_step?: string;
  extracted_data: ExtractedPropertyData;
  missing_fields: string[];
  form_ready: boolean;
  ai_response: string;
}> {
  const response = await apiClient.post(
    `${BASE_PATH}/${conversationId}/set-field`,
    { field, value, next_step: nextStep }
  )
  return response.data
}

// Export all functions as named exports and as default object
export const listingAssistantApi = {
  processMessage,
  startNewConversation,
  getConversation,
  resetConversation,
  generateDescription,
  updateData,
  deleteConversation,
  listConversations,
  submitListing,
  uploadImages,
  deleteImage,
  autoSave,
  saveMapCoordinates,
  setField,
}

export default listingAssistantApi
