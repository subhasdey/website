const apiKey = process.env.OPENAI_API_KEY

export async function generateText(system: string, prompt: string): Promise<string> {
  if (!apiKey) {
    return `Demo content (set OPENAI_API_KEY to enable AI):\n\nSystem: ${system}\n\n${prompt}`
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content ?? ''
}