export interface IrysUploadParams {
  file: File | Buffer;
  userId: string;
  walletAddress: string;
  metadata: Record<string, unknown>; // Allows any value but forces TypeScript checks
}

export interface IrysUploadResult {
  transactionId: string;
  gatewayUrl: string;
}

import BigNumber from "bignumber.js";

export interface FundResponse {
  quantity: string; // ✅ Correct type according to API response
}

export interface UploaderInstance {
  getBalance: () => Promise<BigNumber>;
  utils: {
    fromAtomic: (value: BigNumber) => BigNumber;
    toAtomic: (value: number) => BigNumber;
  };
  fund: (amount: BigNumber) => Promise<FundResponse>; // ✅ Use FundResponse type
  token: string;
}
