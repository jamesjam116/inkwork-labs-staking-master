import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import { stakeNFT, withdrawNft } from "../contexts/transaction";
import { getNftMetaData } from "../contexts/utils";
import { Skeleton } from "@mui/material";

export default function NFTCard(props: {
  mint: string;
  staked: boolean;
  wallet: WalletContextState;
  updatePage: Function;
}) {
  const { mint, staked, wallet } = props;
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  const getNFTdetail = async () => {
    const uri = await getNftMetaData(new PublicKey(props.mint));
    await fetch(uri)
      .then((resp) => resp.json())
      .then((json) => {
        setImage(json.image);
        const name = json.name;
        setName(name);
        let nftId = name.split("#")[1];
        setId("#" + nftId);
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  const onStake = async () => {
    try {
      await stakeNFT(
        wallet,
        [{ mint: new PublicKey(mint) }],
        () => setLoading(true),
        () => setLoading(false),
        props.updatePage
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onUnStake = async () => {
    try {
      await withdrawNft(
        wallet,
        [{ mint: new PublicKey(mint) }],
        () => setLoading(true),
        () => setLoading(false),
        props.updatePage
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getNFTdetail();
    // eslint-disable-next-line
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (cardRef.current) {
      setDimensions({
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
      });
    }
  }, []);
  return (
    <div className="nft-card" ref={cardRef}>
      <div className="media">
        {image === "" ? (
          <Skeleton
            variant="rectangular"
            style={{ width: "100%", height: dimensions.width }}
          />
        ) : (
          // eslint-disable-next-line
          <img src={image} alt="" style={{ height: dimensions.width }} />
        )}
        <div className="card-content">
          <div className="info">
            <h5>ID</h5>
            <p>{id}</p>
          </div>
          <div className="info">
            <h5>RANK</h5>
            <p>{id}</p>
          </div>
        </div>
        {!staked ? (
          <button
            className="btn-action"
            onClick={() => onStake()}
            disabled={loading}
          >
            {!loading ? <>Stake</> : <ClipLoader color="#FFF" size={18} />}
          </button>
        ) : (
          <button
            className="btn-action"
            onClick={() => onUnStake()}
            disabled={loading}
          >
            {!loading ? <>Untake</> : <ClipLoader color="#FFF" size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
