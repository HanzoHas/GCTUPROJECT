import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, saveSessionToken, clearSessionToken } from '@/lib/convex';
import { useToast } from '@/components/ui/use-toast';
import { Id } from '../../convex/_generated/dataModel';

// Backend returns this shape from auth.me()
interface BackendUser {
  id: Id<"users">;
  username: string;
  email: string; 
  profilePicture?: string;
  status: "Available" | "Busy" | "In class" | "Offline";
  isAdmin: boolean;
}

// Our app needs these additional fields
type User = UserProfile;

// Helper to transform backend user to UserProfile
const transformBackendUser = (backendUser: BackendUser): UserProfile => ({
  ...backendUser,
  role: 'student',
  isOnline: true,
  lastSeen: Date.now()
});

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  sendVerificationCode: (email: string, username: string, password?: string, confirmPassword?: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<boolean>;
  needsVerification: boolean;
  setNeedsVerification: (value: boolean) => void;
  verificationEmail: string;
  setVerificationEmail: (email: string) => void;
  verificationUsername: string;
  setVerificationUsername: (username: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  sendVerificationCode: async (_email?: string, _username?: string, _password?: string, _confirmPassword?: string) => {},
  verifyEmailCode: async () => false,
  needsVerification: false,
  setNeedsVerification: () => {},
  verificationEmail: '',
  setVerificationEmail: () => {},
  verificationUsername: '',
  setVerificationUsername: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationUsername, setVerificationUsername] = useState('');
  const [pendingPassword, setPendingPassword] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Memoize session token access
  const getSessionToken = useCallback(() => localStorage.getItem("sessionToken"), []);

  // Function to check auth status
  const checkAuth = useCallback(async () => {
    try {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const currentUser = await auth.me() as BackendUser | null;
      if (currentUser) {
        setUser(transformBackendUser(currentUser));
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
      
      // Show toast only if there was likely a previous session
      const hadSession = getSessionToken();
      if (hadSession) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, getSessionToken]);

  // Initial auth check on mount
  useEffect(() => {
    const performInitialCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Initial auth check failed:', error);
        setIsLoading(false);
      }
    };

    performInitialCheck();
    
    // Set up periodic auth check every 5 minutes
    const interval = setInterval(() => {
      checkAuth().catch(error => {
        console.error('Periodic auth check failed:', error);
      });
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await auth.login(email, password);
      if (result?.token) {
        saveSessionToken(result.token);
        const currentUser = await auth.me() as BackendUser | null;
        if (currentUser) {
          setUser(transformBackendUser(currentUser));
          setIsAuthenticated(true);
          return { success: true };
        }
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
      return { success: false, error: error.message || 'Login failed' };
    }
  }, [toast]);

  const register = async (username: string, email: string, password: string, confirmPassword?: string) => {
    try {
      const result = await auth.register(username, email, password, confirmPassword);
      if (result?.token) {
        saveSessionToken(result.token);
        const currentUser = await auth.me() as BackendUser | null;
        if (currentUser) {
          setUser(transformBackendUser(currentUser));
          setIsAuthenticated(true);
        }
      } else {
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      if (error.message?.includes("Email verification required")) {
        setNeedsVerification(true);
        setVerificationEmail(email);
        setVerificationUsername(username);
        toast({
          title: "Verification Required",
          description: "Please verify your email address to complete registration.",
        });
      } else {
        toast({
          title: "Registration Failed",
          description: error.message || "Could not create account",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const sendVerificationCode = async (
    email: string,
    username: string,
    password?: string,
    confirmPassword?: string
  ) => {
    try {
      // If first time (password provided), store it for later verification
      if (password) {
        setPendingPassword(password);
        localStorage.setItem("pendingPassword", password);
      }
      const storedPassword = password ?? pendingPassword ?? localStorage.getItem("pendingPassword") ?? undefined;
      await auth.sendVerificationCode(email, username, storedPassword, confirmPassword ?? storedPassword);
      toast({
        title: "Verification Code Sent",
        description: "Check your email for the verification code. It expires in 10 minutes.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Could not send verification code",
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyEmailCode = async (email: string, code: string): Promise<boolean> => {
    const passwordForVerify = pendingPassword ?? localStorage.getItem("pendingPassword") ?? undefined;
    try {
      const result = await auth.verifyEmailCode(email, code, verificationUsername || undefined, passwordForVerify || undefined);
      if (result && result.verified) {
        // clear stored password
        if (passwordForVerify) {
          localStorage.removeItem("pendingPassword");
          setPendingPassword(null);
        }
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
        return true;
      }
      return false;
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    clearSessionToken();
  };

  const refreshUser = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const currentUser = await auth.me() as BackendUser | null;
        if (currentUser) {
          setUser(transformBackendUser(currentUser));
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        register, 
        logout, 
        refreshUser,
        sendVerificationCode,
        verifyEmailCode,
        needsVerification,
        setNeedsVerification,
        verificationEmail,
        setVerificationEmail,
        verificationUsername,
        setVerificationUsername
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 