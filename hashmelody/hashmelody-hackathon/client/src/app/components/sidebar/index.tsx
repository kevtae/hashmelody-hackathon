import Link from "next/link";
import {
  Home,
  Upload,
  Library,
  // Search,
  Settings,
  User,
  FileText,
} from "lucide-react";
import { ConnectWallet } from "@/app/components/shared/ConnectWallet";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { DisconnectButton } from "@/app/components/shared/DisconnectButton";

export default function Sidebar() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Check if connected with Ethereum
  const hasEthereumWallet = wallets.some(
    (w) =>
      w.address &&
      w.address.startsWith("0x") &&
      w.walletClientType === "phantom"
  );

  return (
    <div className="fixed w-64 h-screen bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col">
      {/* Logo and brand */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-emerald-500">#</span>HashMelody
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Your music, your way</p>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <h2 className="text-xs uppercase text-zinc-500 font-semibold mb-4 tracking-wider">
          Navigation
        </h2>
        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors text-zinc-400 hover:bg-zinc-800/70 hover:text-white group"
          >
            <Home
              size={18}
              className="group-hover:text-emerald-500 transition-colors"
            />
            <span>Home</span>
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors text-zinc-400 hover:bg-zinc-800/70 hover:text-white group"
          >
            <Upload
              size={18}
              className="group-hover:text-emerald-500 transition-colors"
            />
            <span>Create</span>
          </Link>
          <Link
            href="/library"
            className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors text-zinc-400 hover:bg-zinc-800/70 hover:text-white group"
          >
            <Library
              size={18}
              className="group-hover:text-emerald-500 transition-colors"
            />
            <span>Library</span>
          </Link>
          {/* <Link
            href="/search"
            className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors text-zinc-400 hover:bg-zinc-800/70 hover:text-white group"
          >
            <Search
              size={18}
              className="group-hover:text-emerald-500 transition-colors"
            />
            <span>Search</span>
          </Link> */}
          <Link
            href="/about"
            className="flex items-center gap-3 py-2.5 px-3 rounded-md transition-colors text-zinc-400 hover:bg-zinc-800/70 hover:text-white group"
          >
            <FileText
              size={18}
              className="group-hover:text-emerald-500 transition-colors"
            />
            <span>About</span>
          </Link>
        </nav>
      </div>

      {/* Playlists section */}
      <div className="mb-6">
        <h2 className="text-xs uppercase text-zinc-500 font-semibold mb-4 tracking-wider">
          Your Playlists
        </h2>
        <div className="space-y-1">
          <Link
            href="/playlists/liked"
            className="flex items-center text-zinc-400 hover:text-white py-2 px-3 rounded-md hover:bg-zinc-800/70 transition-colors"
          >
            <span>Liked Songs</span>
          </Link>
          <Link
            href="/playlists/recent"
            className="flex items-center text-zinc-400 hover:text-white py-2 px-3 rounded-md hover:bg-zinc-800/70 transition-colors"
          >
            <span>Recently Played</span>
          </Link>
          <Link
            href="/playlists/trending"
            className="flex items-center text-zinc-400 hover:text-white py-2 px-3 rounded-md hover:bg-zinc-800/70 transition-colors"
          >
            <span>Trending Tracks</span>
          </Link>
        </div>
      </div>

      {/* User section at bottom with wallet functionality */}
      <div className="mt-auto pt-6 border-t border-zinc-800">
        {authenticated ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="flex items-center gap-3 py-2 text-zinc-400 hover:text-white rounded-md transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <User size={16} className="text-zinc-300" />
                </div>
                <div>
                  <p className="text-white text-sm">Profile</p>
                </div>
              </Link>

              <Link
                href="/settings"
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Settings size={18} />
              </Link>
            </div>

            {hasEthereumWallet && (
              <div className="text-xs text-amber-400 bg-amber-900/30 p-2 rounded-md">
                Connected with Ethereum. This app requires Solana.
              </div>
            )}

            <DisconnectButton />
          </div>
        ) : (
          <div className="space-y-3">
            <ConnectWallet />
            <div className="flex items-center justify-end">
              <Link
                href="/settings"
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
