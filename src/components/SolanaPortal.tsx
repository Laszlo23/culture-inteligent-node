/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Wallet, RefreshCw, Send, ArrowUpRight, 
  ExternalLink, CheckCircle, AlertTriangle, Key, Shield, HelpCircle, Copy, Info, Sparkles 
} from 'lucide-react';
import { Buffer } from 'buffer';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  Keypair 
} from '@solana/web3.js';
import { GameState } from '../types';

// Ensure Buffer is polyfilled globally for @solana/web3.js
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

interface SolanaPortalProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

interface TransactionRecord {
  signature: string;
  type: 'airdrop' | 'contribute';
  amount: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
}

const DEVNET_RPC = 'https://api.devnet.solana.com';
// A safe target public key for the Devnet transaction
const DESTINATION_PUBLIC_KEY = new PublicKey('9Wz5979GjujvG8qAJE9bdfGAvXPMYFCZks3fQ17Y3f2F');

export default function SolanaPortal({ state, setState, addLog }: SolanaPortalProps) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletType, setWalletType] = useState<'extension' | 'local' | null>(null);
  const [localKeypair, setLocalKeypair] = useState<Keypair | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txStep, setTxStep] = useState<string>('');
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize Connection
  const connection = new Connection(DEVNET_RPC, 'confirmed');

  // Check for local wallet or load on mount
  useEffect(() => {
    const savedSecret = localStorage.getItem('solana_local_secret');
    if (savedSecret) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(savedSecret));
        const keypair = Keypair.fromSecretKey(secretKey);
        setLocalKeypair(keypair);
        setWalletAddress(keypair.publicKey.toString());
        setWalletType('local');
        addLog(`Loaded local Devnet operational keypair: ${keypair.publicKey.toString().slice(0, 8)}...`, 'system');
      } catch (err) {
        console.error('Failed to restore saved local keypair', err);
      }
    }

    // Load saved transactions
    const savedTxs = localStorage.getItem('solana_tx_history_v1');
    if (savedTxs) {
      try {
        setTxHistory(JSON.parse(savedTxs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync / poll balance when walletAddress is updated
  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 15000); // refresh every 15s
      return () => clearInterval(interval);
    } else {
      setSolBalance(null);
    }
  }, [walletAddress]);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    setIsLoadingBalance(true);
    try {
      const pubKey = new PublicKey(walletAddress);
      const balance = await connection.getBalance(pubKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch SOL balance', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Helper to save transaction history
  const saveTx = (record: TransactionRecord) => {
    setTxHistory(prev => {
      const updated = [record, ...prev].slice(0, 10);
      localStorage.setItem('solana_tx_history_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Connect Phantom/Solflare extension wallet
  const connectExtension = async () => {
    setIsConnecting(true);
    const solanaProvider = (window as any).solana;

    if (!solanaProvider || !solanaProvider.isPhantom) {
      addLog('SOLANA DETECTED STATUS: Phantom Extension is missing or blocked by frame constraints.', 'warn');
      alert('Phantom Wallet extension not detected on this page. If you have it installed, please open this app in a New Tab to bypass iframe restrictions, or use our fallback "Local Devnet Wallet" which works perfectly right here!');
      setIsConnecting(false);
      return;
    }

    try {
      const response = await solanaProvider.connect();
      const pubKeyStr = response.publicKey.toString();
      setWalletAddress(pubKeyStr);
      setWalletType('extension');
      setLocalKeypair(null);
      addLog(`SOLANA WALLET CONNECTED: successfully connected to Phantom (${pubKeyStr.slice(0, 8)}...)`, 'success');
    } catch (err: any) {
      addLog(`SOLANA WALLET ERROR: Connection refused: ${err.message || err}`, 'warn');
    } finally {
      setIsConnecting(false);
    }
  };

  // Create a fallback local wallet right in the browser
  const createLocalWallet = () => {
    setIsConnecting(true);
    try {
      const keypair = Keypair.generate();
      const secretArray = Array.from(keypair.secretKey);
      localStorage.setItem('solana_local_secret', JSON.stringify(secretArray));
      
      setLocalKeypair(keypair);
      setWalletAddress(keypair.publicKey.toString());
      setWalletType('local');
      addLog(`LOCAL WALLET GENERATED: Devnet wallet created and secured. Public address: ${keypair.publicKey.toString()}`, 'success');
    } catch (err: any) {
      addLog(`LOCAL WALLET ERROR: Failed to generate: ${err.message || err}`, 'warn');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    if (walletType === 'extension' && (window as any).solana) {
      try {
        (window as any).solana.disconnect();
      } catch (e) {}
    }
    setWalletAddress('');
    setWalletType(null);
    setLocalKeypair(null);
    setSolBalance(null);
    localStorage.removeItem('solana_local_secret');
    addLog('SOLANA WALLET: disconnected successfully.', 'info');
  };

  // Request a Devnet SOL Airdrop from the on-chain faucet
  const requestAirdrop = async () => {
    if (!walletAddress) return;
    setIsLoadingBalance(true);
    addLog(`SOLANA FAUCET: requesting 1.0 Devnet SOL airdrop...`, 'info');
    try {
      const pubKey = new PublicKey(walletAddress);
      const signature = await connection.requestAirdrop(pubKey, 1.0 * LAMPORTS_PER_SOL);
      
      const record: TransactionRecord = {
        signature,
        type: 'airdrop',
        amount: 1.0,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending'
      };
      saveTx(record);

      addLog(`FAUCET TRANSACTION SENT: Awaiting block verification...`, 'info');
      
      // Confirm transaction
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');

      setTxHistory(prev => {
        const updated = prev.map(t => t.signature === signature ? { ...t, status: 'confirmed' as const } : t);
        localStorage.setItem('solana_tx_history_v1', JSON.stringify(updated));
        return updated;
      });

      addLog(`FAUCET INFLUX SUCCESS: 1.0 SOL received on Devnet. Balance updated!`, 'success');
      await fetchBalance();
    } catch (err: any) {
      addLog(`FAUCET ERROR: Airdrop failed. Faucet limits may apply. Error: ${err.message || err}`, 'warn');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Trigger on-chain contribution transaction
  const performContribution = async () => {
    if (!walletAddress) return;
    if (solBalance === null || solBalance < 0.05) {
      addLog('TRANSACTION DENIED: Insufficient Devnet SOL balance. Please request an airdrop first.', 'warn');
      return;
    }

    setTxLoading(true);
    setTxStep('Initializing transaction details...');
    addLog('ON-CHAIN PROTOCOL: Preparing Devnet transaction...', 'info');

    try {
      const senderPubKey = new PublicKey(walletAddress);
      
      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPubKey,
          toPubkey: DESTINATION_PUBLIC_KEY,
          lamports: 0.05 * LAMPORTS_PER_SOL,
        })
      );

      // Fetch blockhash
      setTxStep('Querying latest blockchain blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubKey;

      let signature = '';

      if (walletType === 'local' && localKeypair) {
        // Sign locally with generated keypair
        setTxStep('Signing transaction payload securely on-device...');
        transaction.sign(localKeypair);
        
        setTxStep('Broadcasting transaction to Solana Devnet validators...');
        const rawTx = transaction.serialize();
        signature = await connection.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
      } else {
        // Injected wallet extension signing
        const solanaProvider = (window as any).solana;
        if (!solanaProvider) {
          throw new Error('Wallet extension provider not found.');
        }

        setTxStep('Requesting authorization from Phantom Wallet extension...');
        // Phantom's signAndSendTransaction helper
        const result = await solanaProvider.signAndSendTransaction(transaction);
        signature = result.signature;
      }

      setTxStep('Awaiting block confirmation from Devnet cluster consensus...');
      const record: TransactionRecord = {
        signature,
        type: 'contribute',
        amount: 0.05,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending'
      };
      saveTx(record);

      // Await confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      setTxHistory(prev => {
        const updated = prev.map(t => t.signature === signature ? { ...t, status: 'confirmed' as const } : t);
        localStorage.setItem('solana_tx_history_v1', JSON.stringify(updated));
        return updated;
      });

      // Grant in-game rewards & state updates
      setState(prev => ({
        ...prev,
        credits: prev.credits + 300,
        efficiency: parseFloat((prev.efficiency + 0.15).toFixed(2))
      }));

      addLog(`ON-CHAIN SECURED: Successfully contributed 0.05 Devnet SOL! Transaction Signature verified. Reward of +300 CP & +15% Efficiency multiplier applied.`, 'success');
      setTxStep('CONFIRMED');
      await fetchBalance();
    } catch (err: any) {
      addLog(`ON-CHAIN FAILURE: Transaction rejected or timed out: ${err.message || err}`, 'warn');
      setTxStep('FAILED');
    } finally {
      setTimeout(() => {
        setTxLoading(false);
        setTxStep('');
      }, 3000);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">SOLANA WEB3 CONNECTOR</h3>
          </div>
          <span className="text-[9px] font-mono bg-purple-950/40 border border-purple-500/20 text-purple-400 px-2.5 py-0.5 rounded-lg font-black tracking-widest">
            DEVNET PROTOCOL
          </span>
        </div>

        <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
          Unlock standard Solana Web3 flows. Request on-chain Devnet SOL airdrops, sign real transactions with a secure browser wallet or our browser-based sandboxed keypair, and mint exclusive operations assets directly into the ledger!
        </p>

        {/* If Wallet Not Connected */}
        {!walletAddress ? (
          <div className="space-y-4 my-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phantom Extension Option */}
              <button
                onClick={connectExtension}
                disabled={isConnecting}
                className="p-5 bg-[#050506] border border-white/5 hover:border-purple-500/40 rounded-xl text-left transition-all hover:bg-white/[0.01] group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <h4 className="font-mono text-xs font-bold text-slate-200">Connect Web3 Extension</h4>
                <p className="text-[10px] text-slate-500 font-sans mt-1 leading-relaxed">
                  Pairs with Phantom or Solflare browser extension. (Note: Frame browser permissions apply; open in New Tab if extension is blocked).
                </p>
              </button>

              {/* Devnet Generator Option */}
              <button
                onClick={createLocalWallet}
                disabled={isConnecting}
                className="p-5 bg-[#050506] border border-white/5 hover:border-emerald-500/40 rounded-xl text-left transition-all hover:bg-white/[0.01] group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
                <h4 className="font-mono text-xs font-bold text-slate-200">Local Devnet Keypair</h4>
                <p className="text-[10px] text-slate-500 font-sans mt-1 leading-relaxed">
                  Instant browser-isolated, real on-chain keypair. Ideal for direct iframe execution, testing faucet airdrops, and transaction broadcasting!
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* Wallet is connected! Display beautiful HUD */
          <div className="space-y-5 my-6">
            <div className="p-4 bg-[#050506] border border-white/5 rounded-xl space-y-4">
              
              {/* Wallet identity header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">SECURELY CONNECTED PROTOCOL</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-black text-slate-200 truncate max-w-[200px]">
                      {walletAddress}
                    </span>
                    <button 
                      onClick={copyToClipboard}
                      className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                      title="Copy full address"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied && <span className="text-[8px] text-emerald-400 animate-pulse font-bold">COPIED!</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[8px] px-2 py-0.5 border rounded uppercase font-black tracking-widest ${
                    walletType === 'extension' 
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-400' 
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {walletType === 'extension' ? 'PHANTOM' : 'LOCAL KEYPAIR'}
                  </span>
                  
                  <button
                    onClick={disconnectWallet}
                    className="text-[9px] border border-white/10 bg-red-950/20 hover:bg-red-900/30 hover:border-red-500/40 text-red-400 px-2 py-1 rounded transition-colors cursor-pointer font-bold"
                  >
                    DISCONNECT
                  </button>
                </div>
              </div>

              {/* Balance HUD and action buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5 font-mono">
                <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-slate-500 block">DEVNET SOL BALANCE</span>
                    <span className="text-xl font-bold text-slate-100">
                      {solBalance !== null ? `${solBalance.toFixed(3)} SOL` : 'Fetching...'}
                    </span>
                  </div>
                  <button
                    onClick={fetchBalance}
                    disabled={isLoadingBalance}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={requestAirdrop}
                  disabled={isLoadingBalance}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 rounded-lg p-3 flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="text-left">
                    <span className="text-[8px] text-emerald-500 font-bold block uppercase tracking-widest">GET DEVNET SOL</span>
                    <span className="text-xs font-bold text-slate-200">Request +1.0 Faucet SOL</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* On-Chain Action Module */}
              <div className="bg-gradient-to-br from-[#120e1a] to-[#07050d] border border-purple-500/20 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono font-bold">
                    <Shield className="w-4 h-4" />
                    <span>ON-CHAIN FACILITY INVESTMENT</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">COST: 0.05 SOL</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-4">
                  Construct a real transaction to transmit 0.05 Devnet SOL to the secure cold ledger vault. Upon validation, you will immediately receive <span className="text-amber-400 font-bold">+300 credits (CP)</span> and a <span className="text-fuchsia-400 font-bold">+15% efficiency multiplier</span> boost!
                </p>

                <button
                  onClick={performContribution}
                  disabled={txLoading || solBalance === null || solBalance < 0.05}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    solBalance !== null && solBalance >= 0.05 && !txLoading
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg'
                      : 'bg-[#050506] border border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {txLoading ? 'TRANSACTING ON-CHAIN...' : 'CONTRIBUTE 0.05 SOL & BOOST'}
                </button>

                {txLoading && (
                  <div className="mt-3 bg-[#050506] border border-white/5 p-2.5 rounded-lg font-mono text-[9px] space-y-1">
                    <div className="flex items-center gap-2 text-purple-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span className="font-black">BROADCASTING TRANSACTION:</span>
                    </div>
                    <span className="text-slate-400">{txStep}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        {txHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 font-mono">
            <h4 className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-2.5">
              SECURE LEDGER TRANSACTION LOG
            </h4>
            <div className="space-y-1.5 text-[9px] max-h-36 overflow-y-auto pr-1">
              {txHistory.map(tx => (
                <div key={tx.signature} className="bg-[#050506] p-2 border border-white/5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={tx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400 animate-pulse'}>
                      ●
                    </span>
                    <div>
                      <span className="text-slate-300 font-bold block">
                        {tx.type === 'airdrop' ? 'Faucet Fulfill (+1.0 SOL)' : 'Ecosystem Invest (-0.05 SOL)'}
                      </span>
                      <span className="text-slate-500">Sig: {tx.signature.slice(0, 16)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${tx.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'}`}>
                      {tx.status.toUpperCase()}
                    </span>
                    <a
                      href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                      title="View on Solscan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-[#050506] p-3 rounded-xl border border-white/5 flex items-start gap-2 text-[10px] text-slate-500 font-sans leading-relaxed">
        <Info className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
        <p>
          Need testing coins? Connect your wallet address, click <strong>"Request +1.0 Faucet SOL"</strong>, and wait a few moments. It triggers standard Devnet transactions with full transparency on the blockchain explorer.
        </p>
      </div>

    </div>
  );
}
