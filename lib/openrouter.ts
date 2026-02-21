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
      model: "openai/gpt-3.5-turbo", // free compatible model
      messages: [
        {
          role: "system",
          content: `
            You are a video editor AI.
            From the transcript provided, select the most engaging 30-60 second segment.
            Return ONLY JSON in this format:
            {
              "start": "HH:MM:SS",
              "end": "HH:MM:SS"
            }
            No explanation.
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

  const content = data.choices?.[0]?.message?.content

  try {
    return JSON.parse(content)
  } catch {
    throw new Error("AI returned invalid JSON")
  }
}