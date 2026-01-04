import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

interface WorkoutSet {
  exercise_id: number;
  exercise_name: string;
  weight_type: "barbell" | "dumbbell" | "cable" | "plate_loaded_machine" | "bodyweight";
  weight: number;
  reps: number;
  notes?: string;
}

interface ParseRequest {
  transcript: string;
  availableExercises: { exercise_id: number; name: string }[];
}

/**
 * Parse workout transcript using Groq Inference API (free tier)
 * If no API key is set, the service will use a rule-based parser (always works, no API needed)
 */
router.post('/ai-parse', async (req: Request, res: Response): Promise<void> => {
  try {
    // Redact sensitive fields before logging request body
    const redactSecrets = (obj: any) => {
      try {
        if (!obj || typeof obj !== 'object') return obj;
        const out: any = Array.isArray(obj) ? [] : {};
        for (const [k, v] of Object.entries(obj)) {
          const key = k.toLowerCase();
          if (/key|token|secret|password|anon|bearer|api/i.test(key)) {
            out[k] = '[REDACTED]';
            continue;
          }
          if (typeof v === 'string') {
            // redact long-looking tokens
            if (v.length > 64 || /^(eyJ|gsk_|sk-|pk-|ghp_)/.test(v)) {
              out[k] = '[REDACTED]';
              continue;
            }
            out[k] = v;
            continue;
          }
          if (typeof v === 'object') out[k] = redactSecrets(v);
          else out[k] = v;
        }
        return out;
      } catch (e) {
        return '[UNREDACTABLE]';
      }
    };

    console.log('ai-parse request body:', JSON.stringify(redactSecrets(req.body || {})));

    const { transcript, availableExercises } = req.body as ParseRequest;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      res.status(400).json({ error: 'Transcript is required and must be a non-empty string' });
      return;
    }

    if (!Array.isArray(availableExercises) || availableExercises.length === 0) {
      res.status(400).json({ error: 'Available exercises are required and must be a non-empty array' });
      return;
    }

    // Validate exercise objects to avoid unexpected runtime errors
    const invalidExercise = availableExercises.find(ex => {
      return (
        !ex ||
        typeof ex.exercise_id !== 'number' ||
        typeof ex.name !== 'string' ||
        ex.name.trim() === ''
      );
    });

    if (invalidExercise) {
      res.status(400).json({ error: 'Each available exercise must have numeric exercise_id and non-empty name' });
      return;
    }

    // Try Groq API first (free tier)
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (groqApiKey) {
      try {
        const parsed = await parseWithGroq(transcript, availableExercises, groqApiKey);
        res.json({ sets: parsed });
        return;
      } catch (groqError) {
        console.warn('Groq API failed, falling back to rule-based parser:', groqError && (groqError instanceof Error ? groqError.message : groqError));
        // Fall through to rule-based parser
      }
    }

    // Fallback: Rule-based parser (always works, no API needed)
    const parsed = parseWithRuleBased(transcript, availableExercises);
    res.json({ sets: parsed });

  } catch (error) {
    console.error('AI parse error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    // Include redacted request context in logs to help reproduce issues
    console.error('Request body at error time:', JSON.stringify(redactSecrets(req.body || {})));

    const errorMessage = error instanceof Error ? error.message : 'Failed to parse workout';
    res.status(500).json({ 
      error: 'Failed to parse workout',
      details: errorMessage
    });
  }
});

/**
 * Parse using Groq Inference API (free tier: 14,400 requests/day)
 * Uses fast free models like llama-3.1-8b-instant or mixtral-8x7b-32768
 */
async function parseWithGroq(
  transcript: string,
  availableExercises: { exercise_id: number; name: string }[],
  apiKey: string
): Promise<WorkoutSet[]> {
  const exerciseList = availableExercises
    .map((ex) => `${ex.exercise_id}: ${ex.name}`)
    .join(', ');

  const weightTypes = ["barbell", "dumbbell", "cable", "plate_loaded_machine", "bodyweight"];

  const systemPrompt = `You are a workout data parser. Convert natural language workout descriptions into structured JSON data.

Available exercises (format: exercise_id: name):
${exerciseList}

Available weight types: ${weightTypes.join(', ')}

Rules:
1. Extract ALL exercises, sets, reps, weights, and weight types from the input
2. Match exercise names to the available exercises list (use exercise_id)
3. If an exercise name doesn't match exactly, find the closest match
4. Weight must be a positive number (max 1000), up to 3 decimal places
5. Reps must be a positive integer
6. Weight type must be one of: ${weightTypes.join(', ')}
7. If weight type is not specified, infer from context (e.g., "barbell bench" → "barbell")
8. If multiple sets of the same exercise, create separate entries
9. Notes are optional

Return ONLY valid JSON in this exact format:
{
  "sets": [
    {
      "exercise_id": <number>,
      "exercise_name": "<string>",
      "weight_type": "<one of: ${weightTypes.join(', ')}>",
      "weight": <number>,
      "reps": <number>,
      "notes": "<optional string>"
    }
  ]
}`;

  const userPrompt = `Parse this workout: "${transcript}"`;

  // Groq API endpoint (OpenAI-compatible format)
  // Free tier models: llama-3.1-8b-instant, mixtral-8x7b-32768, gemma-7b-it
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content && content !== 0) {
    throw new Error('No response content from Groq API');
  }

  // Parse JSON response. The Groq `response_format` may return a JSON object
  // directly (already-parsed) or a string containing JSON. Handle both safely.
  let parsed: { sets: WorkoutSet[] } | undefined;

  if (typeof content === 'object') {
    parsed = content as { sets: WorkoutSet[] };
  } else if (typeof content === 'string') {
    // Try to parse the string, or extract JSON substring if wrapped in text
    try {
      parsed = JSON.parse(content) as { sets: WorkoutSet[] };
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Groq API response');
      }
      parsed = JSON.parse(jsonMatch[0]) as { sets: WorkoutSet[] };
    }
  } else {
    throw new Error('Unexpected Groq API response format');
  }

  return (parsed && parsed.sets) || [];
}

