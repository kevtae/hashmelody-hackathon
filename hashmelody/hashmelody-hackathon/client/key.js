import { 
    Connection, 
    PublicKey, 
    Keypair, 
    SystemProgram, 
    SYSVAR_RENT_PUBKEY,
    Transaction
  } from "@solana/web3.js";
  import bs58 from 'bs58';  // Add this import


  
  
const keyData = [99, 67, 246, 105, 71, 123, 109, 144, 170, 81, 237, 63, 44, 170, 43, 40, 82, 2, 156, 15, 7, 234, 75, 22, 121, 232, 65, 33, 187, 252, 109, 108, 99, 189, 136, 203, 255, 104, 207, 248, 184, 133, 122, 226, 2, 35, 30, 5, 240, 240, 187, 183, 229, 128, 106, 191, 217, 57, 5, 15, 24, 78, 229, 146];

const keypair = Keypair.fromSecretKey(Uint8Array.from(keyData));
console.log('Private key in base58:', bs58.encode(keypair.secretKey));
console.log('Public key:', keypair.publicKey.toString());