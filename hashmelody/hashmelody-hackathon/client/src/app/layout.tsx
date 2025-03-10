// src/app/layout.tsx
"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

import "./globals.css";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!privyAppId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable");
  }

  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          clientId="client-WY5g65KYPRgEnV2W6LLFVtupRgpajTb2B8J86maUwJjs1"
          config={{
            appearance: {
              theme: "light",
              accentColor: "#676FFF",
              logo: "https://your-logo-url",
              walletChainType: 'solana-only',
            },
            embeddedWallets: {
              solana: {
                createOnLogin: 'users-without-wallets',
              },
              ethereum: {
                createOnLogin: 'off'
              }
            },
            externalWallets: {
              solana: {
                connectors: solanaConnectors,
              },
            },
          }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}