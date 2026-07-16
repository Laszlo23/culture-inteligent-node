import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, User, ShieldAlert, Check, 
  ArrowRight, Key, Eye, EyeOff, Sparkles, LogIn, UserPlus, RefreshCw, Info 
} from 'lucide-react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { api } from '../lib/api.ts';

interface AuthPortalProps {
  onLoginSuccess: (user: { username: string; email: string; walletAddress?: string; isAdmin?: boolean }) => void;
  currentWalletAddress?: string;
}

export default function AuthPortal({ onLoginSuccess, currentWalletAddress }: AuthPortalProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [customWallet, setCustomWallet] = useState<string>(currentWalletAddress || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Feedback alerts
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Helper to sync authenticated Firebase User with PostgreSQL
  const syncWithPostgreSQL = async (firebaseUser: any, chosenUsername?: string) => {
    try {
      const finalUsername = chosenUsername || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
      const syncedUser = await api.syncUser(finalUsername, customWallet || currentWalletAddress || '');
      onLoginSuccess({
        username: syncedUser.username,
        email: syncedUser.email,
        walletAddress: syncedUser.walletAddress,
        isAdmin: syncedUser.isAdmin
      });
    } catch (err: any) {
      console.error("PostgreSQL synchronization error:", err);
      setErrorMsg("Ecosystem DB sync failed. Local offline session loaded.");
      // Fallback local session
      onLoginSuccess({
        username: chosenUsername || firebaseUser.email?.split('@')[0] || 'Operator',
        email: firebaseUser.email || '',
        walletAddress: customWallet || currentWalletAddress || '',
        isAdmin: firebaseUser.email === 'laszlo.bihary@gmail.com'
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setSuccessMsg(`Google identity verified! Synchronizing database node...`);
      await syncWithPostgreSQL(result.user);
    } catch (err: any) {
      console.error("Google login failed:", err);
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters for Firebase security.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      setSuccessMsg('Account generated! Syncing with postgres ledger...');
      await syncWithPostgreSQL(result.user, username.trim());
    } catch (err: any) {
      console.error("Registration failed:", err);
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      setSuccessMsg(`Credentials verified! Retrieving profile...`);
      await syncWithPostgreSQL(result.user);
    } catch (err: any) {
      console.error("Credentials login failed:", err);
      setErrorMsg(err.message || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      setSuccessMsg('Entering as temporary Authorized Observer...');
      const guestId = Math.floor(10000 + Math.random() * 90000);
      await syncWithPostgreSQL(result.user, `Guest_${guestId}`);
    } catch (err: any) {
      console.error("Anonymous authentication failed:", err);
      setErrorMsg('Failed to initialize temporary guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030304]/95 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 140 }}
        className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3.5 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <Lock className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-mono text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase block">
            STASIS NODE GATEWAY
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
            Culture Node Ecosystem
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-2">
            Authenticate via Google or credentials to sync with the PostgreSQL ecosystem database.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#050506] p-1.5 rounded-xl border border-white/5 mb-4 font-mono text-xs">
          <button
            onClick={() => {
              setIsRegistering(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isRegistering 
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          
          <button
            onClick={() => {
              setIsRegistering(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isRegistering 
                ? 'bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full mb-4 py-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-xl text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] text-slate-600 font-mono">OR CREDENTIALS</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Feedback indicators */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[11px] font-sans flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-sans flex items-start gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-3 font-mono text-xs">
          
          {/* Username (Only during Registration) */}
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">USERNAME</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g. quantum_coder"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 rounded-xl pl-9.5 pr-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-sans transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">EMAIL ADDRESS</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                disabled={loading}
                placeholder="e.g. builder@station.xyz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050506] border border-white/10 rounded-xl pl-9.5 pr-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-sans transition-colors"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">PASSWORD</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050506] border border-white/10 rounded-xl pl-9.5 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password confirmation (Only during Registration) */}
          {isRegistering && (
            <div className="space-y-1">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">CONFIRM PASSWORD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 rounded-xl pl-9.5 pr-10 py-2.5 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs transition-colors"
                />
              </div>
            </div>
          )}

          {/* Optional custom Solana wallet (Only during Registration) */}
          {isRegistering && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">SOLANA WALLET KEY (OPTIONAL)</label>
                <span className="text-[8px] bg-purple-950/50 border border-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">
                  MAINNET
                </span>
              </div>
              <input
                type="text"
                disabled={loading}
                placeholder="e.g. 9Wz5979GjujvG8qAJE9bdfGAvXPMYFC..."
                value={customWallet}
                onChange={(e) => setCustomWallet(e.target.value)}
                className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500 text-xs font-sans"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-mono text-xs font-black tracking-wider flex items-center justify-center gap-2 transition-all uppercase cursor-pointer ${
              isRegistering 
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-lg shadow-fuchsia-950/40'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black shadow-lg shadow-cyan-950/40'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                CREATE SYSTEM ACCOUNT
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                SIGN IN SECURELY
              </>
            )}
          </button>
        </form>

        {/* Bypass / Guest Authorization Footer block */}
        <div className="mt-5 pt-4 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-sans mb-3">
            <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            <span>Want a quick explorer session without credentials?</span>
          </div>

          <button
            onClick={handleGuestAccess}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/20 hover:bg-cyan-950/5 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            START AS ECOSYSTEM OBSERVER
          </button>
        </div>

      </motion.div>
    </div>
  );
}
