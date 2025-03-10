import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useSolanaWallets } from "@privy-io/react-auth";
import { Hashmelody } from "@/lib/idl/hashmelody";
import idl from "@/lib/idl/hashmelody.json";
import { getNetworkConfig } from "@/lib/config/network";


export function useAnchorProgram() {
  const { wallets: solanaWallets } = useSolanaWallets();
  const solanaWallet = solanaWallets.length > 0 ? solanaWallets[0] : null;

  if (!solanaWallet) {
    return null;
  }

  const networkConfig = getNetworkConfig();


  // Create connection
  const connection = new Connection(
    networkConfig.rpcUrl,
    "confirmed"
  );

  // Create provider with a wallet that implements both signTransaction and signAllTransactions
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: new PublicKey(solanaWallet.address),
      signTransaction: solanaWallet.signTransaction.bind(solanaWallet),
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(transactions: T[]) => {
        // Sign each transaction individually
        const signedTransactions: T[] = [];
        for (const transaction of transactions) {
          const signedTx = await solanaWallet.signTransaction(transaction);
          signedTransactions.push(signedTx);
        }
        return signedTransactions;
      }
    },
    { commitment: "confirmed" }
  );

  return new Program(idl as Hashmelody, provider);
}