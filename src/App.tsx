import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';
import { ChatApp } from './ChatApp';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-[#00F5A0]" />
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="h-screen"
        >
          <ChatApp />
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AuthPage />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
