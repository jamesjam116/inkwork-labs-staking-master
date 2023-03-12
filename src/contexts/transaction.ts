import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  ParsedAccountData,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { successAlert } from "../components/toastGroup";
import { IDL as StakingIDL } from "./staking";
import {
  STAKING_PROGRAM_ID,
  GLOBAL_AUTHORITY_SEED,
  GlobalPool,
  INK_TOKEN_MINT,
  USER_POOL_SIZE,
  INK_TOKEN_DECIMAL,
  UserPool,
  THREAD_SECOND,
  THREAD_THIRD,
  DAY,
  THREAD_FIRST,
} from "./type";
import {
  getAssociatedTokenAccount,
  getATokenAccountsNeedCreate,
  getNFTTokenAccount,
  getOwnerOfNFT,
  getMetadata,
  isExistAccount,
  solConnection,
  filterError,
} from "./utils";

export const initUserPool = async (wallet: WalletContextState) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  const userAddress = wallet.publicKey;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  try {
    const tx = await createInitUserPoolTx(userAddress, program, solConnection);
    let { blockhash } = await provider.connection.getLatestBlockhash(
      "confirmed"
    );
    tx.feePayer = wallet.publicKey as PublicKey;
    tx.recentBlockhash = blockhash;
    if (wallet.signTransaction !== undefined) {
      let signedTx = await wallet.signTransaction(tx);

      let txId = await provider.connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: "confirmed",
        }
      );

      console.log(txId, "==> txId");

      await solConnection.confirmTransaction(txId, "finalized");
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * Stake NFT
 * @param mint The nft mint address
 */
export const stakeNFT = async (
  wallet: WalletContextState,
  nfts: {
    mint: PublicKey;
  }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  const userAddress = wallet.publicKey;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  try {
    startLoading();
    let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
      userAddress,
      "user-pool",
      STAKING_PROGRAM_ID
    );

    let poolAccount = await solConnection.getAccountInfo(userPoolKey);
    if (poolAccount === null || poolAccount.data === null) {
      await initUserPool(wallet);
    }
    let transactions: Transaction[] = [];
    for (let item of nfts) {
      const tx = await createStakeNftTx(
        item.mint,
        userAddress,
        program,
        solConnection
      );
      if (tx) {
        transactions.push(tx);
      }
    }
    if (transactions.length !== 0) {
      let { blockhash } = await provider.connection.getRecentBlockhash(
        "confirmed"
      );
      transactions.forEach((transaction) => {
        transaction.feePayer = wallet.publicKey as PublicKey;
        transaction.recentBlockhash = blockhash;
      });
      if (wallet.signAllTransactions !== undefined) {
        const signedTransactions = await wallet.signAllTransactions(
          transactions
        );

        let signatures = await Promise.all(
          signedTransactions.map((transaction) =>
            provider.connection.sendRawTransaction(transaction.serialize(), {
              skipPreflight: true,
              maxRetries: 3,
              preflightCommitment: "confirmed",
            })
          )
        );
        await Promise.all(
          signatures.map((signature) =>
            provider.connection.confirmTransaction(signature, "finalized")
          )
        );
        closeLoading();
        updatePage();
        successAlert("Transaction is confirmed!");
      }
    } else {
      closeLoading();
    }
  } catch (error) {
    closeLoading();
    filterError(error);
    console.log(error);
  }
};

/**
 * Claim Reward $INK
 * @param mint The nft mint address to claim
 */
export const claimReward = async (
  wallet: WalletContextState,
  nfts: { mint: PublicKey }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  const userAddress = wallet.publicKey;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  try {
    startLoading();
    let transactions: Transaction[] = [];
    for (let item of nfts) {
      const tx = await createClaimTx(
        item.mint,
        userAddress,
        program,
        solConnection
      );
      if (tx) {
        transactions.push(tx);
      }
    }
    if (transactions.length !== 0) {
      let { blockhash } = await provider.connection.getRecentBlockhash(
        "confirmed"
      );
      transactions.forEach((transaction) => {
        transaction.feePayer = wallet.publicKey as PublicKey;
        transaction.recentBlockhash = blockhash;
      });
      if (wallet.signAllTransactions !== undefined) {
        const signedTransactions = await wallet.signAllTransactions(
          transactions
        );

        let signatures = await Promise.all(
          signedTransactions.map((transaction) =>
            provider.connection.sendRawTransaction(transaction.serialize(), {
              skipPreflight: true,
              maxRetries: 3,
              preflightCommitment: "confirmed",
            })
          )
        );
        await Promise.all(
          signatures.map((signature) =>
            provider.connection.confirmTransaction(signature, "finalized")
          )
        );
        closeLoading();
        successAlert("Transaction is confirmed!");
        updatePage();
      }
    } else {
      closeLoading();
    }
  } catch (error) {
    closeLoading();
    filterError(error);
    console.log(error);
  }
};

