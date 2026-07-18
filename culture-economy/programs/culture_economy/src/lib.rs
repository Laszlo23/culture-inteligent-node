//! Culture Node facility economy (Devnet).
//! Player PDA + SPL BCC/CGT + PDA miner assets + listing escrow.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ");

pub const ENERGY_MAX_BPS: u16 = 10_000;
pub const DEFAULT_SWAP_RATE_BPS: u16 = 10_000; // 1 BCC -> 1 CGT at 100%
pub const MINER_MINT_COST_CGT: u64 = 100;
pub const DAILY_ENERGY_BPS: u16 = 1_500;
pub const DAILY_BCC_REWARD: u64 = 50;
/// Default marketplace protocol cut on buy_miner (250 = 2.5%).
pub const DEFAULT_MARKETPLACE_FEE_BPS: u16 = 250;

#[program]
pub mod culture_economy {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        swap_rate_bps: u16,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.bcc_mint = ctx.accounts.bcc_mint.key();
        cfg.cgt_mint = ctx.accounts.cgt_mint.key();
        cfg.swap_rate_bps = if swap_rate_bps == 0 {
            DEFAULT_SWAP_RATE_BPS
        } else {
            swap_rate_bps
        };
        cfg.energy_max_bps = ENERGY_MAX_BPS;
        cfg.miner_count = 0;
        cfg.marketplace_fee_bps = DEFAULT_MARKETPLACE_FEE_BPS;
        cfg.fee_treasury = ctx.accounts.authority.key();
        cfg.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.owner = ctx.accounts.owner.key();
        player.energy_bps = 0; // empty until Academy / claim_daily earn
        player.mining_power = 0;
        player.streak = 0;
        player.last_daily_ts = 0;
        player.bump = ctx.bumps.player;
        Ok(())
    }

    /// Authority-only: add knowledge fuel after Academy / KPI proof off-chain.
    pub fn grant_energy(ctx: Context<GrantEnergy>, energy_bps: u16) -> Result<()> {
        require!(energy_bps > 0, EconomyError::ZeroAmount);
        let player = &mut ctx.accounts.player;
        let max = ctx.accounts.config.energy_max_bps;
        player.energy_bps = player.energy_bps.saturating_add(energy_bps).min(max);
        Ok(())
    }

    /// Authority-only: mint BCC reward to player ATA.
    pub fn mint_bcc(ctx: Context<MintBcc>, amount: u64) -> Result<()> {
        require!(amount > 0, EconomyError::ZeroAmount);
        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        let signer = &[seeds];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.bcc_mint.to_account_info(),
                    to: ctx.accounts.player_bcc_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;
        Ok(())
    }

    /// Authority-only: mint CGT reward to player ATA.
    pub fn mint_cgt(ctx: Context<MintCgt>, amount: u64) -> Result<()> {
        require!(amount > 0, EconomyError::ZeroAmount);
        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        let signer = &[seeds];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.cgt_mint.to_account_info(),
                    to: ctx.accounts.player_cgt_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;
        Ok(())
    }

    /// Burn BCC, mint CGT at config.swap_rate_bps (10000 = 1:1).
    pub fn swap_bcc_to_cgt(ctx: Context<SwapBccToCgt>, bcc_amount: u64) -> Result<()> {
        require!(bcc_amount > 0, EconomyError::ZeroAmount);
        let cgt_out = (bcc_amount as u128)
            .checked_mul(ctx.accounts.config.swap_rate_bps as u128)
            .and_then(|v| v.checked_div(10_000))
            .ok_or(EconomyError::MathOverflow)? as u64;
        require!(cgt_out > 0, EconomyError::ZeroAmount);

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.bcc_mint.to_account_info(),
                    from: ctx.accounts.player_bcc_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            bcc_amount,
        )?;

        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        let signer = &[seeds];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.cgt_mint.to_account_info(),
                    to: ctx.accounts.player_cgt_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            cgt_out,
        )?;
        Ok(())
    }

    /// Daily streak claim — once per 20h window.
    pub fn claim_daily(ctx: Context<ClaimDaily>) -> Result<()> {
        let clock = Clock::get()?;
        let player = &mut ctx.accounts.player;
        let elapsed = clock.unix_timestamp.saturating_sub(player.last_daily_ts);
        require!(elapsed >= 20 * 3600 || player.last_daily_ts == 0, EconomyError::DailyCooldown);

        player.last_daily_ts = clock.unix_timestamp;
        player.streak = player.streak.saturating_add(1);
        let max = ctx.accounts.config.energy_max_bps;
        player.energy_bps = player.energy_bps.saturating_add(DAILY_ENERGY_BPS).min(max);

        let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
        let signer = &[seeds];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.bcc_mint.to_account_info(),
                    to: ctx.accounts.player_bcc_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            DAILY_BCC_REWARD,
        )?;
        Ok(())
    }

    /// Mint a miner asset PDA; burns MINER_MINT_COST_CGT from player.
    /// `asset_id` must equal current `config.miner_count` (client reads config first).
    pub fn mint_miner(
        ctx: Context<MintMiner>,
        asset_id: u64,
        skin: u8,
        hashrate: u32,
        rarity: u8,
    ) -> Result<()> {
        require!(skin <= 3, EconomyError::InvalidSkin);
        require!(hashrate > 0, EconomyError::ZeroAmount);
        require!(rarity <= 4, EconomyError::InvalidRarity);
        require!(
            asset_id == ctx.accounts.config.miner_count,
            EconomyError::BadAssetId
        );

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.cgt_mint.to_account_info(),
                    from: ctx.accounts.player_cgt_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            MINER_MINT_COST_CGT,
        )?;

        let cfg = &mut ctx.accounts.config;
        cfg.miner_count = cfg.miner_count.saturating_add(1);

        let miner = &mut ctx.accounts.miner;
        miner.asset_id = asset_id;
        miner.owner = ctx.accounts.owner.key();
        miner.skin = skin;
        miner.hashrate = hashrate;
        miner.level = 1;
        miner.max_level = 5;
        miner.rarity = rarity;
        miner.bump = ctx.bumps.miner;

        let player = &mut ctx.accounts.player;
        player.mining_power = player
            .mining_power
            .saturating_add(hashrate as u64);

        Ok(())
    }

    pub fn list_miner(ctx: Context<ListMiner>, price_cgt: u64) -> Result<()> {
        require!(price_cgt > 0, EconomyError::ZeroAmount);
        require!(
            ctx.accounts.miner.owner == ctx.accounts.seller.key(),
            EconomyError::NotMinerOwner
        );

        let listing = &mut ctx.accounts.listing;
        listing.miner = ctx.accounts.miner.key();
        listing.seller = ctx.accounts.seller.key();
        listing.price_cgt = price_cgt;
        listing.bump = ctx.bumps.listing;
        Ok(())
    }

    pub fn cancel_list(ctx: Context<CancelList>) -> Result<()> {
        require!(
            ctx.accounts.listing.seller == ctx.accounts.seller.key(),
            EconomyError::NotListingSeller
        );
        Ok(())
    }

    pub fn buy_miner(ctx: Context<BuyMiner>) -> Result<()> {
        let price = ctx.accounts.listing.price_cgt;
        require!(price > 0, EconomyError::ZeroAmount);
        require!(
            ctx.accounts.buyer.key() != ctx.accounts.listing.seller,
            EconomyError::CannotBuyOwn
        );
        require!(
            ctx.accounts.fee_treasury_cgt_ata.owner == ctx.accounts.config.fee_treasury,
            EconomyError::BadFeeTreasury
        );

        let fee_bps = ctx.accounts.config.marketplace_fee_bps as u128;
        let fee = (price as u128)
            .checked_mul(fee_bps)
            .and_then(|v| v.checked_div(10_000))
            .ok_or(EconomyError::MathOverflow)? as u64;
        let seller_amount = price.saturating_sub(fee);

        if fee > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_cgt_ata.to_account_info(),
                        to: ctx.accounts.fee_treasury_cgt_ata.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        if seller_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.buyer_cgt_ata.to_account_info(),
                        to: ctx.accounts.seller_cgt_ata.to_account_info(),
                        authority: ctx.accounts.buyer.to_account_info(),
                    },
                ),
                seller_amount,
            )?;
        }

        let hashrate = ctx.accounts.miner.hashrate as u64;
        let seller_key = ctx.accounts.listing.seller;
        let buyer_key = ctx.accounts.buyer.key();

        let miner = &mut ctx.accounts.miner;
        require!(miner.owner == seller_key, EconomyError::NotMinerOwner);
        miner.owner = buyer_key;

        let seller_player = &mut ctx.accounts.seller_player;
        seller_player.mining_power = seller_player.mining_power.saturating_sub(hashrate);

        let buyer_player = &mut ctx.accounts.buyer_player;
        buyer_player.mining_power = buyer_player.mining_power.saturating_add(hashrate);

        Ok(())
    }

    /// Optional client sync: reduce energy (reactor drain).
    pub fn drain_energy(ctx: Context<DrainEnergy>, energy_bps: u16) -> Result<()> {
        require!(energy_bps > 0, EconomyError::ZeroAmount);
        let player = &mut ctx.accounts.player;
        player.energy_bps = player.energy_bps.saturating_sub(energy_bps);
        Ok(())
    }
}

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub bcc_mint: Pubkey,
    pub cgt_mint: Pubkey,
    pub swap_rate_bps: u16,
    pub energy_max_bps: u16,
    pub miner_count: u64,
    pub bump: u8,
    /// Protocol cut on buy_miner (basis points).
    pub marketplace_fee_bps: u16,
    /// Receives CGT marketplace fees.
    pub fee_treasury: Pubkey,
}

