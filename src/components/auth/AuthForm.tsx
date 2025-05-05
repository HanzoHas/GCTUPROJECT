
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const formVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
};

const inputVariants = {
  invalid: { x: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } },
};

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation states
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailValid(validateEmail(value) || value === '');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValid(validatePassword(value) || value === '');
    
    if (!isLogin) {
      setPasswordsMatch(value === confirmPassword || confirmPassword === '');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(value === password || value === '');
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailValid(true);
    setPasswordValid(true);
    setPasswordsMatch(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailValid || !passwordValid || (!isLogin && !passwordsMatch)) {
      return;
    }
    
    try {
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
        toast({
          title: "Success!",
          description: "Logged in successfully",
        });
      } else {
        if (password !== confirmPassword) {
          setPasswordsMatch(false);
          return;
        }
        
        await register(username, email, password);
        toast({
          title: "Account created!",
          description: "Your account has been created successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Authentication failed, please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={formVariants}
        key={isLogin ? 'login' : 'register'}
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <p className="text-muted-foreground">
            {isLogin
              ? 'Sign in to connect with students and educators'
              : 'Join our educational community today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your preferred username"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <motion.div variants={inputVariants} animate={emailValid ? undefined : 'invalid'}>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  className={`${!emailValid ? 'border-destructive' : ''}`}
                  required
                />
              </motion.div>
              {email && (
                <div className="absolute right-3 top-2.5">
                  {emailValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {!emailValid && (
              <p className="text-destructive text-sm">Please enter a valid email address</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <motion.div variants={inputVariants} animate={passwordValid ? undefined : 'invalid'}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Your password"
                  className={`${!passwordValid ? 'border-destructive' : ''}`}
                  required
                />
              </motion.div>
              <button
                type="button"
                className="absolute right-3 top-2.5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
            {!passwordValid && (
              <p className="text-destructive text-sm">Password must be at least 6 characters long</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <motion.div variants={inputVariants} animate={passwordsMatch ? undefined : 'invalid'}>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your password"
                    className={`${!passwordsMatch ? 'border-destructive' : ''}`}
                    required
                  />
                </motion.div>
                {confirmPassword && (
                  <div className="absolute right-3 top-2.5">
                    {passwordsMatch ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {!passwordsMatch && (
                <p className="text-destructive text-sm">Passwords don't match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!emailValid || !passwordValid || (!isLogin && !passwordsMatch))}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleView}
              className="font-medium text-primary hover:underline focus:outline-none"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
