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

export function ExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_time", { ascending: false })
      if (!error) setExercises(data || [])
      setLoading(false)
    }
    fetchExercises()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-4">Your Exercises</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6">
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
                  <TableCell>{ex.exercise}</TableCell>
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
        </div>
      )}
    </div>
  )
}