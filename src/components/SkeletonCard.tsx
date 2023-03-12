import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "@mui/material";

export default function SkeletonCard() {
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
        <Skeleton
          variant="rectangular"
          style={{ width: "100%", height: dimensions.width }}
        />
        <div className="card-content">
          <div className="info">
            <h5>ID</h5>
            <p>
              <Skeleton
                variant="rectangular"
                style={{
                  width: 100,
                  height: 40,
                  borderRadius: 8,
                  marginRight: "auto",
                  marginLeft: "auto",
                }}
              />
            </p>
          </div>
          <div className="info">
            <h5>RANK</h5>
            <p>
              <Skeleton
                variant="rectangular"
                style={{
                  width: 100,
                  height: 40,
                  borderRadius: 8,
                  marginRight: "auto",
                  marginLeft: "auto",
                }}
              />
            </p>
          </div>
        </div>
        <Skeleton
          variant="rectangular"
          style={{
            width: "calc(100% - 40px)",
            height: 50,
            borderRadius: 8,
            marginRight: "auto",
            marginLeft: "auto",
            marginBottom: 20,
          }}
        />
      </div>
    </div>
  );
}
