import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { PublicKey } from "@solana/web3.js";
import { ClipLoader } from "react-spinners";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import StakedProgress from "../components/StakedProgress";
import { useWallet } from "@solana/wallet-adapter-react";
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { getMarketPlaceInfo, solConnection } from "../contexts/utils";
import { CREATOR_ADDRESS } from "../config";
import NFTCard from "../components/NFTCard";
import SkeletonCard from "../components/SkeletonCard";
import {
  calcAllReward,
  claimReward,
  getGlobalInfo,
  getUserPoolState,
  stakeNFT,
  withdrawNft,
} from "../contexts/transaction";

export interface NFTType {
  mint: string;
  staked: boolean;
  stakedTime: number;
}

const Home: NextPage = () => {
  const wallet = useWallet();
  const [minimunValueLocked, setMinimumValueLocked] = useState(1600736);
  const [totalInkersStaked, setTotalInkersStaked] = useState(0);
  const [staked, setStaked] = useState<NFTType[]>([]);
  const [unStaked, setUnStaked] = useState<NFTType[]>([]);
  const [pageTab, setPageTab] = useState("mine");
  const [totalReward, setTotalReward] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  // Loading status
  const [isStakeLoading, setIsStakeLoading] = useState(false);
  const [isUnStakeLoading, setIsUnStakeLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  const getAllNfts = async () => {
    if (wallet.publicKey === null) return;
    try {
      setPageLoading(true);
      const nftList = await getParsedNftAccountsByOwner({
        publicAddress: wallet.publicKey.toBase58(),
        connection: solConnection,
      });
      let list: NFTType[] = [];
      if (nftList.length > 0) {
        for (let item of nftList) {
          if (item.data?.creators)
            if (item.data?.creators[0].address === CREATOR_ADDRESS)
              list.push({
                mint: item?.mint,
                staked: false,
                stakedTime: new Date().getTime(),
              });
        }
      }
      setUnStaked(list);
      setPageLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const getPoolData = async () => {
    const globalData = await getGlobalInfo();
    if (globalData) {
      setTotalInkersStaked(globalData.totalStakedCount);
      const marketPrice = await getMarketPlaceInfo();
      setMinimumValueLocked(marketPrice * globalData.totalStakedCount);
    }
    if (wallet.publicKey === null) return;
    const userPoolData = await getUserPoolState(wallet.publicKey);
    const rewards = await calcAllReward(wallet.publicKey);
    if (rewards) {
      setTotalReward(rewards);
    } else {
      setTotalReward(0);
    }
    if (userPoolData) {
      const stakedNum = userPoolData.stakedCount.toNumber();
      const nfts = userPoolData.staking;
      let stakedNfts: NFTType[] = [];
      if (stakedNum !== 0) {
        for (let i = 0; i < stakedNum; i++) {
          stakedNfts.push({
            mint: nfts[i].mint.toBase58(),
            staked: true,
            stakedTime: nfts[i].stakedTime.toNumber() * 1000,
          });
        }
      }
      setStaked(stakedNfts);
    }
  };

  const onClaim = async () => {
    if (wallet.publicKey === null) return;
    if (staked.length === 0) return;
    let reqNfts: { mint: PublicKey }[] = [];
    for (let item of staked) {
      reqNfts.push({
        mint: new PublicKey(item.mint),
      });
    }
    try {
      await claimReward(
        wallet,
        reqNfts,
        () => setIsClaimLoading(true),
        () => setIsClaimLoading(false),
        updatePage
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onStakedAll = async () => {
    if (wallet.publicKey === null) return;
    if (unStaked.length === 0) return;
    let reqNfts: { mint: PublicKey }[] = [];
    for (let item of unStaked) {
      reqNfts.push({
        mint: new PublicKey(item.mint),
      });
    }
    try {
      await stakeNFT(
        wallet,
        reqNfts,
        () => setIsStakeLoading(true),
        () => setIsStakeLoading(false),
        updatePage
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onUnStakedAll = async () => {
    if (wallet.publicKey === null) return;
    if (staked.length === 0) return;
    let reqNfts: { mint: PublicKey }[] = [];
    for (let item of staked) {
      reqNfts.push({
        mint: new PublicKey(item.mint),
      });
    }
    try {
      await withdrawNft(
        wallet,
        reqNfts,
        () => setIsUnStakeLoading(true),
        () => setIsUnStakeLoading(false),
        updatePage
      );
    } catch (error) {
      console.log(error);
    }
  };

  const updatePage = async () => {
    await getPoolData();
    await getAllNfts();
  };

  useEffect(() => {
    updatePage();
    // eslint-disable-next-line
  }, [wallet.publicKey, wallet.connected]);

  return (
    <main>
      <div className="container">
        <div className="hero">
          <h1>
            Stake your Inkers for <span>$INK</span>
          </h1>
        </div>
        <div className="wallet">
          <WalletModalProvider>
            <WalletMultiButton />
          </WalletModalProvider>
        </div>
        <div className="">
          <StakedProgress staked={totalInkersStaked} totalSupply={5000} />
        </div>
        {!wallet.publicKey ? (
          <div className="unlocked-total-view">
            <div className="total-box">
              {/* eslint-disable-next-line */}
              <img src="/img/yellow-potion.png" alt="" />
              <h1>$ {minimunValueLocked.toLocaleString()}</h1>
              <p>Minimum Value Locked</p>
            </div>
            <div className="total-box">
              {/* eslint-disable-next-line */}
              <img src="/img/purple-potion.png" alt="" />
              <h1>{totalInkersStaked.toLocaleString()}</h1>
              <p>Total Inkers Staked</p>
            </div>
          </div>
        ) : (
          <div className="locked-total-view">
            <div className="total-box">
              {/* eslint-disable-next-line */}
              <img src="/img/blue-potion.png" alt="" />
              <h1>Inkers Staked</h1>
              <p>{staked.length}</p>
            </div>
            <div className="total-box">
              {/* eslint-disable-next-line */}
              <img src="/img/yellow-potion.png" alt="" />
              <h1>$INK / day</h1>
              <p>{30}</p>
            </div>
            <div className="total-box">
              {/* eslint-disable-next-line */}
              <img src="/img/purple-potion.png" alt="" />
              <h1>Claimable $INK</h1>
              <div className="reward-claim">
                <p>{totalReward.toLocaleString()}</p>
                <button
                  className="btn-claim"
                  onClick={() => onClaim()}
                  disabled={isClaimLoading}
                >
                  {!isClaimLoading ? (
                    <>Claim</>
                  ) : (
                    <ClipLoader color="#FFF" size={24} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {wallet.publicKey && (
          <div className="nfts-content">
            <div className="page-tabs">
              <button
                className={`btn-tab ${pageTab === "mine" ? "active" : ""}`}
                onClick={() => setPageTab("mine")}
              >
                My Wallet <span>({unStaked.length})</span>
              </button>
              <button
                className={`btn-tab ${pageTab === "staked" ? "active" : ""}`}
                onClick={() => setPageTab("staked")}
              >
                Staked Inkers <span>({staked.length})</span>
              </button>
            </div>
            {pageTab === "mine" && (
              <div className="nfts-box">
                {pageLoading ? (
                  [1, 2, 3, 4, 5, 6].map((item, key) => (
                    <SkeletonCard key={key} />
                  ))
                ) : (
                  <>
                    {unStaked.length > 0 &&
                      unStaked.map((item, key) => (
                        <NFTCard
                          key={key}
                          mint={item.mint}
                          staked={item.staked}
                          wallet={wallet}
                          updatePage={updatePage}
                        />
                      ))}
                  </>
                )}
              </div>
            )}
            {pageTab === "staked" && (
              <div className="nfts-box">
                {pageLoading ? (
                  [1, 2, 3, 4, 5, 6].map((item, key) => (
                    <SkeletonCard key={key} />
                  ))
                ) : (
                  <>
                    {staked.length > 0 &&
                      staked.map((item, key) => (
                        <NFTCard
                          key={key}
                          mint={item.mint}
                          staked={item.staked}
                          wallet={wallet}
                          updatePage={updatePage}
                        />
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {wallet.publicKey && (
        <div className="action">
          <div className="container">
            {pageTab === "mine" && unStaked.length > 0 && (
              <button
                className="btn-all"
                disabled={isStakeLoading}
                onClick={() => onStakedAll()}
              >
                {!isStakeLoading ? (
                  <>Stake All</>
                ) : (
                  <ClipLoader color="#FFF" size={24} />
                )}
              </button>
            )}
            {pageTab === "staked" && staked.length > 0 && (
              <button
                className="btn-all"
                disabled={isUnStakeLoading}
                onClick={() => onUnStakedAll()}
              >
                {!isUnStakeLoading ? (
                  <>Unstake All</>
                ) : (
                  <ClipLoader color="#FFF" size={24} />
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