impl Config {
    // discriminator + authority + bcc + cgt + swap + energy + miner_count + bump + fee_bps + fee_treasury
    pub const LEN: usize = 8 + 32 + 32 + 32 + 2 + 2 + 8 + 1 + 2 + 32;
}

#[account]
pub struct Player {
    pub owner: Pubkey,
    pub energy_bps: u16,
    pub mining_power: u64,
    pub streak: u32,
    pub last_daily_ts: i64,
    pub bump: u8,
}

impl Player {
    pub const LEN: usize = 8 + 32 + 2 + 8 + 4 + 8 + 1;
}

#[account]
pub struct MinerAsset {
    pub asset_id: u64,
    pub owner: Pubkey,
    pub skin: u8,
    pub hashrate: u32,
    pub level: u8,
    pub max_level: u8,
    pub rarity: u8,
    pub bump: u8,
}

impl MinerAsset {
    pub const LEN: usize = 8 + 8 + 32 + 1 + 4 + 1 + 1 + 1 + 1;
}

#[account]
pub struct Listing {
    pub miner: Pubkey,
    pub seller: Pubkey,
    pub price_cgt: u64,
    pub bump: u8,
}

impl Listing {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Config::LEN,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,
    pub bcc_mint: Account<'info, Mint>,
    pub cgt_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = Player::LEN,
        seeds = [b"player", owner.key().as_ref()],
        bump
    )]
    pub player: Account<'info, Player>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GrantEnergy<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ EconomyError::BadAuthority
    )]
    pub config: Account<'info, Config>,
    /// CHECK: player owner wallet
    pub owner: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner @ EconomyError::BadPlayer
    )]
    pub player: Account<'info, Player>,
}

