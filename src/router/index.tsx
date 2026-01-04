import { createBrowserRouter, Navigate } from "react-router-dom";
import NotFoundPage from "../pages/404Page.tsx";
import Providers from "../Providers.tsx";
import { AuthPage } from "@/pages/AuthPage.tsx";
import { DashboardPage } from "@/pages/DashboardPage.tsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Providers />,
    children: [
      // Public routes
      {
        path: "/",
        element: <AuthPage />,
      },
      // Auth Protected routes - single dashboard route with query params for tabs
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      // Legacy route redirects for backward compatibility
      {
        path: "/input",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/exercises",
        element: <Navigate to="/dashboard?tab=exercises" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
