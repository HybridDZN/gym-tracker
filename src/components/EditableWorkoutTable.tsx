import { useState, useRef, useEffect } from "react"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import type { ValidatedWorkoutSet } from "@/lib/workout-validator"
import { validateWorkoutSets } from "@/lib/workout-validator"

interface EditableWorkoutTableProps {
  sets: ValidatedWorkoutSet[]
  exerciseOptions: { exercise_id: number; name: string }[]
  onUpdate: (sets: ValidatedWorkoutSet[]) => void
  onSave: (sets: ValidatedWorkoutSet[]) => Promise<void>
  onCancel?: () => void
}

type EditableField = "exercise_id" | "weight_type" | "weight" | "reps" | "notes"

export function EditableWorkoutTable({
  sets: initialSets,
  exerciseOptions,
  onUpdate,
  onSave,
  onCancel,
}: EditableWorkoutTableProps) {
  const [sets, setSets] = useState<ValidatedWorkoutSet[]>(initialSets)
  const [editingCell, setEditingCell] = useState<{ row: number; field: EditableField } | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Update local state when initialSets change
  useEffect(() => {
    setSets(initialSets)
  }, [initialSets])

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [editingCell])

  const getCellValue = (row: number, field: EditableField): string => {
    const set = sets[row]
    if (!set) return ""
    switch (field) {
      case "exercise_id":
        return String(set.exercise_id)
      case "weight_type":
        return set.weight_type
      case "weight":
        return String(set.weight)
      case "reps":
        return String(set.reps)
      case "notes":
        return set.notes || ""
      default:
        return ""
    }
  }

  const startEditing = (row: number, field: EditableField) => {
    setEditingCell({ row, field })
    setEditValue(getCellValue(row, field))
    setErrors({})
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValue("")
    setErrors({})
  }

  const validateAndSave = (row: number, field: EditableField, value: string): boolean => {
    const set = sets[row]
    if (!set) return false

    const errorKey = `${row}-${field}`
    let isValid = true
    let parsedValue: any = value

    try {
      switch (field) {
        case "exercise_id": {
          const num = parseInt(value)
          if (isNaN(num) || !exerciseOptions.find((ex) => ex.exercise_id === num)) {
            setErrors((prev) => ({ ...prev, [errorKey]: "Invalid exercise" }))
            isValid = false
          } else {
            parsedValue = num
          }
          break
        }
        case "weight_type": {
          const validTypes = ["barbell", "dumbbell", "cable", "plate_loaded_machine", "bodyweight"]
          if (!validTypes.includes(value)) {
            setErrors((prev) => ({ ...prev, [errorKey]: "Invalid weight type" }))
            isValid = false
          } else {
            parsedValue = value
          }
          break
        }
        case "weight": {
          const num = parseFloat(value)
          if (isNaN(num) || num <= 0 || num > 1000) {
            setErrors((prev) => ({
              ...prev,
              [errorKey]: "Weight must be between 0 and 1000",
            }))
            isValid = false
          } else {
            // Round to 3 decimal places
            parsedValue = Math.round(num * 1000) / 1000
          }
          break
        }
        case "reps": {
          const num = parseInt(value)
          if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            setErrors((prev) => ({ ...prev, [errorKey]: "Reps must be a positive integer" }))
            isValid = false
          } else {
            parsedValue = num
          }
          break
        }
        case "notes": {
          parsedValue = value
          break
        }
      }

      if (isValid) {
        const updatedSets = [...sets]
        updatedSets[row] = { ...updatedSets[row], [field]: parsedValue }
        setSets(updatedSets)
        onUpdate(updatedSets)
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[errorKey]
          return newErrors
        })
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [errorKey]: "Invalid value" }))
      isValid = false
    }

    return isValid
  }

  const handleSave = () => {
    if (editingCell) {
      const isValid = validateAndSave(editingCell.row, editingCell.field, editValue)
      if (isValid) {
        cancelEditing()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEditing()
    } else if (e.key === "Tab" && editingCell) {
      // Allow tab to save and move to next cell
      e.preventDefault()
      if (validateAndSave(editingCell.row, editingCell.field, editValue)) {
        // Move to next field or next row
        const fields: EditableField[] = ["exercise_id", "weight_type", "weight", "reps", "notes"]
        const currentIndex = fields.indexOf(editingCell.field)
        if (currentIndex < fields.length - 1) {
          startEditing(editingCell.row, fields[currentIndex + 1])
        } else if (editingCell.row < sets.length - 1) {
          startEditing(editingCell.row + 1, "exercise_id")
        } else {
          cancelEditing()
        }
      }
    }
  }

  const handleDelete = (index: number) => {
    const updatedSets = sets.filter((_, i) => i !== index)
    setSets(updatedSets)
    onUpdate(updatedSets)
    toast.success("Set removed")
  }

  const handleSubmitAll = async () => {
    // Final validation
    const availableExerciseIds = exerciseOptions.map((ex) => ex.exercise_id)
    const validation = validateWorkoutSets(sets, availableExerciseIds)

    if (!validation.isValid) {
      toast.error("Please fix validation errors before saving")
      // Show errors
      validation.errors.forEach((err) => {
        const errorKey = `${err.index}-${err.field}`
        setErrors((prev) => ({ ...prev, [errorKey]: err.message }))
      })
      return
    }

    setIsSaving(true)
    try {
      await onSave(validation.sets)
      toast.success("Workout saved successfully!")
    } catch (error) {
      toast.error("Failed to save workout")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const getExerciseName = (exerciseId: number): string => {
    return exerciseOptions.find((ex) => ex.exercise_id === exerciseId)?.name || "Unknown"
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No workout sets to display. Start by recording a voice input.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Weight Type</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((set, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Exercise */}
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(rowIndex, "exercise_id")}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === "exercise_id" ? (
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        setEditValue(value)
                        validateAndSave(rowIndex, "exercise_id", value)
                        cancelEditing()
                      }}
                      onOpenChange={(open) => {
                        if (!open) cancelEditing()
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseOptions.map((ex) => (
                          <SelectItem key={ex.exercise_id} value={String(ex.exercise_id)}>
                            {ex.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="py-2">{getExerciseName(set.exercise_id)}</div>
                  )}
                  {errors[`${rowIndex}-exercise_id`] && (
                    <p className="text-xs text-destructive mt-1">
                      {errors[`${rowIndex}-exercise_id`]}
                    </p>
                  )}
                </TableCell>

                {/* Weight Type */}
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(rowIndex, "weight_type")}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === "weight_type" ? (
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        setEditValue(value)
                        validateAndSave(rowIndex, "weight_type", value)
                        cancelEditing()
                      }}
                      onOpenChange={(open) => {
                        if (!open) cancelEditing()
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barbell">Barbell</SelectItem>
                        <SelectItem value="dumbbell">Dumbbell</SelectItem>
                        <SelectItem value="cable">Cable</SelectItem>
                        <SelectItem value="plate_loaded_machine">Machine</SelectItem>
                        <SelectItem value="bodyweight">Body Weight</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="py-2 capitalize">{set.weight_type.replace("_", " ")}</div>
                  )}
                  {errors[`${rowIndex}-weight_type`] && (
                    <p className="text-xs text-destructive mt-1">
                      {errors[`${rowIndex}-weight_type`]}
                    </p>
                  )}
                </TableCell>

                {/* Weight */}
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(rowIndex, "weight")}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === "weight" ? (
                    <Input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="number"
                      step="0.001"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="w-24"
                    />
                  ) : (
                    <div className="py-2">{set.weight}</div>
                  )}
                  {errors[`${rowIndex}-weight`] && (
                    <p className="text-xs text-destructive mt-1">
                      {errors[`${rowIndex}-weight`]}
                    </p>
                  )}
                </TableCell>

                {/* Reps */}
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => startEditing(rowIndex, "reps")}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === "reps" ? (
                    <Input
                      ref={inputRef as React.RefObject<HTMLInputElement>}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="w-20"
                    />
                  ) : (
                    <div className="py-2">{set.reps}</div>
                  )}
                  {errors[`${rowIndex}-reps`] && (
                    <p className="text-xs text-destructive mt-1">
                      {errors[`${rowIndex}-reps`]}
                    </p>
                  )}
                </TableCell>

                {/* Notes */}
                <TableCell
                  className="cursor-pointer hover:bg-muted/50 min-w-[150px]"
                  onClick={() => startEditing(rowIndex, "notes")}
                >
                  {editingCell?.row === rowIndex && editingCell?.field === "notes" ? (
                    <Textarea
                      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={handleKeyDown}
                      className="min-h-[60px]"
                      rows={2}
                    />
                  ) : (
                    <div className="py-2 text-sm">{set.notes || "-"}</div>
                  )}
                  {errors[`${rowIndex}-notes`] && (
                    <p className="text-xs text-destructive mt-1">
                      {errors[`${rowIndex}-notes`]}
                    </p>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rowIndex)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={handleSubmitAll} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save All to Database"}
        </Button>
      </div>
    </div>
  )
}

