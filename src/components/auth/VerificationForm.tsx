import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Mail, Loader2, RefreshCw, Timer } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const VerificationForm = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { 
    needsVerification, 
    setNeedsVerification, 
    verificationEmail, 
    verificationUsername,
    sendVerificationCode, 
    verifyEmailCode
  } = useAuth();
  const { toast } = useToast();

  // Remove auto-send on mount - the code is already sent from registration form

  useEffect(() => {
    // Countdown timer for resend code function
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!verificationEmail || !verificationUsername) {
      toast({
        title: "Error",
        description: "Email or username is missing",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);
    try {
      await sendVerificationCode(verificationEmail, verificationUsername);
      setCountdown(60); // 60 seconds cooldown before resend
    } catch (error) {
      console.error('Failed to send verification code:', error);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await verifyEmailCode(verificationEmail, code);
      if (success) {
        toast({
          title: "Success!",
          description: "Your email has been verified. You can now log in.",
        });
        setNeedsVerification(false);
      }
    } catch (error) {
      console.error('Verification failed:', error);
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
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="auth-heading text-gradient-primary">
            Verify Your Email
          </h2>
          <p className="text-muted-foreground text-sm">
            We've sent a verification code to <span className="text-primary font-medium">{verificationEmail}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-center text-center">
              <Mail className="h-12 w-12 text-primary opacity-80" />
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
            
            <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 btn-gradient"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify Email
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <div className="flex justify-center mt-4">
            <Button 
              type="button"
              variant="ghost" 
              className="text-sm text-muted-foreground"
              onClick={handleSendCode}
              disabled={resendLoading || countdown > 0}
            >
              {resendLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <Timer className="h-3 w-3 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Resend code
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default VerificationForm; 