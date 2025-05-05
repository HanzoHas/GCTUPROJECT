
import React from 'react';
import { motion } from 'framer-motion';
import AuthForm from './AuthForm';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cover bg-center" 
         style={{
           backgroundImage: `url('/lovable-uploads/81f6f589-59fa-4d86-8d42-3055c443966b.png')`,
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         }}>
      {/* Info Panel */}
      <motion.div 
        className="md:w-1/2 bg-black/40 text-white p-8 md:p-12 flex items-center justify-center"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">GCTU Chat App</h1>
            <p className="text-lg md:text-xl mb-6">
              Connecting students and educators at Ghana Communication Technology University
            </p>
          </motion.div>
          
          <motion.ul
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Connect with classmates and educators</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Create and join study groups</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Share resources and collaborate on projects</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Stay updated with important announcements</span>
            </li>
          </motion.ul>
        </div>
      </motion.div>
      
      {/* Form Panel */}
      <motion.div 
        className="md:w-1/2 bg-black/40 p-8 md:p-12 flex items-center justify-center"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AuthForm />
      </motion.div>
    </div>
  );
};

export default AuthLayout;
