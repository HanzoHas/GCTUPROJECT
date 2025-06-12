import React from 'react';
import { motion } from 'framer-motion';
import AuthForm from './AuthForm';
import { CheckCircle2 } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="auth-layout">
      {/* Advanced Animated Background with Mesh + Noise */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-800/30 via-background to-accent-800/20 animate-gradient-xy"></div>
        <div className="absolute inset-0 bg-mesh-dense opacity-60"></div>
        <div className="absolute inset-0 bg-noise mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-grid opacity-[0.015] dark:opacity-[0.03]"></div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/70 via-accent/70 to-primary/70"></div>
      <div className="absolute top-12 left-12 w-32 h-32 bg-primary-200 dark:bg-primary-900 rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
      <div className="absolute bottom-12 right-12 w-40 h-40 bg-accent-300 dark:bg-accent-900 rounded-full blur-3xl opacity-20 animate-pulse-glow"></div>
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/30 dark:bg-accent/20 rounded-full blur-2xl animate-float-slow"></div>
      
      {/* Info Panel */}
      <motion.div 
        className="lg:w-1/2 p-8 md:p-16 flex items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="max-w-xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/lovable-uploads/81f6f589-59fa-4d86-8d42-3055c443966b.png"
                alt="GCTU Logo" 
                className="w-12 h-12 object-contain"
              />
              <h1 className="font-display font-bold text-2xl text-gradient-primary">
                Ghana Communication<br />Technology University
              </h1>
            </div>

            <div className="mt-6">
              <h2 className="text-4xl font-bold tracking-tight font-display mb-4">
                Empowering <span className="text-primary">Students</span> through Technology
              </h2>
              <p className="text-muted-foreground text-lg">
                Join our platform to connect with fellow students, access course materials, and enhance your learning experience.
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-8 space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Modern Learning Platform</h3>
                <p className="text-muted-foreground">Access course materials, submit assignments, and track your progress.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Connect with Peers</h3>
                <p className="text-muted-foreground">Join discussion groups, chat with classmates, and collaborate on projects.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Communication</h3>
                <p className="text-muted-foreground">Receive instant notifications about grades, events, and announcements.</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="mt-10 pt-6 border-t border-border/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <p className="text-sm text-muted-foreground">
              © 2023 Ghana Communication Technology University. 
              <br />All rights reserved.
            </p>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Form Panel with Glass Card */}
      <motion.div 
        className="lg:w-1/2 p-6 md:p-12 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <div className="w-full max-w-md glass-card shadow-float p-8 rounded-xl animate-fade-in-blur">
          <AuthForm />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
