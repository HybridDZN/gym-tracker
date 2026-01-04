"use client"

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar"
import { NutIcon, User, LogOut, Table, Mic } from "lucide-react"
import { useNavigate } from "react-router-dom"
import supabase from "@/supabase"
import { toast } from "sonner"

type TabType = "input" | "exercises" | "bulk"

interface HeaderProps {
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Logged out!")
    navigate("/")
  }

  const handleTabClick = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      // Fallback for legacy usage - navigate with query params
      if (tab === "exercises") {
        navigate("/dashboard?tab=exercises")
      } else if (tab === "bulk") {
        navigate("/dashboard?tab=bulk")
      } else {
        navigate("/dashboard")
      }
    }
  }

  return (
    <Menubar className="mb-8">
      <MenubarMenu>
        <MenubarTrigger 
          onClick={() => handleTabClick("input")}
          data-state={activeTab === "input" ? "active" : undefined}
        >
          <NutIcon className="mr-2 h-4 w-4" />
          Input
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger 
          onClick={() => handleTabClick("bulk")}
          data-state={activeTab === "bulk" ? "active" : undefined}
        >
          <Mic className="mr-2 h-4 w-4" />
          Bulk Input
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger 
          onClick={() => handleTabClick("exercises")}
          data-state={activeTab === "exercises" ? "active" : undefined}
        >
          <Table className="mr-2 h-4 w-4" />
          Exercises
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          <User className="mr-2 h-4 w-4" />
          Profile
        </MenubarTrigger>
        <MenubarContent>
          {/* <MenubarItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </MenubarItem> */}
          <MenubarItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  )
}

export default Header
