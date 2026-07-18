/**
 * Integration tests — run with `anchor test` when localnet validator is available.
 * Without a validator, this suite exits early with a skip notice.
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { createHash } from 'crypto';
import { expect } from 'chai';

const PROGRAM_ID = new PublicKey('AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ');

function disc(name: string): Buffer {
  return Buffer.from(createHash('sha256').update(`global:${name}`).digest().subarray(0, 8));
}

describe('culture_economy', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it('initialize_config + init_player + grant_energy', async function () {
    this.timeout(120_000);

    const info = await provider.connection.getAccountInfo(PROGRAM_ID);
    if (!info) {
      console.log('SKIP: program not deployed on this cluster — run anchor deploy first');
      this.skip();
    }

    const authority = (provider.wallet as anchor.Wallet).payer;
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);

    const existing = await provider.connection.getAccountInfo(configPda);
    let bccMint = Keypair.generate();
    let cgtMint = Keypair.generate();

    if (!existing) {
      const lamports = await getMinimumBalanceForRentExemptMint(provider.connection);
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: authority.publicKey,
          newAccountPubkey: bccMint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(bccMint.publicKey, 0, configPda, null),
        SystemProgram.createAccount({
          fromPubkey: authority.publicKey,
          newAccountPubkey: cgtMint.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(cgtMint.publicKey, 0, configPda, null)
      );
      await sendAndConfirmTransaction(provider.connection, tx, [authority, bccMint, cgtMint]);

      const data = Buffer.concat([disc('initialize_config'), Buffer.alloc(2)]);
      data.writeUInt16LE(10000, 8);
      await sendAndConfirmTransaction(
        provider.connection,
        new Transaction().add({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: authority.publicKey, isSigner: true, isWritable: true },
            { pubkey: configPda, isSigner: false, isWritable: true },
            { pubkey: bccMint.publicKey, isSigner: false, isWritable: false },
            { pubkey: cgtMint.publicKey, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data,
        }),
        [authority]
      );
    }

    const [playerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('player'), authority.publicKey.toBuffer()],
      PROGRAM_ID
    );
    const playerInfo = await provider.connection.getAccountInfo(playerPda);
    if (!playerInfo) {
      await sendAndConfirmTransaction(
        provider.connection,
        new Transaction().add({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: authority.publicKey, isSigner: true, isWritable: true },
            { pubkey: playerPda, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          data: disc('init_player'),
        }),
        [authority]
      );
    }

    const grantData = Buffer.concat([disc('grant_energy'), Buffer.alloc(2)]);
    grantData.writeUInt16LE(500, 8);
    await sendAndConfirmTransaction(
      provider.connection,
      new Transaction().add({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: authority.publicKey, isSigner: true, isWritable: false },
          { pubkey: configPda, isSigner: false, isWritable: false },
          { pubkey: authority.publicKey, isSigner: false, isWritable: false },
          { pubkey: playerPda, isSigner: false, isWritable: true },
        ],
        data: grantData,
      }),
      [authority]
    );

    const after = await provider.connection.getAccountInfo(playerPda);
    expect(after).to.not.equal(null);
    const energy = after!.data.readUInt16LE(8 + 32);
    // init_player starts at 0; grant_energy(+500) must land
    expect(energy).to.equal(500);
  });
});
