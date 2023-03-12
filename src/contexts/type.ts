import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export interface GlobalPool {
  superAdmin: PublicKey;
}

export const GLOBAL_AUTHORITY_SEED = "global-authority";
export const VAULT_SEED = "vault-seed";

export const STAKING_PROGRAM_ID = new PublicKey(
  "ATvVsqAYMsUccCqiJFXbDQ4JxPW3ZER8h5K4co7Cx1y"
);
export const INK_TOKEN_MINT = new PublicKey(
  "JA552EChGJjhvMMcWrDjmqFqdNYPVFSDgumYUS3KRjvA"
);
export const INK_TOKEN_DECIMAL = 1_000_000_000;

export const USER_POOL_SIZE = 4048; // 8 + 4040

export interface GlobalPool {
  // 8 + 40
  superAdmin: PublicKey; // 32
  totalStakedCount: anchor.BN; // 8
}

export interface StakedData {
  mint: PublicKey; // 32
  stakedTime: anchor.BN; // 8
}

export interface UserPool {
  // 8 + 4040
  owner: PublicKey; // 32
  stakedCount: anchor.BN; // 8
  staking: StakedData[]; // 40 * 100
}

export const THREAD_THIRD = 50_000_000;
export const THREAD_SECOND = 30_000_000;
export const THREAD_FIRST = 15_000_000;

export const DAY = 600;
