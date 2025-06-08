"use client"

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar"
import { NutIcon, User, LogOut, Table } from "lucide-react"
import { useNavigate } from "react-router-dom"
import supabase from "@/supabase"
import { toast } from "sonner"

export function Header() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success("Logged out!")
    navigate("/")
  }

  return (
    <Menubar className="mb-8">
      <MenubarMenu>
        <MenubarTrigger onClick={() => navigate("/input")}>
          <NutIcon className="mr-2 h-4 w-4" />
          Input
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger onClick={() => navigate("/exercises")}>
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
