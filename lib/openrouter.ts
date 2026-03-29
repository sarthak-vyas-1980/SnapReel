export const getAITimestamps = async (transcript: string) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "SnapReel"
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-lite-preview-02-05:free", // reliable free model
      messages: [
        {
          role: "system",
          content: `
            You are a video editor AI.
            From the transcript provided, select exactly 3 most engaging segments (labeled Hook, Highlight, Outro) that are 30-60 seconds each.
            Return ONLY JSON in this format:
            [
              { "start": "HH:MM:SS", "end": "HH:MM:SS", "label": "Hook" },
              { "start": "HH:MM:SS", "end": "HH:MM:SS", "label": "Highlight" },
              { "start": "HH:MM:SS", "end": "HH:MM:SS", "label": "Outro" }
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