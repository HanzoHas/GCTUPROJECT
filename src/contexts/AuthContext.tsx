import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { auth, saveSessionToken, clearSessionToken, UserProfile } from '../lib/convex';
import { useToast } from '@/components/ui/use-toast';

type User = UserProfile;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          clearSessionToken();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsAuthenticated(false);
        clearSessionToken();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await auth.login(email, password);
      if (result && result.token) {
        saveSessionToken(result.token);
        const currentUser = await auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } else {
        throw new Error("Login failed");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    try {
      const result = await auth.register(username, email, password, confirmPassword);
      if (result && result.token) {
        saveSessionToken(result.token);
        const currentUser = await auth.me();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } else {
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    clearSessionToken();
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated) {
        const currentUser = await auth.me();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
