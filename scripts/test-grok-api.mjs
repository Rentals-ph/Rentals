/**
 * Quick test script for Groq API connectivity
 * Run: node scripts/test-grok-api.mjs
 *
 * Pass your API key as an argument or set NEXT_PUBLIC_GROQ_API_KEY env var:
 *   node scripts/test-grok-api.mjs gsk_YOUR_KEY_HERE
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const apiKey = process.argv[2] || process.env.NEXT_PUBLIC_GROQ_API_KEY

if (!apiKey || apiKey === 'your_groq_api_key_here') {
  console.error('\n❌ No API key provided!')
  console.error('Usage: node scripts/test-grok-api.mjs gsk_YOUR_KEY_HERE')
  console.error('Or set NEXT_PUBLIC_GROQ_API_KEY in .env.local')
  console.error('\n💡 Get a FREE API key at: https://console.groq.com/keys\n')
  process.exit(1)
}

console.log('🔑 API Key:', apiKey.slice(0, 8) + '...' + apiKey.slice(-4))
console.log('🌐 Endpoint:', GROQ_API_URL)
console.log('🤖 Model: llama-3.3-70b-versatile')
console.log('📡 Sending test request...\n')

const body = {
  model: 'llama-3.3-70b-versatile',
  messages: [
    {
      role: 'system',
      content: 'You are a professional real estate copywriter for Rentals.ph, a Philippine rental property platform. Write compelling, concise property descriptions for rental listings. Keep it to 3-4 sentences. Be specific and professional. Do not use markdown formatting. Write in plain text only.'
    },
    {
      role: 'user',
      content: 'Write a rental property listing description for:\nCategory: Condominium\nTitle: Modern 2BR Condo in Makati CBD\n\nThe description should highlight the property\'s appeal, mention potential amenities typical for this category, and encourage prospective tenants to schedule a viewing.'
    }
  ],
  temperature: 0.7,
  max_tokens: 300,
}

try {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  console.log('📬 Status:', res.status, res.statusText)

  const data = await res.json()

  if (!res.ok) {
    console.error('\n❌ API Error:')
    console.error(JSON.stringify(data, null, 2))

    if (res.status === 401) {
      console.error('\n💡 Your API key is invalid. Get a new one at https://console.groq.com/keys')
    } else if (res.status === 404) {
      console.error('\n💡 Model "llama-3.3-70b-versatile" may not be available.')
    } else if (res.status === 429) {
      console.error('\n💡 Rate limited. Free tier allows 30 requests/min, 14,400 requests/day.')
    }
    process.exit(1)
  }

  const content = data?.choices?.[0]?.message?.content?.trim()

  if (content) {
    console.log('✅ SUCCESS! Generated description:\n')
    console.log('─'.repeat(60))
    console.log(content)
    console.log('─'.repeat(60))
    console.log('\n📊 Usage:', JSON.stringify(data.usage))
    console.log('\n🎉 Groq API is working correctly! Your .env.local is ready.')
  } else {
    console.error('\n⚠️  API returned OK but no content in response:')
    console.error(JSON.stringify(data, null, 2))
  }
} catch (err) {
  console.error('\n❌ Network/Fetch Error:', err.message)
  console.error('\n💡 Check your internet connection and firewall settings.')
  process.exit(1)
}