/**
 * Withdraw NFT function
 * @param mint The nft address to withdraw
 */
export const withdrawNft = async (
  wallet: WalletContextState,
  nfts: { mint: PublicKey }[],
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  const userAddress = wallet.publicKey;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );

  try {
    startLoading();

    let transactions: Transaction[] = [];
    for (let item of nfts) {
      const tx = await createWithdrawNftTx(
        item.mint,
        userAddress,
        program,
        solConnection
      );
      if (tx) {
        transactions.push(tx);
      }
    }
    if (transactions.length !== 0) {
      let { blockhash } = await provider.connection.getRecentBlockhash(
        "confirmed"
      );
      transactions.forEach((transaction) => {
        transaction.feePayer = wallet.publicKey as PublicKey;
        transaction.recentBlockhash = blockhash;
      });
      if (wallet.signAllTransactions !== undefined) {
        const signedTransactions = await wallet.signAllTransactions(
          transactions
        );

        let signatures = await Promise.all(
          signedTransactions.map((transaction) =>
            provider.connection.sendRawTransaction(transaction.serialize(), {
              skipPreflight: true,
              maxRetries: 3,
              preflightCommitment: "confirmed",
            })
          )
        );
        await Promise.all(
          signatures.map((signature) =>
            provider.connection.confirmTransaction(signature, "finalized")
          )
        );
        closeLoading();
        successAlert("Transaction is confirmed!");
        updatePage();
      }
    } else {
      closeLoading();
    }
  } catch (error) {
    closeLoading();
    filterError(error);
    console.log(error);
  }
};

export const withdrawToken = async (
  wallet: WalletContextState,
  amount: number,
  startLoading: Function,
  closeLoading: Function,
  updatePage: Function
) => {
  if (!wallet.publicKey) return;
  let cloneWindow: any = window;
  const userAddress = wallet.publicKey;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  try {
    startLoading();
    const tx = await createWithdrawTx(
      userAddress,
      amount,
      program,
      solConnection
    );
    let { blockhash } = await provider.connection.getLatestBlockhash(
      "confirmed"
    );
    tx.feePayer = wallet.publicKey as PublicKey;
    tx.recentBlockhash = blockhash;
    if (wallet.signTransaction !== undefined) {
      let signedTx = await wallet.signTransaction(tx);

      let txId = await provider.connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: "confirmed",
        }
      );

      console.log(txId, "==> txId");

      await solConnection.confirmTransaction(txId, "finalized");
      closeLoading();
      successAlert("Transaction is confirmed!");
      updatePage();
    }
  } catch (error) {
    closeLoading();
    filterError(error);
    console.log(error);
  }
};

