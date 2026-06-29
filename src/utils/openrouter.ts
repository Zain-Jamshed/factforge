import axios from 'axios'
import * as dotenv from 'dotenv'

dotenv.config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const BASE_URL = 'https://openrouter.ai/api/v1'

export async function callOpenRouter(systemPrompt: string, userPrompt: string, maxTokens: number = 1024) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not defined in .env')
  }

  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/factforge/factforge', // Optional
        'X-Title': 'FactForge' // Optional
      }
    }
  )

  const content = response.data.choices[0].message.content
  
  // Sanitize JSON response if it's wrapped in markdown code blocks
  return content.replace(/```json\n?|```/g, '').trim()
}
