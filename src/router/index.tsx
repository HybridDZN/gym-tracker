import { createBrowserRouter } from "react-router-dom";
import NotFoundPage from "../pages/404Page.tsx";
import Providers from "../Providers.tsx";
import { AuthPage } from "@/pages/AuthPage.tsx";
import GymExerciseForm from "@/components/GymExerciseForm.tsx";

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
      {
        path: "/auth",
        element: <AuthPage />,
      },
      // Auth Protected routes
      {
        path: "/input",
        element: <GymExerciseForm />,
        // Example of how to protect a route. It has been used above for GymExerciseForm.
        // children: [
        //   {
        //     path: "/protected",
        //     element: <ProtectedPage />,
        //   },
        // ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
