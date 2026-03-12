import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { email, password, pseudo };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Une erreur est survenue.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00F5A0]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00D9FF]/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-gradient-to-br from-[#00F5A0] to-[#00D9FF] rounded-[24px] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,245,160,0.2)] relative group"
          >
            <Sparkles className="w-10 h-10 text-black group-hover:rotate-12 transition-transform duration-500" />
            <div className="absolute inset-0 rounded-[24px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Tflow IA</h1>
          <p className="text-[#9CA3AF] text-center font-medium">L'intelligence artificielle réinventée.</p>
        </div>

        <div className="bg-[#111827]/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl">
          <div className="flex bg-black/20 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-white text-black shadow-lg' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Connexion
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-white text-black shadow-lg' : 'text-[#9CA3AF] hover:text-white'}`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">Pseudo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#00F5A0] transition-colors" />
                    <input 
                      type="text" 
                      value={pseudo}
                      onChange={(e) => setPseudo(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all duration-300 placeholder:text-white/10"
                      placeholder="Abdelmalek"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#00F5A0] transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all duration-300 placeholder:text-white/10"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.1em] ml-1">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#00F5A0] transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all duration-300 placeholder:text-white/10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-400 text-xs bg-red-400/5 p-4 rounded-2xl border border-red-400/10 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white hover:bg-white/90 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 mt-4 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] opacity-0 group-hover:opacity-10 transition-opacity" />
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)}
              <span className="relative z-10">{isLogin ? 'Se connecter' : 'Créer mon compte'}</span>
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[11px] text-[#9CA3AF] uppercase tracking-[0.2em] font-bold opacity-50">
          Tflow IA © 2026 — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
};
