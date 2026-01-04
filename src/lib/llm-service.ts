/**
 * LLM Service for parsing voice input to structured workout data
 * 
 * This service calls the server-side API endpoint which handles AI parsing
 * securely (API keys are never exposed to the client).
 */

interface WorkoutSet {
  exercise_id: number
  exercise_name: string
  weight_type: "barbell" | "dumbbell" | "cable" | "plate_loaded_machine" | "bodyweight"
  weight: number
  reps: number
  notes?: string
}

interface LLMParseResult {
  sets: WorkoutSet[]
  rawResponse?: string
}

/**
 * Parse natural language workout input into structured data
 * Calls server-side API endpoint for secure AI parsing
 */
export async function parseWorkoutFromVoice(
  transcript: string,
  availableExercises: { exercise_id: number; name: string }[]
): Promise<LLMParseResult> {
  try {
    // If a client-side Groq API key is provided (dev/testing), call Groq directly
    // Prefer VITE_ prefixed key for client builds, but allow non-VITE name if present
    const groqKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY

    if (groqKey) {
      const exerciseList = availableExercises
        .map((ex) => `${ex.exercise_id}: ${ex.name}`)
        .join(', ')

      const weightTypes = ["barbell", "dumbbell", "cable", "plate_loaded_machine", "bodyweight"]

      const systemPrompt = `You are a workout data parser. Convert natural language workout descriptions into structured JSON data.\n\nAvailable exercises (format: exercise_id: name):\n${exerciseList}\n\nAvailable weight types: ${weightTypes.join(', ')}\n\nRules:\n1. Extract ALL exercises, sets, reps, weights, and weight types from the input\n2. Match exercise names to the available exercises list (use exercise_id)\n3. If an exercise name doesn't match exactly, find the closest match\n4. Weight must be a positive number (max 1000), up to 3 decimal places\n5. Reps must be a positive integer\n6. Weight type must be one of: ${weightTypes.join(', ')}\n7. If weight type is not specified, infer from context\n8. If multiple sets of the same exercise, create separate entries\n9. Notes are optional\n\nReturn ONLY valid JSON in this exact format:\n{\n  "sets": [\n    {\n      "exercise_id": <number>,\n      "exercise_name": "<string>",\n      "weight_type": "<one of: ${weightTypes.join(', ')}>",\n      "weight": <number>,\n      "reps": <number>,\n      "notes": "<optional string>"\n    }\n  ]\n}`

      const userPrompt = `Parse this workout: "${transcript}"`
      const model = import.meta.env.VITE_GROQ_MODEL || import.meta.env.GROQ_MODEL || "llama-3.1-8b-instant"

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Groq API error: ${response.status} ${response.statusText} ${err.error?.message || ''}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      let parsed: { sets: WorkoutSet[] } | undefined

      if (typeof content === 'object') {
        parsed = content as { sets: WorkoutSet[] }
      } else if (typeof content === 'string') {
        try {
          parsed = JSON.parse(content) as { sets: WorkoutSet[] }
        } catch (e) {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (!jsonMatch) throw new Error('No valid JSON found in Groq API response')
          parsed = JSON.parse(jsonMatch[0]) as { sets: WorkoutSet[] }
        }
      } else {
        throw new Error('Unexpected Groq API response format')
      }

      return {
        sets: parsed?.sets || [],
        rawResponse: JSON.stringify(data),
      }
    }

    // Default: call the internal server API (proxied by Vite)
    const response = await fetch("/api/ai-parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        availableExercises,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const detailMsg = errorData.details || errorData.error || JSON.stringify(errorData) || ''
      throw new Error(
        `API error: ${response.status} ${response.statusText}. ${detailMsg}`
      )
    }

    const data = await response.json()

    return {
      sets: data.sets || [],
      rawResponse: JSON.stringify(data),
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to parse workout from voice input")
  }
}
