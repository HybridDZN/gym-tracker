import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemeProvider } from "@/components/theme-provider";

export function Form() {
	return (
		<>
			<ThemeProvider
				defaultTheme="dark"
				storageKey="vite-ui-theme"
			></ThemeProvider>
			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Label htmlFor="text">Exercise</Label>
				<Input type="text" id="exercise" placeholder="Exercise" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Label htmlFor="text">Weight Type</Label>
				<Input type="text" id="weight-type" placeholder="Weight Type" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Label htmlFor="text">Weight</Label>
				<Input type="text" id="weight" placeholder="Weight (kg)" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Label htmlFor="text">Reps</Label>
				<Input type="text" id="reps" placeholder="Reps" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Label htmlFor="text">Notes</Label>
				<Textarea type="text" id="notes" placeholder="Notes" />
			</div>

			<div className="grid w-full max-w-sm items-center gap-3 m-8">
				<Button variant="outline">Submit</Button>
			</div>
		</>
	);
}

export default Form;
