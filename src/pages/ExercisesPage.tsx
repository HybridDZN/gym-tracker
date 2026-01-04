import { ExerciseChartSelector, ExerciseProgressChart } from "@/components/ExerciseCharts"
import supabase from "@/supabase"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { useEffect, useState } from "react"

const TIMEFRAMES = [
  { label: "1 Day", value: "1" },
  { label: "3 Days", value: "3" },
  { label: "7 Days", value: "7" },
  { label: "1 Month", value: "30" },
  { label: "6 Months", value: "182" },
  { label: "1 Year", value: "365" },
  { label: "5 Years", value: "1825" },
]

export function ExercisesPage() {
  type Exercise = {
    id: string
    exercise_id: string
    weight_type: string
    weight: number
    reps: number
    notes: string
    created_time: string
    exercises?: { name: string } | null
    user_id: string
  }
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("7") // Default to 7 days
  const [advancedMode, setAdvancedMode] = useState(false)

  // For chart selection in advanced mode
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line")
  const [exerciseOptions, setExerciseOptions] = useState<{ value: string; label: string }[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>("")

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    exercise_id: number
    weight: number
    reps: number
  } | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [exerciseOptionsForEdit, setExerciseOptionsForEdit] = useState<{ exercise_id: number; name: string }[]>([])

  // Fetch exercise options for edit dropdown
  useEffect(() => {
    async function fetchExerciseOptions() {
      const { data, error } = await supabase
        .from("exercises")
        .select("exercise_id, name")
        .order("name", { ascending: true })
      if (!error && data) {
        setExerciseOptionsForEdit(data)
      }
    }
    fetchExerciseOptions()
  }, [])

  useEffect(() => {
    async function fetchExercises() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        setExercises([])
        setLoading(false)
        return
      }

      // Calculate date range
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - parseInt(days, 10))

      // Join with exercises table for human-readable name
      const { data, error } = await supabase
        .from("workouts")
        .select("*, exercises:exercise_id(name)")
        .eq("user_id", user.id)
        .gte("created_time", from.toISOString())
        .lte("created_time", to.toISOString())
        .order("created_time", { ascending: false })

      if (error) {
        console.error("Supabase error fetching workouts:", error)
      }

      setExercises(data || [])
      setLoading(false)
    }
    fetchExercises()
  }, [days])

  useEffect(() => {
    async function fetchExerciseOptions() {
      const { data, error } = await supabase
        .from("exercises")
        .select("exercise_id, name")
        .order("name", { ascending: true })
      if (!error && data) {
        setExerciseOptions(data.map((ex) => ({ value: String(ex.exercise_id), label: ex.name })))
        if (data.length > 0 && !selectedExercise) setSelectedExercise(String(data[0].exercise_id))
      }
    }
    if (advancedMode) fetchExerciseOptions()
  }, [advancedMode, selectedExercise])

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setEditFormData({
      exercise_id: Number(exercise.exercise_id),
      weight: exercise.weight,
      reps: exercise.reps,
    })
    setEditErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFormData(null)
    setEditErrors({})
  }

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!editFormData) return false

    // Validate exercise_id
    if (!editFormData.exercise_id || !exerciseOptionsForEdit.find(ex => ex.exercise_id === editFormData.exercise_id)) {
      errors.exercise_id = "Select a valid exercise"
    }

    // Validate weight
    if (editFormData.weight <= 0 || editFormData.weight > 1000) {
      errors.weight = "Weight must be between 0 and 1000"
    }
    // Check decimal places
    const decimalPlaces = (editFormData.weight.toString().split(".")[1] || "").length
    if (decimalPlaces > 3) {
      errors.weight = "Weight can have up to 3 decimal places"
    }

    // Validate reps
    if (!Number.isInteger(editFormData.reps) || editFormData.reps <= 0) {
      errors.reps = "Reps must be a positive integer"
    }

    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editFormData) return

    if (!validateEditForm()) {
      toast.error("Please fix validation errors")
      return
    }

    setIsSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        toast.error("You must be logged in to edit workouts")
        return
      }

      const { error } = await supabase
        .from("workouts")
        .update({
          exercise_id: editFormData.exercise_id,
          weight: editFormData.weight,
          reps: editFormData.reps,
        })
        .eq("id", editingId)
        .eq("user_id", user.id) // Ensure user can only edit their own workouts

      if (error) {
        throw error
      }

      toast.success("Workout updated successfully!")
      cancelEdit()
      
      // Refetch exercises to update the display
      const to = new Date()
      const from = new Date()
      from.setDate(to.getDate() - parseInt(days, 10))
      const { data, error: fetchError } = await supabase
        .from("workouts")
        .select("*, exercises:exercise_id(name)")
        .eq("user_id", user.id)
        .gte("created_time", from.toISOString())
        .lte("created_time", to.toISOString())
        .order("created_time", { ascending: false })

      if (!fetchError && data) {
        setExercises(data)
      }
    } catch (error) {
      console.error("Error updating workout:", error)
      toast.error("Failed to update workout")
    } finally {
      setIsSaving(false)
    }
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Exercise</TableHead>
          <TableHead>Weight Type</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Reps</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((ex) => (
          <TableRow key={ex.id}>
            {editingId === ex.id ? (
              <>
                <TableCell>
                  <Select
                    value={String(editFormData?.exercise_id || "")}
                    onValueChange={(val) => {
                      setEditFormData(prev => prev ? { ...prev, exercise_id: Number(val) } : null)
                      setEditErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.exercise_id
                        return newErrors
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exerciseOptionsForEdit.map((opt) => (
                        <SelectItem key={opt.exercise_id} value={String(opt.exercise_id)}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editErrors.exercise_id && (
                    <p className="text-xs text-destructive mt-1">{editErrors.exercise_id}</p>
                  )}
                </TableCell>
                <TableCell>{ex.weight_type}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    value={editFormData?.weight || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setEditFormData(prev => prev ? { ...prev, weight: isNaN(val) ? 0 : val } : null)
                      setEditErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.weight
                        return newErrors
                      })
                    }}
                    className="w-24"
                  />
                  {editErrors.weight && (
                    <p className="text-xs text-destructive mt-1">{editErrors.weight}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={editFormData?.reps || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setEditFormData(prev => prev ? { ...prev, reps: isNaN(val) ? 0 : val } : null)
                      setEditErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.reps
                        return newErrors
                      })
                    }}
                    className="w-20"
                  />
                  {editErrors.reps && (
                    <p className="text-xs text-destructive mt-1">{editErrors.reps}</p>
                  )}
                </TableCell>
                <TableCell>{ex.notes}</TableCell>
                <TableCell>
                  {ex.created_time
                    ? new Date(ex.created_time).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="h-8 w-8"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </>
            ) : (
              <>
                <TableCell>{ex.exercises?.name || "Unknown"}</TableCell>
                <TableCell>{ex.weight_type}</TableCell>
                <TableCell>{ex.weight}</TableCell>
                <TableCell>{ex.reps}</TableCell>
                <TableCell>{ex.notes}</TableCell>
                <TableCell>
                  {ex.created_time
                    ? new Date(ex.created_time).toLocaleDateString()
                    : ""}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(ex)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (advancedMode) {
    return (
      <div className="fixed inset-0 z-50 bg-background p-8 overflow-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your Exercises (Advanced)</h1>
          <Button variant="outline" onClick={() => setAdvancedMode(false)}>
            Exit Advanced
          </Button>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <span className="font-medium">Show:</span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            (from last {TIMEFRAMES.find((tf) => tf.value === days)?.label})
          </span>
        </div>
        <ExerciseChartSelector
          label="Chart Type"
          selected={chartType}
          onChange={(value) => setChartType(value as "line" | "bar" | "area")}
          options={[
            { value: "line", label: "Line" },
            { value: "bar", label: "Bar" },
          ]}
        />
        <ExerciseChartSelector
          label="Exercise"
          selected={selectedExercise}
          onChange={setSelectedExercise}
          options={exerciseOptions}
        />
        {selectedExercise && (
          <ExerciseProgressChart exerciseId={selectedExercise} chartType={chartType} timeRange={days} />
        )}
        {loading ? <div>Loading...</div> : table}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start min-h-[60vh]">
      <div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 mt-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-2">Your Exercises</h1>
            <Button variant="outline" onClick={() => setAdvancedMode(true)}>
              Advanced
            </Button>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <span className="font-medium">Show:</span>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf.value} value={tf.value}>
                    {tf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              (from last {TIMEFRAMES.find((tf) => tf.value === days)?.label})
            </span>
          </div>
          {loading ? <div>Loading...</div> : table}
        </div>
      </div>
    </div>
  )
}