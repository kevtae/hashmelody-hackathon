import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";
import { IRYS_CONFIG, buildGatewayUrl } from "./config";
import type { IrysUploadParams, IrysUploadResult } from "./types";
import { UploaderInstance } from "./types";
import BigNumber from "bignumber.js";

export class IrysService {
  private static async getUploader() {
    const SOLANA_PRIVATE_KEY = process.env.PRIVATE_KEY_SOL;
    if (!SOLANA_PRIVATE_KEY) {
      throw new Error("SOLANA_PRIVATE_KEY not set");
    }

    return await Uploader(Solana)
      .withWallet(SOLANA_PRIVATE_KEY)
      .withRpc(IRYS_CONFIG.RPC_URL)
      .devnet();
  }

  private static async fundIfNeeded(irys: UploaderInstance) {
    const atomicBalance: BigNumber = await irys.getBalance();
    console.log(`Node balance (atomic) = ${atomicBalance.toString()}`);

    const bigNumberBalance: BigNumber = irys.utils.fromAtomic(atomicBalance);
    console.log(`Node balance (converted) = ${bigNumberBalance.toString()}`);

    const numericBalance = bigNumberBalance.toNumber();

    if (numericBalance < IRYS_CONFIG.MIN_BALANCE) {
      console.log(
        `Balance below threshold (${IRYS_CONFIG.MIN_BALANCE}), funding with ${IRYS_CONFIG.FUND_AMOUNT}...`
      );

      const fundTx = await irys.fund(
        irys.utils.toAtomic(IRYS_CONFIG.FUND_AMOUNT)
      );

      // Convert `quantity` from `string` to `BigNumber`
      const fundedAmount = new BigNumber(fundTx.quantity);

      console.log(
        `Successfully funded ${fundedAmount.toString()} ${irys.token}`
      );
    }
  }

  public static async upload(
    params: IrysUploadParams
  ): Promise<IrysUploadResult> {
    const irys = await this.getUploader();

    // Fund if needed
    await this.fundIfNeeded(irys);

    // Prepare metadata tags
    const metadataTags = Object.entries(params.metadata).map(
      ([name, value]) => ({
        name,
        value: typeof value === "string" ? value : JSON.stringify(value),
      })
    );

    // Add essential tags including Content-Type
    const tags = [
      // Always include content type as first tag to ensure proper handling
      { name: "Content-Type", value: "audio/mpeg" },
      // Include all metadata
      ...metadataTags,
      // Add user info
      { name: "UserID", value: params.userId },
      { name: "WalletAddress", value: params.walletAddress },
      { name: "Application", value: "HashMelody" },
      { name: "Timestamp", value: new Date().toISOString() },
    ];

    console.log("Uploading with tags:", tags);

    // Upload based on the type of file parameter
    let receipt;

    if (Buffer.isBuffer(params.file)) {
      // ✅ Node.js Buffer - Direct Upload
      try {
        receipt = await irys.upload(params.file, { tags });
      } catch (error) {
        console.error("Error during upload:", error);
        throw error;
      }
    } else if (params.file instanceof File) {
      // ✅ Convert File to Buffer
      const arrayBuffer = await params.file.arrayBuffer(); // Convert File to ArrayBuffer
      const fileBuffer = Buffer.from(arrayBuffer); // Convert to Buffer
      receipt = await irys.upload(fileBuffer, { tags }); // Upload buffer
    } else {
      throw new Error("Invalid file type");
    }

    console.log(`Upload successful! Transaction ID: ${receipt.id}`);

    return {
      transactionId: receipt.id,
      gatewayUrl: buildGatewayUrl(receipt.id),
    };
  }
}
