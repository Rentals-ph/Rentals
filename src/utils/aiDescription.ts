/**
 * Fallback property description when backend AI is unavailable.
 * All AI generation (suggested prompts, property descriptions) is done via the backend
 * so API keys and provider config stay in .env only and are never exposed to the client.
 */

export function getFallbackDescription(
  category: string,
  title: string
): string {
  return `Welcome to ${title}! This beautifully maintained ${category.toLowerCase()} offers a perfect blend of comfort and convenience. Featuring modern finishes, quality appliances, and a well-thought-out layout, this property is ideal for anyone looking for a premium rental experience. Conveniently located near key establishments, public transport, and lifestyle hubs. Schedule a viewing today and make this your next home!`;
}