/**
 * Rule-based parser as fallback (no API needed)
 * This is a simple parser that works for common workout patterns
 */
function parseWithRuleBased(
  transcript: string,
  availableExercises: { exercise_id: number; name: string }[]
): WorkoutSet[] {
  const sets: WorkoutSet[] = [];

  // Validate inputs
  if (!transcript || typeof transcript !== 'string') {
    return sets;
  }

  if (!availableExercises || !Array.isArray(availableExercises) || availableExercises.length === 0) {
    return sets;
  }

  // Normalize exercise names for matching
  const exerciseMap = new Map<string, number>();
  availableExercises.forEach(ex => {
    if (!ex || typeof ex.exercise_id !== 'number' || !ex.name || typeof ex.name !== 'string') {
      return; // Skip invalid exercises
    }
    const normalized = ex.name.toLowerCase().trim();
    if (normalized) {
      exerciseMap.set(normalized, ex.exercise_id);
      // Also add variations
      exerciseMap.set(normalized.replace(/\s+/g, ''), ex.exercise_id);
      exerciseMap.set(normalized.replace(/\s+/g, '-'), ex.exercise_id);
    }
  });

  // Common patterns:
  // "bench press 3 sets of 8 at 80 kilos"
  // "squats 5x5 at 100kg"
  // "deadlift 1x5 150"
  
  const patterns = [
    // Pattern: "exercise X sets of Y reps at Z weight"
    /(\w+(?:\s+\w+)*)\s+(\d+)\s+sets?\s+of\s+(\d+)\s+reps?\s+(?:at|with|@)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|lbs?)?/gi,
    // Pattern: "exercise XxY at Z weight"
    /(\w+(?:\s+\w+)*)\s+(\d+)x(\d+)\s+(?:at|with|@)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|lbs?)?/gi,
    // Pattern: "exercise XxY Z weight"
    /(\w+(?:\s+\w+)*)\s+(\d+)x(\d+)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|lbs?)?/gi,
    // Pattern: "exercise X reps at Y weight"
    /(\w+(?:\s+\w+)*)\s+(\d+)\s+reps?\s+(?:at|with|@)\s+(\d+(?:\.\d+)?)\s*(kg|kilos?|lbs?)?/gi,
  ];

  // Normalize number words to digits to handle inputs like "four sets"
  const numberWords: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
  };

  let normalizedTranscript = transcript.replace(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi, (w) => {
    return String(numberWords[w.toLowerCase() as keyof typeof numberWords] ?? w);
  });

  for (const pattern of patterns) {
    try {
      let match;
      while ((match = pattern.exec(normalizedTranscript)) !== null) {
        try {
          if (!match[1]) continue;

          // Flexible extraction: find the first textual capture as exercise name
          const groups = match.slice(1).map((g: any) => (typeof g === 'string' ? g.trim() : g));
          let exerciseName = '';
          for (const g of groups) {
            if (g && /[a-zA-Z]/.test(g)) {
              exerciseName = g.toLowerCase();
              break;
            }
          }

          // Collect numeric values from the matched text in order
          const nums: number[] = [];
          const matchedText = (match[0] || '').toLowerCase();
          const mAll = matchedText.match(/\d+(?:\.\d+)?/g) || [];
          for (const val of mAll) nums.push(parseFloat(val));

          // Heuristic mapping based on keywords present in the matched text
          let setsCount = 1;
          let reps = 0;
          let weight = 0;

          if (/sets?/.test(matchedText) && /reps?/.test(matchedText)) {
            // e.g. "four sets 10 reps ..." => [sets, reps, weight]
            setsCount = Math.round(nums[0] || 1);
            reps = Math.round(nums[1] || 0);
            weight = nums[2] || 0;
          } else if (/rounds?/.test(matchedText)) {
            setsCount = Math.round(nums[0] || 1);
            reps = 0;
            weight = 0;
          } else if (/[x×]/.test(matchedText)) {
            // e.g. "5x5" or "4x squats" => [sets, reps? , weight?]
            setsCount = Math.round(nums[0] || 1);
            reps = Math.round(nums[1] || 0);
            weight = nums[2] || 0;
          } else if (/reps?/.test(matchedText) && /at|with|@/.test(matchedText)) {
            // e.g. "10 reps at 80kg" => [reps, weight]
            reps = Math.round(nums[0] || 0);
            weight = nums[1] || 0;
            setsCount = 1;
          } else {
            // Fallback: first number -> reps, second -> weight
            reps = Math.round(nums[0] || 0);
            weight = nums[1] || 0;
            setsCount = 1;
          }

          if (!exerciseName || isNaN(setsCount) || isNaN(reps) || isNaN(weight)) {
            continue;
          }

          // Find matching exercise
          let exerciseId: number | undefined;
          for (const [key, id] of exerciseMap.entries()) {
            if (exerciseName.includes(key) || key.includes(exerciseName)) {
              exerciseId = id;
              break;
            }
          }

          if (!exerciseId) {
            // Try to find closest match
            const closest = availableExercises.find(ex => 
              ex && ex.name && (
                ex.name.toLowerCase().includes(exerciseName) || 
                exerciseName.includes(ex.name.toLowerCase())
              )
            );
            exerciseId = closest?.exercise_id;
          }

          // Accept entries that have at least sets defined; reps or weight may be zero (user can edit later)
          if (exerciseId && setsCount > 0) {
            // Infer weight type from exercise name
            let weightType: WorkoutSet['weight_type'] = 'barbell';
            const nameLower = exerciseName.toLowerCase();
            if (nameLower.includes('dumbbell') || nameLower.includes('db')) {
              weightType = 'dumbbell';
            } else if (nameLower.includes('cable')) {
              weightType = 'cable';
            } else if (nameLower.includes('machine')) {
              weightType = 'plate_loaded_machine';
            } else if (nameLower.includes('bodyweight') || nameLower.includes('body weight') || nameLower.includes('pushup') || nameLower.includes('pullup') || nameLower.includes('burpee')) {
              weightType = 'bodyweight';
            }

            const exercise = availableExercises.find(ex => ex && ex.exercise_id === exerciseId);

            // Create one entry per set. If reps unknown (0), keep as 0 for user to edit later.
            for (let i = 0; i < setsCount; i++) {
              sets.push({
                exercise_id: exerciseId,
                exercise_name: exercise?.name || exerciseName,
                weight_type: weightType,
                weight: Math.round((weight || 0) * 1000) / 1000, // Round to 3 decimal places
                reps: reps || 0,
              });
            }
          }
        } catch (matchError) {
          console.warn('Error processing match:', matchError);
          continue; // Skip this match and continue
        }
      }
    } catch (patternError) {
      console.warn('Error processing pattern:', patternError);
      continue; // Skip this pattern and continue
    }
  }

  // If no patterns matched, try a simpler approach
  if (sets.length === 0) {
    try {
      // Split by common separators and try to extract individual exercises
      const parts = transcript.split(/[,;]|\s+then\s+|\s+and\s+/i);
      for (const part of parts) {
        try {
          if (!part || typeof part !== 'string') {
            continue;
          }

          const numbers = part.match(/\d+(?:\.\d+)?/g);
          if (numbers && numbers.length >= 2) {
            const weight = parseFloat(numbers[numbers.length - 1]);
            const reps = parseInt(numbers[numbers.length - 2]);
            // If three or more numbers, treat the first as sets count
            const setsCount = numbers.length >= 3 ? Math.max(1, parseInt(numbers[0])) : 1;

            if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
              // allow reps or weight to be zero? skip only if both invalid
              if (isNaN(weight) && isNaN(reps)) continue;
            }
            
            // Try to find exercise name by checking availableExercises against the part text
            const partLower = part.toLowerCase();
            let exercise = availableExercises.find(ex => ex && ex.name && partLower.includes(ex.name.toLowerCase()));

            // If not found, try a loose token match (match words of exercise name in order)
            if (!exercise) {
              for (const ex of availableExercises) {
                if (!ex || !ex.name) continue;
                const nameTokens = ex.name.toLowerCase().split(/\s+/).filter(t => t.length > 0);
                let idx = 0;
                for (const t of nameTokens) {
                  const pos = partLower.indexOf(t, idx === 0 ? 0 : idx);
                  if (pos === -1) { idx = -1; break; }
                  idx = pos + t.length;
                }
                if (idx !== -1) { exercise = ex; break; }
              }
            }

            if (!exercise) continue;

            if (exercise && exercise.exercise_id) {
              for (let i = 0; i < setsCount; i++) {
                sets.push({
                  exercise_id: exercise.exercise_id,
                  exercise_name: exercise.name,
                  weight_type: 'barbell', // Default
                  weight: Math.round((weight || 0) * 1000) / 1000,
                  reps: reps || 0,
                });
              }
            }
          }
        } catch (partError) {
          console.warn('Error processing part:', partError);
          continue; // Skip this part and continue
        }
      }
    } catch (fallbackError) {
      console.warn('Error in fallback parser:', fallbackError);
      // Return empty sets if fallback also fails
    }
  }

  return sets;
}

export default router;

