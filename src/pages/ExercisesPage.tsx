import { useEffect, useState } from "react"
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

const TIMEFRAMES = [
  { label: "1 Day", value: "1" },
  { label: "3 Days", value: "3" },
  { label: "7 Days", value: "7" },
  { label: "1 Month", value: "30" },
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {exercises.map((ex) => (
          <TableRow key={ex.id}>
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