import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import supabase from "@/supabase";
import { useSession } from "@/context/SessionContext";

export function AuthPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle login with email and password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Logged in successfully!");
      // Redirect or handle successful login
    } catch (e) {
      const error = e as Error;
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration with email and password
  // const handleRegister = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   try {
  //     setLoading(true);

  //     const { error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //     });

  //     if (error) throw error;

  //     toast.success(
  //       "Registration successful! Please check your email for verification."
  //     );
  //     // Optionally redirect to login tab or show verification message
  //   } catch (e) {
  //     const error = e as Error;
  //     toast.error(error.message || "Failed to register");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    if (session) {
      navigate("/input");
    }
  }, [session, navigate]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-black">
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-primary/70">
        {/* <Link to="/" className="text-secondary hover:underline">
          Home
        </Link> */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md p-8 pb-18 pt-12 rounded-md shadow-md bg-white">
            <Tabs defaultValue="login" className="w-full">
              <div className="flex flex-col items-center gap-2 mb-2 text-center">
                <img src="\images\acorn.png" alt="logo" width={150} height={150} />
                <h1 className="text-2xl font-bold text-primary">GoNuts</h1>
                <p className="text-primary opacity-80 font-medium">
                  Minimalist gym tracker
                </p>
              </div>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="login">Login</TabsTrigger>
                {/* <TabsTrigger value="register">Register</TabsTrigger> */}
              </TabsList>

              {/* Login Tab Content */}
              <TabsContent value="login">
                <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="login-password">Password</Label>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Logging In..." : "Login"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              {/* Register Tab Content */}
              {/* <TabsContent value="register">
                <form className="flex flex-col gap-6" onSubmit={handleRegister}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating Account..." : "Register"}
                    </Button>
                  </div>
                </form>
              </TabsContent> */}
            </Tabs>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="\images\background.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
