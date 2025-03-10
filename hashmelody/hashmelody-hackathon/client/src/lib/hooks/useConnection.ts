import { Connection } from "@solana/web3.js";
import { useMemo } from "react";
import { getConnectionConfig } from "@/lib/config/network";

export function useConnection() {
  return useMemo(() => {
    const config = getConnectionConfig();
    return new Connection(config.endpoint, config.commitment);
  }, []);
}