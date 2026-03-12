import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Conversation, Message } from './types';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  LogOut, 
  Send, 
  Menu, 
  X, 
  User as UserIcon, 
  Cpu,
  Crown,
  ShieldCheck,
  Loader2,
  Sparkles,
  ChevronRight,
  ArrowUp,
  Key,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAIResponse } from './services/ai';
import { cn } from './lib/utils';

export const ChatApp: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [vipKey, setVipKey] = useState('');
  const [settingsPseudo, setSettingsPseudo] = useState(user?.pseudo || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConvId) {
      fetchMessages(currentConvId);
    } else {
      setMessages([]);
    }
  }, [currentConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    const res = await fetch('/api/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  };

  const fetchMessages = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    const tempInput = input;
    setInput('');
    
    let convId = currentConvId;
    if (!convId) {
      convId = Math.random().toString(36).substring(7);
      const title = tempInput.substring(0, 30) + (tempInput.length > 30 ? '...' : '');
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: convId, title })
      });
      setCurrentConvId(convId);
      fetchConversations();
    }

    // Save user message
    setMessages(prev => [...prev, userMessage]);
    await fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userMessage)
    });

    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const aiContent = await generateAIResponse(tempInput, history, user?.pseudo || 'Utilisateur', user?.role || 'user');
      const assistantMessage: Message = { role: 'assistant', content: aiContent };
      
      setMessages(prev => [...prev, assistantMessage]);
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assistantMessage)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      if (currentConvId === id) setCurrentConvId(null);
      fetchConversations();
    }
  };

  const handleActivateVip = async () => {
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/user/vip-activate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key: vipKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('VIP activé avec succès !');
        if (user) updateUser({ ...user, role: data.role });
        setVipKey('');
      } else {
        setSettingsError(data.error);
      }
    } catch (err) {
      setSettingsError('Erreur serveur.');
    }
  };

  const handleUpdateUser = async () => {
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pseudo: settingsPseudo, password: settingsPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsSuccess('Profil mis à jour.');
        if (user) updateUser({ ...user, pseudo: settingsPseudo });
        setSettingsPassword('');
      } else {
        setSettingsError(data.error);
      }
    } catch (err) {
      setSettingsError('Erreur serveur.');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F14] text-white overflow-hidden font-sans selection:bg-[#00F5A0]/30">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative z-40 w-80 h-full bg-[#0B0F14] border-r border-white/5 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00F5A0] to-[#00D9FF] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.2)] group-hover:rotate-6 transition-transform">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Tflow IA</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-[#9CA3AF]" />
              </button>
            </div>

            <div className="px-4 mb-6">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] font-bold shadow-[0_10px_20px_rgba(255,255,255,0.05)]"
              >
                <Plus className="w-5 h-5" />
                Nouvelle discussion
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
              <p className="px-3 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-2 opacity-50">Historique</p>
              {conversations.map(conv => (
                <motion.button 
                  layout
                  key={conv.id}
                  onClick={() => setCurrentConvId(conv.id)}
                  className={cn(
                    "w-full group flex items-center justify-between p-3.5 rounded-2xl text-sm transition-all duration-300 relative overflow-hidden",
                    currentConvId === conv.id 
                      ? "bg-white/5 text-white border border-white/10 shadow-lg" 
                      : "text-[#9CA3AF] hover:bg-white/5 hover:text-white border border-transparent"
                  )}
                >
                  {currentConvId === conv.id && (
                    <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-[#00F5A0] rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3 truncate">
                    <MessageSquare className={cn("w-4 h-4 flex-shrink-0 transition-colors", currentConvId === conv.id ? "text-[#00F5A0]" : "text-[#9CA3AF]")} />
                    <span className="truncate font-medium">{conv.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all flex-shrink-0" 
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </motion.button>
              ))}
            </div>

            <div className="p-4 mt-auto">
              <div className="bg-[#111827]/50 rounded-3xl p-4 border border-white/5 space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 relative">
                    {user?.role === 'creator' ? <ShieldCheck className="w-6 h-6 text-[#00F5A0]" /> : (user?.role === 'vip' ? <Crown className="w-6 h-6 text-[#00D9FF]" /> : <UserIcon className="w-6 h-6 text-white/40" />)}
                    {user?.role !== 'user' && (
                      <div className={cn(
                        "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111827]",
                        user?.role === 'creator' ? "bg-[#00F5A0]" : "bg-[#00D9FF]"
                      )} />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold truncate">{user?.pseudo}</p>
                    <div className="flex items-center gap-1.5">
                      {user?.role === 'creator' ? (
                        <span className="text-[9px] font-black bg-[#00F5A0]/10 text-[#00F5A0] px-1.5 py-0.5 rounded-md border border-[#00F5A0]/20 uppercase tracking-tighter shadow-[0_0_10px_rgba(0,245,160,0.1)]">Creator Mode</span>
                      ) : user?.role === 'vip' ? (
                        <span className="text-[9px] font-black bg-[#00D9FF]/10 text-[#00D9FF] px-1.5 py-0.5 rounded-md border border-[#00D9FF]/20 uppercase tracking-tighter">VIP Member</span>
                      ) : (
                        <span className="text-[9px] font-black bg-white/5 text-white/40 px-1.5 py-0.5 rounded-md border border-white/10 uppercase tracking-tighter">Standard User</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold transition-all border border-white/5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Réglages
                  </button>
                  <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-[11px] font-bold text-red-400 transition-all border border-red-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Quitter
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-[#0B0F14]">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-[#00F5A0]/5 to-transparent pointer-events-none blur-3xl" />
        
        <header className="h-16 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2.5 bg-[#111827] border border-white/10 rounded-xl hover:bg-[#1f2937] transition-all shadow-lg"
              >
                <Menu className="w-5 h-5 text-[#9CA3AF]" />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold tracking-tight">
                {currentConvId ? conversations.find(c => c.id === currentConvId)?.title : 'Tflow IA'}
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                <span className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-widest">Système Opérationnel</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-white/5 rounded-full">
              <Cpu className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Gemini 3.1 Pro</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-0 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto py-10 space-y-10">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center pt-20"
              >
                <div className="relative mb-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-[-20px] border border-dashed border-[#00F5A0]/20 rounded-full"
                  />
                  <div className="w-24 h-24 bg-gradient-to-br from-[#00F5A0] to-[#00D9FF] rounded-[32px] flex items-center justify-center shadow-[0_0_50px_rgba(0,245,160,0.2)] relative z-10">
                    <Sparkles className="w-12 h-12 text-black" />
                  </div>
                </div>
                <h3 className="text-4xl font-bold tracking-tight mb-4">Bienvenue, {user?.pseudo}</h3>
                <p className="text-[#9CA3AF] max-w-md font-medium leading-relaxed mb-12">
                  Je suis votre assistant intelligent de nouvelle génération. Comment puis-je vous aider aujourd'hui ?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-6">
                  {[
                    { icon: Sparkles, text: "Idées de projets innovants" },
                    { icon: Cpu, text: "Optimisation de code Python" },
                    { icon: MessageSquare, text: "Rédaction d'un e-mail pro" },
                    { icon: ShieldCheck, text: "Analyse de sécurité réseau" }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(item.text)}
                      className="p-5 bg-[#111827]/50 border border-white/5 rounded-3xl text-sm text-left hover:bg-[#111827] hover:border-[#00F5A0]/30 transition-all duration-300 group flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#00F5A0]/10 transition-colors">
                        <item.icon className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#00F5A0]" />
                      </div>
                      <span className="font-semibold text-[#9CA3AF] group-hover:text-white transition-colors">{item.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  key={i} 
                  className={cn(
                    "flex gap-6 group",
                    msg.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-white/5",
                    msg.role === 'user' ? "bg-gradient-to-br from-[#00F5A0] to-[#00D9FF]" : "bg-[#111827]"
                  )}>
                    {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-black" /> : <Sparkles className="w-5 h-5 text-[#00F5A0]" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-5 rounded-[28px] text-[15px] leading-relaxed font-medium shadow-xl relative",
                    msg.role === 'user' 
                      ? "bg-gradient-to-br from-[#00F5A0]/10 to-[#00D9FF]/10 border border-[#00F5A0]/20 text-white rounded-tr-none" 
                      : "bg-[#111827] border border-white/5 text-[#E5E7EB] rounded-tl-none"
                  )}>
                    {msg.content}
                    <div className={cn(
                      "absolute top-0 w-4 h-4",
                      msg.role === 'user' ? "-right-2 bg-[#00F5A0]/10" : "-left-2 bg-[#111827]"
                    )} style={{ clipPath: msg.role === 'user' ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)' }} />
                  </div>
                </motion.div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-[#111827] flex items-center justify-center flex-shrink-0 border border-white/5">
                  <Sparkles className="w-5 h-5 text-[#00F5A0]" />
                </div>
                <div className="p-5 rounded-[28px] rounded-tl-none bg-[#111827] border border-white/5 flex items-center gap-1.5 shadow-xl">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-[#00F5A0] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#00F5A0] rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#00F5A0] rounded-full" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-20" />
          </div>
        </div>

        {/* Floating Input */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-30">
          <form 
            onSubmit={handleSendMessage} 
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#00F5A0] to-[#00D9FF] rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-20 transition-opacity duration-500" />
            <div className="relative bg-[#111827]/70 backdrop-blur-2xl border border-white/10 rounded-[32px] p-2 flex items-center shadow-2xl transition-all duration-300 group-focus-within:border-[#00F5A0]/30 group-focus-within:bg-[#111827]/90">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question à Tflow IA..."
                className="flex-1 bg-transparent border-none py-4 px-6 focus:ring-0 text-[15px] font-medium placeholder:text-[#9CA3AF]/50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-12 h-12 bg-white hover:bg-[#00F5A0] disabled:opacity-20 disabled:hover:bg-white text-black rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg active:scale-90"
              >
                <ArrowUp className="w-6 h-6" />
              </button>
            </div>
          </form>
          <p className="text-[9px] text-center text-[#9CA3AF] mt-4 uppercase tracking-[0.3em] font-black opacity-30">
            Propulsé par Tflow Engine v4.2 — 2026
          </p>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[#0B0F14] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00F5A0] to-[#00D9FF]" />
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#111827] rounded-2xl flex items-center justify-center border border-white/10">
                    <Settings className="w-6 h-6 text-[#00F5A0]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Paramètres</h2>
                    <p className="text-xs text-[#9CA3AF] font-medium">Gérez votre compte et vos préférences</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-[#9CA3AF]" />
                </button>
              </div>

              <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Profile Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#00F5A0]" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Identité</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">Pseudo</label>
                      <input 
                        type="text" 
                        value={settingsPseudo}
                        onChange={(e) => setSettingsPseudo(e.target.value)}
                        className="w-full bg-[#111827] border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider ml-1">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        value={settingsPassword}
                        onChange={(e) => setSettingsPassword(e.target.value)}
                        className="w-full bg-[#111827] border border-white/5 rounded-2xl p-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateUser}
                    className="bg-white text-black px-8 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    Mettre à jour le profil
                  </button>
                </div>

                {/* VIP Section */}
                <div className="bg-gradient-to-br from-[#111827] to-[#0B0F14] p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F5A0]/10 blur-3xl group-hover:bg-[#00F5A0]/20 transition-all" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00F5A0]/10 rounded-xl flex items-center justify-center border border-[#00F5A0]/20">
                        <Crown className="w-5 h-5 text-[#00F5A0]" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">Accès Premium VIP</h3>
                    </div>
                    {user?.role !== 'user' && (
                      <span className="text-[10px] font-black bg-[#00F5A0] text-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(0,245,160,0.3)]">Activé</span>
                    )}
                  </div>

                  {user?.role === 'user' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[#9CA3AF] font-medium leading-relaxed">Débloquez la puissance maximale de Tflow IA avec un accès prioritaire et des modèles avancés.</p>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                          <input 
                            type="password" 
                            value={vipKey}
                            onChange={(e) => setVipKey(e.target.value)}
                            placeholder="Clé d'activation"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-[#00F5A0]/50 transition-all font-medium"
                          />
                        </div>
                        <button 
                          onClick={handleActivateVip}
                          className="bg-[#00F5A0] hover:bg-[#00F5A0]/90 text-black px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95"
                        >
                          Activer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-[#9CA3AF] uppercase font-black tracking-widest">Moteur IA</label>
                          <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
                        </div>
                        <select className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 cursor-pointer">
                          <option className="bg-[#111827]">Gemini 3.1 Pro (Ultra)</option>
                          <option className="bg-[#111827]">Tflow Neural v2</option>
                          <option className="bg-[#111827]">GPT-4o Integration</option>
                        </select>
                      </div>
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-[#9CA3AF] uppercase font-black tracking-widest">Interface</label>
                          <Cpu className="w-3.5 h-3.5 text-[#00D9FF]" />
                        </div>
                        <select className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold p-0 cursor-pointer">
                          <option className="bg-[#111827]">Futuriste Premium</option>
                          <option className="bg-[#111827]">Minimalist White</option>
                          <option className="bg-[#111827]">Cyberpunk Glow</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-6">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Zone Critique</h3>
                  </div>
                  <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <p className="text-sm font-bold text-white mb-1">Suppression du compte</p>
                      <p className="text-xs text-[#9CA3AF] font-medium">Toutes vos données et discussions seront effacées.</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full md:w-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {(settingsError || settingsSuccess) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "p-5 rounded-2xl text-sm font-bold border flex items-center gap-3",
                        settingsError ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/20"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", settingsError ? "bg-red-400" : "bg-[#00F5A0]")} />
                      {settingsError || settingsSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
