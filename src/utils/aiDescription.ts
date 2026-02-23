/**
 * AI Property Description Generator
 * Supports multiple AI providers: Gemini, Groq, OpenAI
 * Configure via NEXT_PUBLIC_AI_PROVIDER environment variable (defaults to 'gemini')
 */

const getProviderConfig = () => {
  const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini').toLowerCase();
  
  if (provider === 'gemini') {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL;
    return {
      provider: 'gemini',
      apiKey,
      model,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    };
  } else if (provider === 'groq') {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const model = process.env.NEXT_PUBLIC_GROQ_MODEL;
    return {
      provider: 'groq',
      apiKey,
      model,
      url: 'https://api.groq.com/openai/v1/chat/completions',
    };
  } else {
    // OpenAI
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-3.5-turbo';
    return {
      provider: 'openai',
      apiKey,
      model,
      url: 'https://api.openai.com/v1/chat/completions',
    };
  }
};

export async function generatePropertyDescription(
  category: string,
  title: string
): Promise<string> {
  const config = getProviderConfig();

  if (!config.apiKey) {
    throw new Error(`${config.provider} API key not configured. Please set the appropriate environment variable.`);
  }

  const systemPrompt = 'You are a professional real estate copywriter for Rentals.ph, a Philippine rental property platform. Write compelling, concise property descriptions for rental listings. Keep it to 3-4 sentences. Be specific and professional. Do not use markdown formatting. Write in plain text only.';
  
  const userPrompt = `Write a rental property listing description for:\nCategory: ${category}\nTitle: ${title}\n\nThe description should highlight the property's appeal, mention potential amenities typical for this category, and encourage prospective tenants to schedule a viewing.`;

  if (config.provider === 'gemini') {
    // Gemini API format
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.status} — ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!content) {
      throw new Error('Gemini API returned an empty response');
    }

    return content;
  } else {
    // Groq/OpenAI API format (OpenAI-compatible)
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `${config.provider} API error: ${response.status} — ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error(`${config.provider} API returned an empty response`);
    }

    return content;
  }
}

export function getFallbackDescription(
  category: string,
  title: string
): string {
  return `Welcome to ${title}! This beautifully maintained ${category.toLowerCase()} offers a perfect blend of comfort and convenience. Featuring modern finishes, quality appliances, and a well-thought-out layout, this property is ideal for anyone looking for a premium rental experience. Conveniently located near key establishments, public transport, and lifestyle hubs. Schedule a viewing today and make this your next home!`;
}
