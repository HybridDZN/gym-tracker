import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const Providers = () => {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Outlet />
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  );
};

export default Providers;
