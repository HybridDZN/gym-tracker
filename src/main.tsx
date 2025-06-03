import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.tsx";
// import Form from "./BasicForm.tsx";
// import ProfileForm from "./components/Form.tsx"; // Testing form
import { GymExerciseForm } from "./components/GymExerciseForm.tsx"; // Testing GymExerciseForm
import { Header } from "./components/Header.tsx"; // Importing Header component

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background p-4">
			<div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 space-y-4">
			<Header />
			<GymExerciseForm />
			</div>
		</div>
	</StrictMode>
);
