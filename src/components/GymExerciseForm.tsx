// components/GymExerciseForm.tsx
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
	// FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";

// Extra imports
import { toast } from "sonner";
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider";
import supabase from "@/supabase";
import { useEffect, useState } from "react";


const formSchema = z.object({
    exercise: z.number({ invalid_type_error: "Select an exercise" }),
    weightType: z.string().min(1, "Select a weight type"),
    weight: z
        .number({ invalid_type_error: "Weight must be a number" })
        .positive("Must be greater than 0")
        .max(1000)
        .refine((val) => Number(val.toFixed(3)) === val, {
            message: "Up to 3 decimal places only",
        }),
    reps: z
        .number({ invalid_type_error: "Reps must be a number" })
        .int("Must be an integer")
        .positive("Must be positive"),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function GymExerciseForm() {
    const [exerciseOptions, setExerciseOptions] = useState<{ exercise_id: number; name: string }[]>([]);
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			exercise: undefined,
			weightType: "",
			weight: 0,
			reps: 0,
			notes: "",
		},
	});

	useEffect(() => {
		async function fetchExercises() {
			const { data, error } = await supabase
				.from("exercises")
				.select("exercise_id, name");
			if (!error && data) setExerciseOptions(data);
		}
		fetchExercises();
	}, []);

async function onSubmit(formData: FormValues) {
//   console.log("Submitting:", formData);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    toast.error("You must be logged in to submit a workout.");
    // console.error("Auth error:", userError);
    return;
  }
//   console.log("user.id:", user.id);
  const dataToSend = {
    exercise_id: formData.exercise,
    weight_type: formData.weightType,
    weight: formData.weight,
    reps: formData.reps,
    notes: formData.notes || null,
    user_id: user.id,
  };
//   console.log("Correct User? ", dataToSend.user_id === user.id);
  const { error } = await supabase
    .from("workouts")
    .insert([dataToSend])

  if (error) {
    // console.error("Insert error:", error);
    toast.error("Failed to log workout.");
    return;
  }

  toast.success("Workout logged successfully!");
}

	return (
		<Form {...form}>
			<ThemeProvider
				defaultTheme="dark"
				storageKey="vite-ui-theme"
			>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="exercise"
					render={({ field }) => (
						<FormItem className="text-left">
							<FormLabel>Exercise</FormLabel>
							<Select
								onValueChange={(val) => field.onChange(Number(val))}
								defaultValue={field.value ? String(field.value) : undefined}
							>
								<FormControl className="w-full">
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select exercise" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{exerciseOptions.map((ex) => (
										<SelectItem key={ex.exercise_id} value={String(ex.exercise_id)}>
											{ex.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="weightType"
					render={({ field }) => (
						<FormItem className="text-left">
							<FormLabel>Weight Type</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value}
							>
								<FormControl className="w-full">
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select weight type" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="barbell">Barbell</SelectItem>
									<SelectItem value="dumbbell">Dumbbell</SelectItem>
									<SelectItem value="cable">Cable</SelectItem>
									<SelectItem value="plate_loaded_machine">Machine</SelectItem>
									<SelectItem value="bodyweight">Body Weight</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="weight"
					render={({ field }) => (
						<FormItem className="text-left">
							<FormLabel>Weight (kg)</FormLabel>
							<FormControl className="w-full">
								<Input
									className="w-full"
									type="number"
									step="0.001"
									{...field}
									onChange={(e) =>
										field.onChange(
											parseFloat(e.target.value)
										)
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="reps"
					render={({ field }) => (
						<FormItem className="text-left">
							<FormLabel>Reps</FormLabel>
							<FormControl className="w-full">
								<Input
									className="w-full"
									type="number"
									{...field}
									onChange={(e) =>
										field.onChange(parseInt(e.target.value))
									}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem className="text-left">
							<FormLabel>Notes</FormLabel>
							<FormControl className="w-full">
								<Textarea
									className="w-full"
									placeholder="Optional notes..."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit">Submit</Button>
			</form>
			<Toaster position="bottom-center" richColors />
			</ThemeProvider>
		</Form>
	);
}
export default GymExerciseForm;
