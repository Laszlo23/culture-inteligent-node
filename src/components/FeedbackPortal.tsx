import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, FileText, CheckCircle, Clock, MessageSquare, AlertCircle, 
  Inbox, Bell, CornerUpLeft, ShieldCheck, Sparkles, Check, RefreshCw 
} from 'lucide-react';
import { GameState } from '../types';
import { api, ApiMessage, ApiTicket } from '../lib/api.ts';

interface FeedbackPortalProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  currentUser: { username: string; email: string; isAdmin?: boolean } | null;
  notificationTarget?: { type: 'message' | 'ticket'; id: string } | null;
  setNotificationTarget?: (target: { type: 'message' | 'ticket'; id: string } | null) => void;
}

export default function FeedbackPortal({ 
  state, 
  setState, 
  addLog, 
  currentUser, 
  notificationTarget, 
  setNotificationTarget 
}: FeedbackPortalProps) {
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'inbox' | 'tickets'>('inbox');
  
  // Real DB States
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [tickets, setTickets] = useState<ApiTicket[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Form Submission State
  const [type, setType] = useState<'Bug' | 'Feature' | 'Feedback'>('Feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Fetch all communications and tickets from Postgres
  const loadDatabaseData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [fetchedMessages, fetchedTickets] = await Promise.all([
        api.getMessages(),
        api.getTickets()
      ]);
      setMessages(fetchedMessages);
      setTickets(fetchedTickets);
    } catch (error: any) {
      console.error("Failed to fetch communications:", error);
      addLog("DATABASE ERROR: Unable to synchronize support feed.", "warn");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, [currentUser]);

  // Sync tab selection with notification targeting
  useEffect(() => {
    if (notificationTarget) {
      if (notificationTarget.type === 'message') {
        setActiveTab('inbox');
        setExpandedMessageId(notificationTarget.id);
        handleMessageClick(notificationTarget.id);
      } else if (notificationTarget.type === 'ticket') {
        setActiveTab('tickets');
      }
    }
  }, [notificationTarget]);

  const handleMessageClick = async (msgId: string) => {
    setExpandedMessageId(expandedMessageId === msgId ? null : msgId);
    
    // Find message to check read status
    const targetMsg = messages.find(m => m.id === msgId);
    if (targetMsg && !targetMsg.isRead) {
      try {
        await api.markMessageAsRead(msgId);
        // Update local state to reflect read
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m));
      } catch (err) {
        console.error("Failed to mark message read in DB:", err);
      }
    }
  };

  const handleReplyMessage = (msg: ApiMessage) => {
    setType('Feedback');
    setSubject(`Re: ${msg.subject}`);
    setMessage(`Replying to message from ${msg.sender} (Sent: ${msg.timestamp}):\n\n`);
    setActiveTab('tickets');
    addLog(`DRAFT PREPARED: Reply ready. Complete the description below.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || submittingTicket) return;

    setSubmittingTicket(true);
    try {
      const loggedTicket = await api.submitTicket(type, subject, message);
      
      addLog(`FEEDBACK LOGGED: Submitted a ${type} ticket regarding "${subject}".`, 'success');
      
      setSubject('');
      setMessage('');
      setSubmitted(true);
      
      // Update local state or reload
      setTickets(prev => [loggedTicket, ...prev]);

      if (notificationTarget && notificationTarget.type === 'ticket') {
        if (setNotificationTarget) setNotificationTarget(null);
      }

      setTimeout(() => setSubmitted(false), 4000);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      addLog(`TRANSMISSION ERROR: ${err.message || 'Unable to store ticket'}`, 'warn');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const unreadMessagesCount = messages.filter(m => !m.isRead).length;

  return (
    <div id="feedback-portal" className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/40 border border-cyan-500/20 rounded-xl">
            <Inbox className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-semibold text-slate-100 uppercase tracking-widest flex items-center gap-2">
              Support & Communication Centre
              {loadingData && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Stay connected with system administration and track telemetry dispatches on the PostgreSQL ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDatabaseData}
            title="Sync communications feed"
            className="p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 rounded-lg hover:border-cyan-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {notificationTarget && (
            <button
              onClick={() => {
                if (setNotificationTarget) setNotificationTarget(null);
                addLog("LINKED DISPATCH: Navigation highlights cleared.", "info");
              }}
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-black uppercase rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              Clear Highlight Active
            </button>
          )}
        </div>
      </div>

      {/* Cyber Tabs Navigation */}
      <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/5 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`py-3 px-4 font-mono text-[11px] font-black tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'inbox'
              ? 'bg-cyan-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox Announcements
          {unreadMessagesCount > 0 && (
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded ${
              activeTab === 'inbox' ? 'bg-black text-cyan-400' : 'bg-red-500 text-white animate-pulse'
            }`}>
              {unreadMessagesCount} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`py-3 px-4 font-mono text-[11px] font-black tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-cyan-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Tickets & Helpdesk
          {tickets.filter(t => t.status === 'Open').length > 0 && (
            <span className="px-1.5 py-0.5 bg-[#0a0a0c] border border-white/10 text-amber-400 text-[8px] rounded font-black">
              {tickets.filter(t => t.status === 'Open').length} OPEN
            </span>
          )}
        </button>
      </div>

      {/* RENDER ACTIVE TAB BODY */}
      <AnimatePresence mode="wait">
        {activeTab === 'inbox' ? (
          <motion.div
            key="inbox-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 bg-[#0a0a0c] rounded-2xl border border-white/5 font-mono">
                <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">No Announcements Found</span>
                <p className="text-[10px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  The network broadcast pipeline is clear. Direct operations or critical system updates from System Admin will land here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isExpanded = expandedMessageId === msg.id;
                  const isTargeted = notificationTarget?.type === 'message' && notificationTarget.id === msg.id;

                  return (
                    <div 
                      key={msg.id} 
                      className={`bg-[#0a0a0c] border rounded-2xl transition-all duration-300 overflow-hidden ${
                        isTargeted 
                          ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                          : isExpanded 
                          ? 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.03)]' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Message Header summary */}
                      <div 
                        onClick={() => handleMessageClick(msg.id)}
                        className="p-4 md:p-5 flex justify-between items-start gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 rounded text-[8px] font-mono tracking-widest uppercase font-black">
                              {msg.sender.toUpperCase()}
                            </span>
                            {!msg.isRead && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[7px] font-black tracking-widest uppercase animate-pulse">
                                UNREAD
                              </span>
                            )}
                            {isTargeted && (
                              <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[7px] font-black tracking-widest uppercase flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> LINKED DISPATCH
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-mono text-xs font-black text-slate-100 tracking-tight uppercase truncate">
                            {msg.subject}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-mono block">
                            Dispatched: {msg.timestamp} • Recipient: {msg.recipient}
                          </span>
                        </div>

                        <button 
                          className="px-3 py-1 bg-[#050506] border border-white/10 rounded-lg hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 font-mono text-[9px] font-bold uppercase shrink-0 transition-colors"
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      </div>

                      {/* Message Content body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="border-t border-white/5 bg-[#050506]/60"
                          >
                            <div className="p-5 space-y-4">
                              <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap select-text selection:bg-cyan-500/30">
                                {msg.content}
                              </p>

                              <div className="flex justify-between items-center pt-4 border-t border-white/[0.03] flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono uppercase">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> System Sign-off Verified
                                </div>

                                <button
                                  onClick={() => handleReplyMessage(msg)}
                                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black font-mono text-[10px] tracking-wider uppercase rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <CornerUpLeft className="w-3.5 h-3.5" />
                                  Reply via Ticket
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tickets-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            
            {/* Lodge New Ticket Form */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider uppercase">
                  LODGE TELEMETRY TICKET
                </h3>
              </div>
              
              <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
                Encountered an anomaly or have an innovative idea to boost the Base token utility? Lodge your ticket below. Our core developers will address and sign off replies directly to the Postgres server.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">
                      TICKET CATEGORY
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="Feedback">Feedback / Suggestion</option>
                      <option value="Bug">Technical Bug / Glitch</option>
                      <option value="Feature">Feature Proposal</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">
                      SUBJECT / CONCERN
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your ticket..."
                      className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1.5">
                    DETAILED TELEMETRY DESCRIPTION
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe what occurred, any error messages, or what upgrade you suggest..."
                    rows={4}
                    className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <AnimatePresence>
                    {submitted && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 font-mono flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Ticket logged to secure Postgres database!
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black font-mono text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors ml-auto uppercase tracking-wider disabled:opacity-55"
                  >
                    {submittingTicket ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Transmit Ticket
                  </button>
                </div>
              </form>
            </div>

            {/* Ticket History List */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h4 className="font-mono text-xs font-semibold text-slate-200 tracking-wider mb-4 flex items-center gap-2 uppercase">
                <FileText className="w-4 h-4 text-cyan-500" />
                ACTIVE & HISTORIC DISPATCH TICKETS ({tickets.length})
              </h4>

              {tickets.length === 0 ? (
                <div className="text-center py-8 bg-[#050506] rounded-xl border border-white/5">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 font-mono block">NO TICKETS ON FILE</span>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Your feedback transmission ledger is currently empty. Feel free to log a message!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => {
                    const isTargeted = notificationTarget?.type === 'ticket' && notificationTarget.id === ticket.id;

                    return (
                      <div 
                        key={ticket.id} 
                        className={`bg-[#050506] border rounded-xl p-4 space-y-3 transition-all duration-300 ${
                          isTargeted 
                            ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.06)] bg-[#0a0a0d]' 
                            : 'border-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase font-mono ${
                                ticket.type === 'Bug' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                ticket.type === 'Feature' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' :
                                'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              }`}>
                                {ticket.type}
                              </span>
                              <h5 className="text-xs font-bold text-white font-mono uppercase">{ticket.subject}</h5>
                              {isTargeted && (
                                <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[7px] font-black tracking-widest uppercase flex items-center gap-1 font-mono">
                                  <Sparkles className="w-2.5 h-2.5" /> LINKED TARGET
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono block mt-1">Logged: {ticket.timestamp}</span>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black tracking-wider uppercase border ${
                            ticket.status === 'Resolved'
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-950/20 text-amber-400 border-amber-500/20'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#0a0a0c]/40 p-3 rounded-lg border border-white/[0.02]">
                          {ticket.message}
                        </p>

                        {ticket.reply && (
                          <div className="bg-cyan-950/10 border-l-2 border-cyan-500/50 p-3 rounded-r-lg space-y-1">
                            <span className="text-[9px] font-mono font-black text-cyan-400 block tracking-widest uppercase">
                              ADMIN NODE RESPONSE // APPROVED
                            </span>
                            <p className="text-xs text-slate-300 font-sans leading-relaxed">
                              {ticket.reply}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
