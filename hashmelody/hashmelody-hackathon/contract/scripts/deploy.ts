import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import { Hashmelody } from '../target/types/hashmelody';

// Import your IDL
const idl = require('../target/idl/hashmelody.json');

// Get the program ID from your deployed contract
const programId = new PublicKey('8JUg9X2kSHvVgc2stoiAVwDoRtKZGEp2p42Z7Ficby6a');

async function main() {
  // Read the deploy keypair
  // const deployKeypair = Keypair.fromSecretKey(
  //   new Uint8Array(JSON.parse(fs.readFileSync('new-program-keypair.json', 'utf-8')))
  // );
  const deployKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync('devnet-3.json', 'utf-8')))
  );



  const platformKeys = JSON.parse(fs.readFileSync('platform-keys.json', 'utf-8'));


  // Set up connection to local validator
  // const connection = new anchor.web3.Connection('http://127.0.0.1:8899', 'confirmed');

  const connection = new anchor.web3.Connection('https://api.devnet.solana.com', 'confirmed');

  
  // Create wallet instance
  const wallet = new anchor.Wallet(deployKeypair);
  
  // Create and set the provider
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );
  anchor.setProvider(provider);

  // Create program instance - removed toString()
  const program = new Program(idl as Hashmelody, provider);
  
  try {
    // Create platform wallet and oracle authority
    const platformWallet = Keypair.fromSecretKey(
      new Uint8Array(platformKeys.platformWallet.secretKey)
    );
    
    const oracleAuthority = Keypair.fromSecretKey(
      new Uint8Array(platformKeys.oracleAuthority.secretKey)
    );

    // Get platform config PDA
    const [platformConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('platform_config')],
      programId
    );

    console.log('Initializing platform...');
    console.log('Platform Wallet:', platformWallet.publicKey.toString());
    console.log('Oracle Authority:', oracleAuthority.publicKey.toString());
    console.log('Platform Config PDA:', platformConfigPda.toString());

    // Initialize the platform using accountsStrict
    const tx = await program.methods
      .initializePlatform(
        platformWallet.publicKey,
        oracleAuthority.publicKey
      )
      .accountsStrict({
        authority: provider.wallet.publicKey,
        platformConfig: platformConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([deployKeypair])
      .rpc();

    console.log('Platform initialized!');
    console.log('Transaction signature:', tx);


    return {
      platformWallet: platformWallet.publicKey.toString(),
      oracleAuthority: oracleAuthority.publicKey.toString(),
      signature: tx
    };

  } catch (error) {
    console.error('Error initializing platform:', error);
    throw error;
  }
}

// Run main
main()
  .then((result) => {
    console.log('Deployment successful!');
    console.log(result);
  })
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });