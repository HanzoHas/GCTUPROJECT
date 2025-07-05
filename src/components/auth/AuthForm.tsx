import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, AlertTriangle, Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const inputVariants = {
  invalid: { x: [0, -5, 5, -3, 3, 0], transition: { duration: 0.4 } },
};

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { 
    login, 
    register, 
    sendVerificationCode, 
    setNeedsVerification, 
    setVerificationEmail, 
    setVerificationUsername 
  } = useAuth();
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
        
        try {
          // For registration, we first send a verification code
          await sendVerificationCode(email, username, password, confirmPassword);
          setNeedsVerification(true);
          setVerificationEmail(email);
          setVerificationUsername(username);
          
          // The register function will be called after verification
          toast({
            title: "Verification Required",
            description: "We've sent a verification code to your email",
          });
        } catch (error) {
          if (error instanceof Error && error.message.includes("Email verification required")) {
            // If verification is required, we'll show the verification form
            setNeedsVerification(true);
            setVerificationEmail(email);
            setVerificationUsername(username);
          } else {
            throw error; // Re-throw if it's another type of error
          }
        }
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
    <div className="w-full">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={formVariants}
        key={isLogin ? 'login' : 'register'}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="auth-heading text-gradient-primary">
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isLogin
              ? 'Sign in to connect with students and educators'
              : 'Join our educational community today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your preferred username"
                  className="form-input-animated pl-10"
                  required
                />
                <div className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Student Email Address
            </Label>
            <div className="relative">
              <motion.div variants={inputVariants} animate={emailValid ? undefined : 'invalid'}>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="4231000000@live.gctu.edu.gh"
                  className={`form-input-animated pl-10 ${!emailValid ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  required
                />
              </motion.div>
              <div className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              {email && (
                <div className="absolute right-3 top-2.5 transition-all duration-300">
                  {emailValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500 animate-fade-in" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive animate-fade-in" />
                  )}
                </div>
              )}
            </div>
            {!emailValid && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> 
                Please enter a valid email address
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Password
            </Label>
            <div className="relative">
              <motion.div variants={inputVariants} animate={passwordValid ? undefined : 'invalid'}>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Your password"
                  className={`form-input-animated pl-10 ${!passwordValid ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                  required
                />
              </motion.div>
              <div className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <button
                type="button"
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {!passwordValid && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-sm flex items-center gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Password must be at least 6 characters
              </motion.p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Confirm Password
              </Label>
              <div className="relative">
                <motion.div variants={inputVariants} animate={passwordsMatch ? undefined : 'invalid'}>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your password"
                    className={`form-input-animated pl-10 ${!passwordsMatch ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    required
                  />
                </motion.div>
                <div className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
              </div>
              {!passwordsMatch && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-destructive text-sm flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Passwords do not match
                </motion.p>
              )}
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full h-12 mt-2 ${isLogin ? 'btn-default' : 'btn-gradient'}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                {isLogin ? <ArrowRight className="h-4 w-4 ml-2" /> : <Sparkles className="h-4 w-4 ml-2" />}
              </>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-4 text-xs text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          <motion.button
            type="button"
            className="text-primary hover:text-primary/80 text-sm font-medium w-full text-center hover:underline transition-colors"
            onClick={toggleView}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthForm;
