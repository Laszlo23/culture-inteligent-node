/**
 * Devnet probe: program, config, authority balance, optional smoke grant.
 * Usage: npx tsx scripts/smoke-devnet-probe.ts
 */
import 'dotenv/config';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  ensureDiscriminators,
  fetchConfig,
  getBccMint,
  getCgtMint,
  getEconomyProgramId,
  loadEconomyAuthorityFromEnv,
  configPda,
  buildInitPlayerIx,
  buildGrantEnergyIx,
  getConnection,
} from '../src/lib/solana-economy';
import { Transaction } from '@solana/web3.js';

async function main() {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const c = getConnection(rpc);
  await ensureDiscriminators();

  const auth = loadEconomyAuthorityFromEnv();
  console.log('RPC', rpc);
  console.log('program', getEconomyProgramId().toBase58());
  console.log('bcc', getBccMint()?.toBase58() || '(missing)');
  console.log('cgt', getCgtMint()?.toBase58() || '(missing)');
  console.log('authority', auth?.publicKey.toBase58() || 'MISSING');

  if (auth) {
    const bal = await c.getBalance(auth.publicKey);
    console.log('authority SOL', (bal / LAMPORTS_PER_SOL).toFixed(4));
  }

  const prog = await c.getAccountInfo(getEconomyProgramId());
  console.log(
    'program account',
    prog ? `executable=${prog.executable} len=${prog.data.length}` : 'MISSING'
  );

  const pda = configPda();
  console.log('configPda', pda.toBase58());
  const cfg = await fetchConfig(c);
  if (!cfg) {
    console.error('FAIL: config PDA missing — run npx tsx scripts/devnet-bootstrap.ts');
    process.exit(1);
  }
  console.log('config.authority', cfg.authority.toBase58());
  console.log('config.bccMint', cfg.bccMint.toBase58());
  console.log('config.cgtMint', cfg.cgtMint.toBase58());
  console.log('config.minerCounter', cfg.minerCounter.toString());

  if (auth && !cfg.authority.equals(auth.publicKey)) {
    console.error('FAIL: ECONOMY_AUTHORITY_SECRET pubkey != on-chain config.authority');
    process.exit(1);
  }

  // Smoke: create ephemeral wallet, init_player + grant_energy, authority co-signs, wallet pays
  if (!auth) {
    console.error('FAIL: no authority — cannot smoke');
    process.exit(1);
  }

  const wallet = Keypair.generate();
  console.log('smoke wallet', wallet.publicKey.toBase58());

  // Fund wallet from authority (0.05 SOL)
  const need = 0.05 * LAMPORTS_PER_SOL;
  const wBal = await c.getBalance(wallet.publicKey);
  if (wBal < need) {
    const { SystemProgram } = await import('@solana/web3.js');
    const fund = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: auth.publicKey,
        toPubkey: wallet.publicKey,
        lamports: need,
      })
    );
    const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash();
    fund.recentBlockhash = blockhash;
    fund.lastValidBlockHeight = lastValidBlockHeight;
    fund.feePayer = auth.publicKey;
    fund.sign(auth);
    const sig = await c.sendRawTransaction(fund.serialize());
    await c.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
    console.log('funded smoke wallet', sig);
  }

  const ixs = [
    await buildInitPlayerIx(wallet.publicKey),
    await buildGrantEnergyIx(auth.publicKey, wallet.publicKey, 1500),
  ];
  const tx = new Transaction();
  for (const ix of ixs) tx.add(ix);
  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = wallet.publicKey;
  tx.partialSign(auth);
  tx.partialSign(wallet);

  try {
    const sim = await c.simulateTransaction(tx);
    if (sim.value.err) {
      console.error('SIM FAIL', JSON.stringify(sim.value.err));
      console.error((sim.value.logs || []).slice(-20).join('\n'));
      process.exit(1);
    }
    console.log('simulate OK');
    const sig = await c.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await c.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
    console.log('SMOKE OK', sig);
    console.log(`https://solscan.io/tx/${sig}?cluster=devnet`);
  } catch (e) {
    console.error('SMOKE FAIL', e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
