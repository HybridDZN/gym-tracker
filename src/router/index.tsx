import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "../pages/404Page.tsx";
import Providers from "../Providers.tsx";
import { AuthPage } from "@/pages/AuthPage.tsx";
import GymExerciseForm from "@/components/GymExerciseForm.tsx";
import Header from "@/components/Header.tsx";
import { ExercisesPage } from "@/pages/ExercisesPage.tsx";
const router = createBrowserRouter([
  // I recommend you reflect the routes here in the pages folder
  {
    path: "/",
    element: <Providers />,
    children: [
      // Public routes
      {
        path: "/",
        element: <AuthPage />,
      },
      // Auth Protected routes
      {
        path: "/input",
        element: (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 space-y-4">
              <Header />
              <GymExerciseForm />
            </div>
          </div>
        ),
        // Example of how to protect a route. It has been used above for GymExerciseForm.
        // children: [
        //   {
        //     path: "/protected",
        //     element: <ProtectedPage />,
        //   },
        // ],
      },
      {
        path: "/exercises",
        element: <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-card rounded-2xl shadow-xl p-6 space-y-4">
              <Header />
              <ExercisesPage />
            </div>
          </div>
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
