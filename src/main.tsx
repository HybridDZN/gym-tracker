import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import router from "./router";
import { RouterProvider } from "react-router-dom";
// import { GymExerciseForm } from "./components/GymExerciseForm.tsx"; // Testing GymExerciseForm
// import { Header } from "./components/Header.tsx"; // Importing Header component

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		{/* <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background p-4">
			<div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 space-y-4">
			<Header />
			<GymExerciseForm />
			</div>
		</div> */}
		<RouterProvider router={router}/>
	</React.StrictMode>
);
