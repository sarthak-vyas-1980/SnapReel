export const getAITimestamps = async (transcript: string) => {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) throw new Error("OPENROUTER_API_KEY is missing or empty in .env")

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "SnapReel"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: `
              You are a viral video editor AI. 
              From the transcript provided, select exactly 3 highly engaging segments (Hook, Mid-Highlight, Final-Impact) that are 30-60 seconds each (each could be of different lengths).
              For each segment, also provide:
              1. A hook_score (0-100) based on how quickly it captures attention.
              2. An engagement label ("High", "Medium", or "Low") based on the emotional peak.

              Return ONLY JSON in this format:
              [
                { 
                  "start": "HH:MM:SS", 
                  "end": "HH:MM:SS", 
                  "label": "Hook", 
                  "hook_score": 95, 
                  "engagement": "High" 
                },
                ... (3 items total)
              ]
              Do not include any explanation or markdown formatting.
            `
        },
        {
          role: "user",
          content: transcript.slice(0, 4000)
        }
      ],
      temperature: 0.4
    })
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(`OpenRouter API Error: ${data.error.message}`)
  }

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No content returned from AI")
  }

  try {
    const jsonStr = content.replace(/```json/gi, "").replace(/```/g, "").trim()
    return JSON.parse(jsonStr)
  } catch {
    throw new Error(`AI returned invalid JSON: ${content}`)
  }
}