#[derive(Accounts)]
pub struct MintBcc<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ EconomyError::BadAuthority,
        has_one = bcc_mint
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub bcc_mint: Account<'info, Mint>,
    /// CHECK: player wallet
    pub owner: UncheckedAccount<'info>,
    #[account(
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = bcc_mint,
        associated_token::authority = owner
    )]
    pub player_bcc_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintCgt<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = authority @ EconomyError::BadAuthority,
        has_one = cgt_mint
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub cgt_mint: Account<'info, Mint>,
    /// CHECK: player wallet
    pub owner: UncheckedAccount<'info>,
    #[account(
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = owner
    )]
    pub player_cgt_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SwapBccToCgt<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = bcc_mint,
        has_one = cgt_mint
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub bcc_mint: Account<'info, Mint>,
    #[account(mut)]
    pub cgt_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = bcc_mint,
        associated_token::authority = owner
    )]
    pub player_bcc_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = owner
    )]
    pub player_cgt_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimDaily<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = bcc_mint
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub bcc_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = bcc_mint,
        associated_token::authority = owner
    )]
    pub player_bcc_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(asset_id: u64)]
pub struct MintMiner<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        has_one = cgt_mint
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub cgt_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = owner
    )]
    pub player_cgt_ata: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = MinerAsset::LEN,
        seeds = [b"miner", asset_id.to_le_bytes().as_ref()],
        bump
    )]
    pub miner: Account<'info, MinerAsset>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListMiner<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        seeds = [b"miner", &miner.asset_id.to_le_bytes()],
        bump = miner.bump
    )]
    pub miner: Account<'info, MinerAsset>,
    #[account(
        init,
        payer = seller,
        space = Listing::LEN,
        seeds = [b"listing", miner.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelList<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        close = seller,
        seeds = [b"listing", listing.miner.as_ref()],
        bump = listing.bump,
        has_one = seller
    )]
    pub listing: Account<'info, Listing>,
}

