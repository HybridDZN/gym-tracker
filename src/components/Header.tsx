"use client"

import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar"
import { NutIcon, Dumbbell, User, SunMoon, LogOut, Settings } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>
          <NutIcon className="mr-2 h-4 w-4" />
          Input
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          <Dumbbell className="mr-2 h-4 w-4" />
          Workouts
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          <User className="mr-2 h-4 w-4" />
          Profile
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </MenubarItem>
          <MenubarItem>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <SunMoon className="mr-2 h-4 w-4" />
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  )
}

export default Header
