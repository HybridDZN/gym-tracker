import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import GymExerciseForm from "@/components/GymExerciseForm"

function InputPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Replace this with actual logout logic
    // Example: supabase.auth.signOut().then(() => navigate("/login"))
    console.log("Logging out...")
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-md">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Exercise Input</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex justify-center mt-10 px-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardContent className="p-6">
            <GymExerciseForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default InputPage