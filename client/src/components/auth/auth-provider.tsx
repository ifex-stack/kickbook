import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  teamId: number | null;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const defaultUser = {
  id: 1,
  name: "John Coach",
  username: "admin",
  email: "admin@example.com",
  role: "admin",
  teamId: 1
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        // If not authenticated and not on auth pages, redirect to login
        if (!location.startsWith("/login") && !location.startsWith("/register")) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // In development mode, use demo data for testing
    if (process.env.NODE_ENV === "development") {
      const createDemoData = async () => {
        try {
          // Create demo data and get the admin user from server
          const response = await apiRequest("POST", "/api/demo-data");
          const data = await response.json();
          
          // Use the admin user data from the response, which is now authenticated on the server
          if (data.admin) {
            setUser({
              id: data.admin.id,
              name: data.admin.name,
              username: data.admin.username,
              email: data.admin.email,
              role: data.admin.role,
              teamId: data.admin.teamId
            });
          } else {
            // Fallback to checking auth if no admin data
            await checkAuth();
          }
        } catch (error) {
          console.error("Failed to create demo data", error);
          
          // Check if user is already logged in
          await checkAuth();
        } finally {
          setIsLoading(false);
        }
      };
      
      createDemoData();
    } else {
      checkAuth();
    }
  }, [location, navigate]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${userData.name}!`,
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await response.json();
      setUser(newUser);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. Welcome to KickBook!",
      });
      
      navigate("/");
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.message && error.message.includes("Username already exists")) {
        errorMessage = "Username already exists. Please choose another one.";
      } else if (error.message && error.message.includes("Email already exists")) {
        errorMessage = "Email already exists. Please use another email or login.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = isAuthenticated && user?.role === "admin";

  // Redirect to login if not authenticated on protected routes
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !location.startsWith("/login") && !location.startsWith("/register")) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, location, navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
