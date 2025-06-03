import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react"

type Theme = "light" | "dark" | "system"

type ThemeProviderProps = {
	children: ReactNode
	defaultTheme?: Theme
	storageKey?: string
}

type ThemeContextValue = {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return defaultTheme
		return (localStorage.getItem(storageKey) as Theme) || defaultTheme
	})

	const applyTheme = (theme: Theme) => {
		const root = window.document.documentElement
		root.classList.remove("light", "dark")

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			root.classList.add(systemTheme)
		} else {
			root.classList.add(theme)
		}
	}

	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	const setTheme = (newTheme: Theme) => {
		localStorage.setItem(storageKey, newTheme)
		setThemeState(newTheme)
		applyTheme(newTheme)
	}

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}
