import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header.tsx";
import GymExerciseForm from "@/components/GymExerciseForm.tsx";
import { ExercisesPage } from "@/pages/ExercisesPage.tsx";
import { BulkInputPage } from "@/pages/BulkInputPage.tsx";
import { useSession } from "@/context/SessionContext";

type TabType = "input" | "exercises" | "bulk";

export function DashboardPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize tab from query parameter, default to "input"
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get("tab") as TabType;
    if (tab === "exercises") return "exercises";
    if (tab === "bulk") return "bulk";
    return "input";
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Update active tab when query parameter changes (e.g., browser back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab") as TabType;
    if (tab === "exercises") {
      setActiveTab("exercises");
    } else if (tab === "bulk") {
      setActiveTab("bulk");
    } else {
      setActiveTab("input");
    }
  }, [searchParams]);

  // Update URL query parameter when tab changes via Header
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "exercises") {
      setSearchParams({ tab: "exercises" }, { replace: true });
    } else if (tab === "bulk") {
      setSearchParams({ tab: "bulk" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true }); // Remove tab param for default
    }
  };

  if (!session) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background p-4">
      <div className={`w-full ${activeTab === "bulk" ? "max-w-4xl" : "max-w-2xl"} bg-white dark:bg-card rounded-2xl shadow-xl p-6 space-y-4`}>
        <Header activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === "input" && <GymExerciseForm />}
        {activeTab === "exercises" && <ExercisesPage />}
        {activeTab === "bulk" && <BulkInputPage />}
      </div>
    </div>
  );
}
