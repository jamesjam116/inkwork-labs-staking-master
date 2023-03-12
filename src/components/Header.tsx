import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  CloseIcon,
  DiscordIcon,
  HambeguerIcon,
  MenuIcon,
  TwitterIcon,
} from "./svgIcons";

export default function Header() {
  const wallet = useWallet();
  const router = useRouter();
  const [routerName, setRouterName] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) {
      document.getElementsByTagName("body")[0].style.overflow = "hidden";
    } else {
      document.getElementsByTagName("body")[0].style.overflow = "auto";
    }
  }, [open]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Link href="/">
            <a>
              {/* eslint-disable-next-line */}
              <img src="/img/logo.svg" className="header-logo" alt="" />
            </a>
          </Link>
        </div>
        <div className="header-right">
          <div className="header-nav">
            <ul>
              <li>
                <Link href="/#ink">
                  <a>$INK</a>
                </Link>
              </li>
              <li>
                <Link href="https://magiceden.io/marketplace/ink_work">
                  <a>MagicEden</a>
                </Link>
              </li>
              <li>
                <Link href="https://opensea.io/collection/ink-work">
                  <a>OpenSea</a>
                </Link>
              </li>
              <li>
                <div className="social-link">
                  <Link href="https://discord.com/ink_work">
                    <a>
                      <DiscordIcon />
                    </a>
                  </Link>
                  <Link href="https://twitter.com/ink_work">
                    <a>
                      <TwitterIcon />
                    </a>
                  </Link>
                </div>
              </li>
            </ul>
          </div>
          <div className="mobile-menu">
            <button onClick={() => setOpen(!open)}>
              {open ? <CloseIcon /> : <HambeguerIcon />}
            </button>
          </div>
        </div>
        {open && (
          <div className="mobile-dropdown">
            <ul>
              <li>
                <Link href="/#ink">
                  <a>$INK</a>
                </Link>
              </li>
              <li>
                <Link href="https://magiceden.io/marketplace/ink_work">
                  <a>MagicEden</a>
                </Link>
              </li>
              <li>
                <Link href="https://opensea.io/collection/ink-work">
                  <a>OpenSea</a>
                </Link>
              </li>
              <li>
                <div className="social-link">
                  <Link href="https://discord.com/ink_work">
                    <a>
                      <DiscordIcon />
                    </a>
                  </Link>
                  <Link href="https://twitter.com/ink_work">
                    <a>
                      <TwitterIcon />
                    </a>
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