export const createInitializeTx = async (
  userAddress: PublicKey,
  program: anchor.Program
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let tx = new Transaction();
  console.log("==>Initializing Program");

  tx.add(
    program.instruction.initialize(bump, {
      accounts: {
        admin: userAddress,
        globalAuthority,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createInitUserPoolTx = async (
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  console.log(USER_POOL_SIZE);
  let ix = SystemProgram.createAccountWithSeed({
    fromPubkey: userAddress,
    basePubkey: userAddress,
    seed: "user-pool",
    newAccountPubkey: userPoolKey,
    lamports: await connection.getMinimumBalanceForRentExemption(
      USER_POOL_SIZE
    ),
    space: USER_POOL_SIZE,
    programId: STAKING_PROGRAM_ID,
  });

  let tx = new Transaction();
  console.log("==>initializing user PDA", userPoolKey.toBase58());
  tx.add(ix);
  tx.add(
    program.instruction.initializeUserPool({
      accounts: {
        userPool: userPoolKey,
        owner: userAddress,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createStakeNftTx = async (
  mint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let userTokenAccount = await getAssociatedTokenAccount(userAddress, mint);
  if (!(await isExistAccount(userTokenAccount, connection))) {
    let accountOfNFT = await getNFTTokenAccount(mint, connection);
    if (userTokenAccount.toBase58() != accountOfNFT.toBase58()) {
      let nftOwner = await getOwnerOfNFT(mint, connection);
      if (nftOwner.toBase58() == userAddress.toBase58())
        userTokenAccount = accountOfNFT;
      else if (nftOwner.toBase58() !== globalAuthority.toBase58()) {
        throw "Error: Nft is not owned by user";
      }
    }
  }
  console.log("NFT = ", mint.toBase58(), userTokenAccount.toBase58());

  let { instructions, destinationAccounts } = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    globalAuthority,
    [mint]
  );

  console.log("Dest NFT Account = ", destinationAccounts[0].toBase58());

  const metadata = await getMetadata(mint);

  console.log("Metadata=", metadata.toBase58());

  let tx = new Transaction();

  if (instructions.length > 0) instructions.map((ix) => tx.add(ix));
  console.log("==>Staking ...", mint.toBase58());

  tx.add(
    program.instruction.stakeNftToPool(bump, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        userNftTokenAccount: userTokenAccount,
        destNftTokenAccount: destinationAccounts[0],
        nftMint: mint,
        mintMetadata: metadata,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [],
      signers: [],
    })
  );
  console.log(tx, "==> staking tx");
  return tx;
};

export const createClaimTx = async (
  mint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [mint, INK_TOKEN_MINT]
  );
  let userTokenAccount = ret.destinationAccounts[0];
  console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    INK_TOKEN_MINT
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let tx = new Transaction();

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  console.log("==> Claiming ... ", mint.toBase58());
  console.log(globalAuthority.toBase58());
  console.log(rewardVault.toBase58());
  console.log(ret.destinationAccounts[1].toBase58());

  tx.add(
    program.instruction.claimReward(bump, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        rewardVault,
        userRewardAccount: ret.destinationAccounts[1],
        nftMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createWithdrawNftTx = async (
  mint: PublicKey,
  userAddress: PublicKey,
  program: anchor.Program,
  connection: Connection
) => {
  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [mint, INK_TOKEN_MINT]
  );
  let userTokenAccount = ret.destinationAccounts[0];
  console.log("User NFT = ", mint.toBase58(), userTokenAccount.toBase58());

  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    INK_TOKEN_MINT
  );
  let destNftTokenAccount = await getAssociatedTokenAccount(
    globalAuthority,
    mint
  );

  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );

  let tx = new Transaction();

  console.log(ret.instructions);
  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  console.log("==> Withdrawing ... ", mint.toBase58());

  tx.add(
    program.instruction.withdrawNftFromPool(bump, {
      accounts: {
        owner: userAddress,
        globalAuthority,
        userPool: userPoolKey,
        userNftTokenAccount: userTokenAccount,
        destNftTokenAccount,
        rewardVault,
        userRewardAccount: ret.destinationAccounts[1],
        nftMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      instructions: [],
      signers: [],
    })
  );

  return tx;
};

export const createWithdrawTx = async (
  userAddress: PublicKey,
  amount: number,
  program: anchor.Program,
  connection: Connection
) => {
  const [globalAuthority, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    INK_TOKEN_MINT
  );

  let ret = await getATokenAccountsNeedCreate(
    connection,
    userAddress,
    userAddress,
    [INK_TOKEN_MINT]
  );

  let tx = new Transaction();
  console.log("==> Withdrawing Token ... ", amount);

  if (ret.instructions.length > 0) ret.instructions.map((ix) => tx.add(ix));
  tx.add(
    program.instruction.withdrawToken(
      bump,
      new anchor.BN(amount * INK_TOKEN_DECIMAL),
      {
        accounts: {
          owner: userAddress,
          globalAuthority,
          rewardVault,
          userRewardAccount: ret.destinationAccounts[0],
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        instructions: [],
        signers: [],
      }
    )
  );

  return tx;
};

export const getUserPoolInfo = async (userAddress: PublicKey) => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  const userInfo: UserPool | null = await getUserPoolState(userAddress);
  if (userInfo)
    return {
      owner: userInfo.owner.toBase58(),
      stakedCount: userInfo.stakedCount.toNumber(),
      staking: userInfo.staking.map((info) => {
        return {
          mint: info.mint.toBase58(),
          stakedTime: info.stakedTime.toNumber(),
        };
      }),
    };
};

export const getGlobalInfo = async () => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  const globalPool: GlobalPool | null = await getGlobalState(program);
  if (globalPool) {
    const result = {
      admin: globalPool.superAdmin.toBase58(),
      totalStakedCount: globalPool.totalStakedCount.toNumber(),
    };
    return result;
  }
};

export const getAllNFTs = async (rpc?: string) => {
  return await getAllStakedNFTs(solConnection, rpc);
};

export const getGlobalState = async (
  program: anchor.Program
): Promise<GlobalPool | null> => {
  const [globalAuthority, _] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );
  try {
    let globalState = await program.account.globalPool.fetch(globalAuthority);
    return globalState as unknown as GlobalPool;
  } catch {
    return null;
  }
};

export const getUserPoolState = async (
  userAddress: PublicKey
): Promise<UserPool | null> => {
  let cloneWindow: any = window;
  let provider = new anchor.AnchorProvider(
    solConnection,
    cloneWindow["solana"],
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program(
    StakingIDL as anchor.Idl,
    STAKING_PROGRAM_ID,
    provider
  );
  let userPoolKey = await anchor.web3.PublicKey.createWithSeed(
    userAddress,
    "user-pool",
    STAKING_PROGRAM_ID
  );
  try {
    let userPoolState = await program.account.userPool.fetch(userPoolKey);
    return userPoolState as unknown as UserPool;
  } catch {
    return null;
  }
};

export const getAllStakedNFTs = async (
  connection: Connection,
  rpcUrl: string | undefined
) => {
  let solConnection = connection;

  if (rpcUrl) {
    solConnection = new anchor.web3.Connection(rpcUrl, "confirmed");
  }

  let poolAccounts = await solConnection.getProgramAccounts(
    STAKING_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: USER_POOL_SIZE,
        },
      ],
    }
  );

  console.log(`Encounter ${poolAccounts.length} NFT Data Accounts`);

  let result: UserPool[] = [];

  try {
    for (let idx = 0; idx < poolAccounts.length; idx++) {
      let data = poolAccounts[idx].account.data;
      const owner = new PublicKey(data.slice(8, 40));

      let buf = data.slice(40, 48).reverse();
      const stakedCount = new anchor.BN(buf);

      let staking = [];
      for (let i = 0; i < stakedCount.toNumber(); i++) {
        const mint = new PublicKey(data.slice(i * 56 + 48, i * 56 + 80));

        buf = data.slice(i * 56 + 80, i * 56 + 88).reverse();
        const stakedTime = new anchor.BN(buf);
        buf = data.slice(i * 56 + 88, i * 56 + 96).reverse();
        const lockTime = new anchor.BN(buf);
        buf = data.slice(i * 56 + 96, i * 56 + 104).reverse();
        const rewardAmount = new anchor.BN(buf);

        staking.push({
          mint,
          stakedTime,
          lockTime,
          rewardAmount,
        });
      }

      result.push({
        owner,
        stakedCount,
        staking,
      });
    }
  } catch (e) {
    console.log(e);
    return {};
  }

  return {
    count: result.length,
    data: result.map((info: UserPool) => {
      return {
        owner: info.owner.toBase58(),
        stakedCount: info.stakedCount.toNumber(),
        staking: info.staking.map((info) => {
          return {
            mint: info.mint.toBase58(),
            stakedTime: info.stakedTime.toNumber(),
          };
        }),
      };
    }),
  };
};

export const calcReward = async (
  userAddress: PublicKey,
  nftMint: PublicKey
) => {
  let userInfo = await getUserPoolInfo(userAddress);
  let valid = 0;
  let index;
  if (!userInfo) return;
  for (let i = 0; i < userInfo.stakedCount; i++) {
    if (userInfo.staking[i].mint === nftMint.toBase58()) {
      valid = 1;
      index = i;
    }
  }
  if (valid === 0) return 0;

  const [globalAuthority, _] = await PublicKey.findProgramAddress(
    [Buffer.from(GLOBAL_AUTHORITY_SEED)],
    STAKING_PROGRAM_ID
  );

  let rewardVault = await getAssociatedTokenAccount(
    globalAuthority,
    INK_TOKEN_MINT
  );
  const tokenAccount = await solConnection.getParsedAccountInfo(rewardVault);
  let amount = (tokenAccount.value?.data as ParsedAccountData).parsed.info
    .tokenAmount.uiAmount;

  let now = Math.floor(Date.now() / 1000);
  if (!index) return;
  let times = Math.floor((now - userInfo.staking[index].stakedTime) / DAY);

  let reward;
  if (amount > THREAD_SECOND && amount <= THREAD_THIRD) reward = 10 * times;
  if (amount <= THREAD_SECOND && amount > THREAD_FIRST) reward = 6.66 * times;
  if (amount <= THREAD_FIRST) reward = 3.33 * times;

  return reward;
};

export const calcAllReward = async (userAddress: PublicKey) => {
  let userInfo = await getUserPoolInfo(userAddress);
  let totalReward = 0;
  if (!userInfo) return;
  for (let i = 0; i < userInfo.stakedCount; i++) {
    const [globalAuthority, _] = await PublicKey.findProgramAddress(
      [Buffer.from(GLOBAL_AUTHORITY_SEED)],
      STAKING_PROGRAM_ID
    );

    let rewardVault = await getAssociatedTokenAccount(
      globalAuthority,
      INK_TOKEN_MINT
    );
    const tokenAccount = await solConnection.getParsedAccountInfo(rewardVault);
    let amount = (tokenAccount.value?.data as ParsedAccountData).parsed.info
      .tokenAmount.uiAmount;

    let now = Math.floor(Date.now() / 1000);
    let times = Math.floor((now - userInfo.staking[i].stakedTime) / DAY);

    let reward;
    if (amount > THREAD_SECOND && amount <= THREAD_THIRD) reward = 10 * times;
    if (amount <= THREAD_SECOND && amount > THREAD_FIRST) reward = 6.66 * times;
    if (amount <= THREAD_FIRST) reward = 3.33 * times;
    if (reward) totalReward += reward;
  }
  return totalReward;
};
