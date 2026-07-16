import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, MessageSquare, Terminal, Send, Check, 
  Trash2, AlertCircle, Sparkles, Coins, Zap, Trophy, Heart, RefreshCw 
} from 'lucide-react';
import { GameState } from '../types';
import { api, ApiUser, ApiMessage, ApiTicket } from '../lib/api.ts';

interface AdminPanelProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  currentUser: { username: string; email: string; isAdmin?: boolean } | null;
}

export default function AdminPanel({ state, setState, addLog, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'nodes' | 'messages' | 'feedback' | 'tools'>('nodes');
  
  // Real DB States
  const [dbUsers, setDbUsers] = useState<ApiUser[]>([]);
  const [dbMessages, setDbMessages] = useState<ApiMessage[]>([]);
  const [dbTickets, setDbTickets] = useState<ApiTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Messaging Form State
  const [msgRecipient, setMsgRecipient] = useState<string>('all');
  const [msgSubject, setMsgSubject] = useState<string>('');
  const [msgContent, setMsgContent] = useState<string>('');
  const [msgSentSuccess, setMsgSentSuccess] = useState<boolean>(false);
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);

  // Feedback ticket reply state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [feedbackReplyText, setFeedbackReplyText] = useState<string>('');
  const [resolvingTicket, setResolvingTicket] = useState<boolean>(false);

  // Fetch all admin data from Postgres
  const loadAdminData = async () => {
    if (!currentUser?.isAdmin) return;
    setLoading(true);
    try {
      const [fetchedUsers, fetchedMessages, fetchedTickets] = await Promise.all([
        api.getAllUsers(),
        api.getMessages(),
        api.getTickets()
      ]);
      setDbUsers(fetchedUsers);
      setDbMessages(fetchedMessages);
      setDbTickets(fetchedTickets);
    } catch (err: any) {
      console.error("Failed to load admin telemetry data:", err);
      addLog("ADMIN ALERT: Database connection failed during sync.", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgContent.trim() || sendingMsg) return;

    setSendingMsg(true);
    try {
      const sentMsg = await api.broadcastMessage(msgRecipient, msgSubject.trim(), msgContent.trim());
      
      // Update local outbox log list
      setDbMessages(prev => [sentMsg, ...prev]);
      
      addLog(`ADMIN ACTION: Broadcasted message to "${msgRecipient}": "${msgSubject}".`, 'system');
      
      setMsgSubject('');
      setMsgContent('');
      setMsgSentSuccess(true);
      setTimeout(() => setMsgSentSuccess(false), 4000);
    } catch (err: any) {
      console.error("Failed to dispatch admin transmission:", err);
      addLog(`TRANSMISSION FAILURE: ${err.message || 'Ecosystem DB broadcast refused'}`, 'warn');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleReplyFeedback = async (ticketId: string) => {
    if (!feedbackReplyText.trim() || resolvingTicket) return;

    setResolvingTicket(true);
    try {
      const resolved = await api.resolveTicket(ticketId, feedbackReplyText.trim());
      
      // Update local tickets state
      setDbTickets(prev => prev.map(t => t.id === ticketId ? resolved : t));
      
      addLog(`ADMIN ACTION: Replied to feedback ticket. Status set to Resolved.`, 'success');
      setFeedbackReplyText('');
      setSelectedTicketId(null);
    } catch (err: any) {
      console.error("Failed to resolve feedback ticket:", err);
      addLog(`RESOLVE ERROR: ${err.message || 'Database update failed'}`, 'warn');
    } finally {
      setResolvingTicket(false);
    }
  };

  // Fun helper admin hacks to grant tokens or power
  const adminGrantBcc = (amount: number) => {
    setState(prev => ({
      ...prev,
      credits: prev.credits + amount,
      notifications: [
        {
          id: 'n_' + Date.now(),
          title: 'Admin Token Grant',
          message: `System Admin granted +${amount} Building Culture Coins ($BCC) directly to your core ledger!`,
          timestamp: new Date().toLocaleTimeString(),
          read: false,
          type: 'success'
        },
        ...(prev.notifications || [])
      ]
    }));
    addLog(`ADMIN TELEMETRY: Granted +${amount} $BCC to your current session.`, 'success');
  };

  const adminGrantPower = (power: number) => {
    setState(prev => ({
      ...prev,
      miningPower: prev.miningPower + power,
      notifications: [
        {
          id: 'n_' + Date.now(),
          title: 'Admin Power Inject',
          message: `System Admin injected +${power} PH/s raw compiler hash output into your local node grid!`,
          timestamp: new Date().toLocaleTimeString(),
          read: false,
          type: 'success'
        },
        ...(prev.notifications || [])
      ]
    }));
    addLog(`ADMIN TELEMETRY: Overclocked Reactor Power. Added +${power} PH/s raw grid capacity.`, 'success');
  };

  const adminRefuelReactor = () => {
    setState(prev => ({
      ...prev,
      energy: 100,
      notifications: [
        {
          id: 'n_' + Date.now(),
          title: 'Admin Core Re-fuel',
          message: 'System Admin fully charged the Main Reactor Core energy to 100%!',
          timestamp: new Date().toLocaleTimeString(),
          read: false,
          type: 'success'
        },
        ...(prev.notifications || [])
      ]
    }));
    addLog(`ADMIN TELEMETRY: Forced core reactor fuel levels to 100%.`, 'success');
  };

  const activeUser = currentUser?.username || 'Operator';

  return (
    <div id="admin-panel" className="space-y-6 max-w-5xl mx-auto">
      {/* Admin Title Block */}
      <div className="bg-[#0a0a0c] border border-red-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:24px_24px] opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-red-400 block uppercase font-bold">ADMINISTRATIVE MASTER NODE</span>
              <h3 className="text-base font-bold font-mono text-white mt-0.5 flex items-center gap-2">
                CULTURE NODE BACKSTAGE OPERATIONS <span className="text-[8px] tracking-wider uppercase border border-red-800 text-red-400 px-1.5 py-0.5 rounded bg-red-950/20 font-black">ROOT PRIVILEGES</span>
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              title="Refresh ledger database"
              className="p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 rounded-lg hover:border-red-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <div className="flex bg-[#050506] border border-white/5 rounded-xl p-1 font-mono text-[10px]">
              <button
                onClick={() => setActiveTab('nodes')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${activeTab === 'nodes' ? 'bg-red-500/15 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Network Users
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${activeTab === 'messages' ? 'bg-red-500/15 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Broadcast
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${activeTab === 'feedback' ? 'bg-red-500/15 text-red-400 font-bold flex items-center gap-1' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Feedback ({dbTickets.filter(f => f.status === 'Open').length})
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${activeTab === 'tools' ? 'bg-red-500/15 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Admin Tools
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: NODES OVERVIEW */}
        {activeTab === 'nodes' && (
          <motion.div
            key="tab-nodes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl"
          >
            <h4 className="font-mono text-xs font-semibold text-slate-200 tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              POSTGRESQL ECOSYSTEM REGISTERED USERS ({dbUsers.length})
            </h4>

            <div className="overflow-x-auto">
              {dbUsers.length === 0 ? (
                <div className="text-center py-8 bg-[#050506] rounded-xl border border-white/5 font-mono text-xs text-slate-500">
                  No registered database nodes found. Load users by refreshing.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest">
                      <th className="pb-3 pl-2">USER ACCOUNT</th>
                      <th className="pb-3">EMAIL</th>
                      <th className="pb-3">SOLANA WALLET</th>
                      <th className="pb-3">DATABASE UID</th>
                      <th className="pb-3 text-right pr-2">PRIVILEGES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {dbUsers.map((user) => (
                      <tr key={user.uid} className={`hover:bg-white/[0.01] transition-colors ${user.username === activeUser ? 'bg-cyan-950/5' : ''}`}>
                        <td className="py-3.5 pl-2 font-bold text-white flex items-center gap-2">
                          <span>@{user.username}</span>
                          {user.username === activeUser && (
                            <span className="text-[7px] tracking-widest uppercase font-black px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-300">{user.email}</td>
                        <td className="py-3.5 text-cyan-400 font-mono text-[10px]">
                          {user.walletAddress ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-8)}` : 'No wallet linked'}
                        </td>
                        <td className="py-3.5 text-slate-500 text-[9px] font-mono">{user.uid}</td>
                        <td className="py-3.5 text-right pr-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase ${
                            user.isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400'
                          }`}>
                            {user.isAdmin ? 'ROOT ADMIN' : 'MEMBER'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: INTERNAL MESSAGING SYSTEM */}
        {activeTab === 'messages' && (
          <motion.div
            key="tab-messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Message composer */}
            <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h4 className="font-mono text-xs font-semibold text-slate-200 tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-400" />
                COMPOSE INTERNAL TRANSMISSION
              </h4>

              <form onSubmit={handleSendAdminMessage} className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1.5">RECIPIENT OPERATOR</label>
                    <select
                      value={msgRecipient}
                      onChange={(e) => setMsgRecipient(e.target.value)}
                      className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                    >
                      <option value="all">Broadcast to All Users</option>
                      {dbUsers.map(u => (
                        <option key={u.uid} value={u.username}>User: @{u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase mb-1.5">SUBJECT HEAD</label>
                    <input
                      type="text"
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      placeholder="Subject of message..."
                      className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-red-500/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase mb-1.5">MESSAGE BODY CONTENT</label>
                  <textarea
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="Type the message body here. This will show up in the operator's message center."
                    rows={4}
                    className="w-full bg-[#050506] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-red-500/50 resize-none font-sans"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <AnimatePresence>
                    {msgSentSuccess && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 font-bold"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        Instruction packet dispatched!
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl flex items-center gap-2 cursor-pointer transition-colors ml-auto uppercase tracking-wider"
                  >
                    {sendingMsg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    DISPATCH TELEGRAM
                  </button>
                </div>
              </form>
            </div>

            {/* Outbox log list */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-red-500" />
                  DISPATCH OUTBOX LOGS
                </h4>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {dbMessages.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 font-mono text-[10px]">
                      No messages sent yet. Create a transmission to broadcast.
                    </div>
                  ) : (
                    dbMessages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-[#050506] border border-white/5 rounded-xl font-mono text-[10px]">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>To: {msg.recipient}</span>
                          <span className="text-[9px]">{msg.timestamp}</span>
                        </div>
                        <span className="text-white font-bold block">{msg.subject}</span>
                        <p className="text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: FEEDBACK PORTAL */}
        {activeTab === 'feedback' && (
          <motion.div
            key="tab-feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <h4 className="font-mono text-xs font-semibold text-slate-200 tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              PENDING TELEMETRY SUPPORT TICKETS ({dbTickets.filter(f => f.status === 'Open').length})
            </h4>

            {dbTickets.length === 0 ? (
              <div className="text-center py-12 bg-[#050506] rounded-xl border border-white/5">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 animate-pulse" />
                <span className="text-xs font-bold text-slate-400 font-mono block">ALL TICKETS CLEARED</span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  There are no submitted user tickets in the central queue. Good job admin!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dbTickets.map((ticket) => (
                  <div key={ticket.id} className={`p-4 rounded-xl border transition-all ${ticket.status === 'Open' ? 'border-red-500/20 bg-red-950/5' : 'border-white/5 bg-[#050506]'}`}>
                    <div className="flex justify-between items-start gap-2 flex-wrap mb-2">
                      <div>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-slate-400 mr-2 uppercase">{ticket.type}</span>
                        <span className="font-bold font-mono text-xs text-white">Subject: {ticket.subject}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          From Uid: <span className="text-cyan-400">{ticket.userId}</span> • Date: {ticket.timestamp}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase font-mono ${ticket.status === 'Open' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans p-3 bg-[#050506] rounded-lg border border-white/5 leading-relaxed selection:bg-cyan-500/30">
                      {ticket.message}
                    </p>

                    {ticket.status === 'Open' ? (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        {selectedTicketId === ticket.id ? (
                          <div className="space-y-3 font-mono text-xs">
                            <label className="block text-[10px] text-slate-500">COMPOSE RESPONSE PACKET</label>
                            <textarea
                              value={feedbackReplyText}
                              onChange={(e) => setFeedbackReplyText(e.target.value)}
                              placeholder="Write a supportive reply or fix report to help this operator..."
                              rows={2}
                              className="w-full bg-[#050506] border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-red-500/50 resize-none font-sans"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedTicketId(null)}
                                className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReplyFeedback(ticket.id)}
                                disabled={resolvingTicket}
                                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {resolvingTicket && <RefreshCw className="w-3 h-3 animate-spin" />}
                                Dispatch Response & Resolve
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-[10px] rounded-lg font-bold uppercase tracking-wider cursor-pointer font-mono"
                          >
                            Reply & Resolve Ticket
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 bg-cyan-950/10 border-l-2 border-cyan-500/50 p-3 rounded-r-lg font-mono text-[11px] space-y-1">
                        <span className="text-[9px] font-black text-cyan-400 block tracking-widest uppercase">ADMIN RESPONSE DISPATCHED</span>
                        <p className="text-slate-300 font-sans">{ticket.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: SYSTEM OVERRIDES / TOOLS */}
        {activeTab === 'tools' && (
          <motion.div
            key="tab-tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs"
          >
            {/* Override 1: Tokens */}
            <div className="bg-[#050506] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <h5 className="font-bold text-white uppercase">Coin Minter Bridge</h5>
                </div>
                <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                  Invisibly deploy a micro-grant of $BCC (Building Culture Coin) tokens directly into your operator wallet ledger. Used for diagnostics.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => adminGrantBcc(500)}
                  className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-black border border-amber-500/30 hover:border-transparent rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all"
                >
                  Grant 500 BCC
                </button>
                <button
                  onClick={() => adminGrantBcc(2000)}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all"
                >
                  Grant 2k BCC
                </button>
              </div>
            </div>

            {/* Override 2: Power */}
            <div className="bg-[#050506] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h5 className="font-bold text-white uppercase">Core Overclocker</h5>
                </div>
                <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                  Inject high-frequency hash calculations directly into your node reactor output, boosting passive reward ticker speed!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => adminGrantPower(50)}
                  className="flex-1 py-2 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-black border border-cyan-500/30 hover:border-transparent rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all"
                >
                  Overclock +50 PH/s
                </button>
                <button
                  onClick={() => adminGrantPower(250)}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all"
                >
                  Boost +250 PH/s
                </button>
              </div>
            </div>

            {/* Override 3: Energy */}
            <div className="bg-[#050506] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <h5 className="font-bold text-white uppercase">Reactor Recharge</h5>
                </div>
                <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                  Bypass the Attention Academy cooldown restrictions and force-charge your main power grid energy levels instantly.
                </p>
              </div>
              <button
                onClick={adminRefuelReactor}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all"
              >
                Force Charge Energy to 100%
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