#[derive(Accounts)]
pub struct BuyMiner<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        has_one = cgt_mint
    )]
    pub config: Account<'info, Config>,
    pub cgt_mint: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"miner", &miner.asset_id.to_le_bytes()],
        bump = miner.bump
    )]
    pub miner: Account<'info, MinerAsset>,
    #[account(
        mut,
        close = buyer,
        seeds = [b"listing", miner.key().as_ref()],
        bump = listing.bump,
        constraint = listing.miner == miner.key() @ EconomyError::NotMinerOwner
    )]
    pub listing: Account<'info, Listing>,
    /// CHECK: seller wallet from listing
    #[account(address = listing.seller)]
    pub seller: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"player", seller.key().as_ref()],
        bump = seller_player.bump,
        constraint = seller_player.owner == seller.key() @ EconomyError::BadPlayer
    )]
    pub seller_player: Account<'info, Player>,
    #[account(
        mut,
        seeds = [b"player", buyer.key().as_ref()],
        bump = buyer_player.bump,
        constraint = buyer_player.owner == buyer.key() @ EconomyError::BadPlayer
    )]
    pub buyer_player: Account<'info, Player>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = buyer
    )]
    pub buyer_cgt_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = seller
    )]
    pub seller_cgt_ata: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = cgt_mint,
        associated_token::authority = config.fee_treasury
    )]
    pub fee_treasury_cgt_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DrainEnergy<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"player", owner.key().as_ref()],
        bump = player.bump,
        has_one = owner
    )]
    pub player: Account<'info, Player>,
}

#[error_code]
pub enum EconomyError {
    #[msg("Amount must be > 0")]
    ZeroAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Bad economy authority")]
    BadAuthority,
    #[msg("Bad player account")]
    BadPlayer,
    #[msg("Daily claim on cooldown")]
    DailyCooldown,
    #[msg("Invalid miner skin")]
    InvalidSkin,
    #[msg("Invalid rarity")]
    InvalidRarity,
    #[msg("Not miner owner")]
    NotMinerOwner,
    #[msg("Not listing seller")]
    NotListingSeller,
    #[msg("Cannot buy your own listing")]
    CannotBuyOwn,
    #[msg("asset_id must equal config.miner_count")]
    BadAssetId,
    #[msg("Fee treasury ATA owner mismatch")]
    BadFeeTreasury,
}
