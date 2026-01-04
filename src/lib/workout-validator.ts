import { z } from "zod"

/**
 * Validation schema matching the existing form schema
 * This ensures LLM output conforms to the exact same rules
 */
export const workoutSetSchema = z.object({
  exercise_id: z.number({ invalid_type_error: "Exercise ID must be a number" }),
  exercise_name: z.string().min(1, "Exercise name is required"),
  weight_type: z.enum(["barbell", "dumbbell", "cable", "plate_loaded_machine", "bodyweight"], {
    errorMap: () => ({ message: "Invalid weight type" }),
  }),
  weight: z
    .number({ invalid_type_error: "Weight must be a number" })
    .positive("Weight must be greater than 0")
    .max(1000, "Weight cannot exceed 1000 kg")
    .refine((val) => {
      // Check up to 3 decimal places
      const decimalPlaces = (val.toString().split(".")[1] || "").length
      return decimalPlaces <= 3
    }, "Weight can have up to 3 decimal places"),
  reps: z
    .number({ invalid_type_error: "Reps must be a number" })
    .int("Reps must be an integer")
    .positive("Reps must be positive"),
  notes: z.string().optional(),
})

export type ValidatedWorkoutSet = z.infer<typeof workoutSetSchema>

export interface ValidationResult {
  isValid: boolean
  sets: ValidatedWorkoutSet[]
  errors: Array<{
    index: number
    field: string
    message: string
  }>
}

/**
 * Validate and sanitize workout sets from LLM output
 */
export function validateWorkoutSets(
  sets: unknown[],
  availableExerciseIds: number[]
): ValidationResult {
  const errors: ValidationResult["errors"] = []
  const validatedSets: ValidatedWorkoutSet[] = []

  sets.forEach((set, index) => {
    try {
      // Parse and validate the set
      const parsed = workoutSetSchema.parse(set)

      // Additional validation: check if exercise_id exists
      if (!availableExerciseIds.includes(parsed.exercise_id)) {
        errors.push({
          index,
          field: "exercise_id",
          message: `Exercise ID ${parsed.exercise_id} not found in available exercises`,
        })
        return
      }

      // Round weight to 3 decimal places
      const sanitizedSet: ValidatedWorkoutSet = {
        ...parsed,
        weight: Math.round(parsed.weight * 1000) / 1000,
      }

      validatedSets.push(sanitizedSet)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          errors.push({
            index,
            field: err.path.join("."),
            message: err.message,
          })
        })
      } else {
        errors.push({
          index,
          field: "unknown",
          message: `Invalid set data: ${String(error)}`,
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    sets: validatedSets,
    errors,
  }
}

