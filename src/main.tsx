import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.tsx";
// import Form from "./BasicForm.tsx";
// import ProfileForm from "./components/Form.tsx"; // Testing form
import { GymExerciseForm } from "./components/GymExerciseForm.tsx"; // Testing GymExerciseForm

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<GymExerciseForm />
	</StrictMode>
);
