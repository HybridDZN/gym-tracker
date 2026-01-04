import { useState, useEffect, useCallback } from "react"
import { EditableWorkoutTable } from "@/components/EditableWorkoutTable"
import { VoiceInputButton } from "@/components/VoiceInputButton"
import type { ValidatedWorkoutSet } from "@/lib/workout-validator"
import { parseWorkoutFromVoice } from "@/lib/llm-service"
import supabase from "@/supabase"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BulkInputPage() {
  const [sets, setSets] = useState<ValidatedWorkoutSet[]>([])
  const [exerciseOptions, setExerciseOptions] = useState<{ exercise_id: number; name: string }[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(true)

  // Fetch available exercises
  useEffect(() => {
    async function fetchExercises() {
      setIsLoadingExercises(true)
      try {
        const { data, error } = await supabase
          .from("exercises")
          .select("exercise_id, name")
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        setExerciseOptions(data || [])
      } catch (error) {
        console.error("Error fetching exercises:", error)
        toast.error("Failed to load exercises")
      } finally {
        setIsLoadingExercises(false)
      }
    }

    fetchExercises()
  }, [])

  const handleVoiceTranscript = useCallback(async (transcript: string) => {
    try {
      if (exerciseOptions.length === 0) {
        toast.error("Exercises not loaded yet. Please wait...")
        return
      }

      const result = await parseWorkoutFromVoice(transcript, exerciseOptions)

      if (result.sets.length === 0) {
        toast.warning("No workout data could be extracted from your voice input. Please try again with a clearer description.")
        return
      }

      // Add parsed sets to existing sets
      setSets((prev) => [...prev, ...result.sets])
      toast.success(`Parsed ${result.sets.length} workout set(s) from voice input!`)
    } catch (error) {
      console.error("Error parsing voice input:", error)
      toast.error(error instanceof Error ? error.message : "Failed to parse voice input")
    }
  }, [exerciseOptions])

  const handleAddEmptyRow = () => {
    if (exerciseOptions.length === 0) {
      toast.error("Exercises not loaded yet")
      return
    }

    const newSet: ValidatedWorkoutSet = {
      exercise_id: exerciseOptions[0].exercise_id,
      exercise_name: exerciseOptions[0].name,
      weight_type: "barbell",
      weight: 0,
      reps: 0,
      notes: "",
    }

    setSets((prev) => [...prev, newSet])
  }

  const handleUpdate = (updatedSets: ValidatedWorkoutSet[]) => {
    setSets(updatedSets)
  }

  const handleSave = async (setsToSave: ValidatedWorkoutSet[]) => {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      throw new Error("You must be logged in to save workouts")
    }

    // Prepare data for insertion
    const workoutsToInsert = setsToSave.map((set) => ({
      exercise_id: set.exercise_id,
      weight_type: set.weight_type,
      weight: set.weight,
      reps: set.reps,
      notes: set.notes || null,
      user_id: user.id,
    }))

    // Insert all workouts
    const { error } = await supabase.from("workouts").insert(workoutsToInsert)

    if (error) {
      throw error
    }

    // Clear the sets after successful save
    setSets([])
  }

  const handleCancel = () => {
    setSets([])
    toast.info("Bulk input cleared")
  }

  if (isLoadingExercises) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading exercises...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start min-h-[60vh] w-full">
      <div className="w-full max-w-4xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 mt-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Bulk Input</h1>
          </div>

          <div className="text-sm text-muted-foreground">
            Use voice input to quickly log multiple exercises, or manually add rows to the table.
            Review and edit the data before saving.
          </div>

          {/* Voice Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Voice Input</label>
            <VoiceInputButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoadingExercises}
            />
          </div>

          {/* Manual Add Row Button */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddEmptyRow}
              disabled={isLoadingExercises}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            {sets.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {sets.length} set{sets.length !== 1 ? "s" : ""} ready to save
              </div>
            )}
          </div>

          {/* Editable Table */}
          <EditableWorkoutTable
            sets={sets}
            exerciseOptions={exerciseOptions}
            onUpdate={handleUpdate}
            onSave={handleSave}
            onCancel={sets.length > 0 ? handleCancel : undefined}
          />
        </div>
      </div>
    </div>
  )
}

