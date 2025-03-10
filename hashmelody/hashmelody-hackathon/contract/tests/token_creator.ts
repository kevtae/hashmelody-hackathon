import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Hashmelody } from "../target/types/hashmelody";
import { 
    PublicKey, 
    SystemProgram, 
    SYSVAR_RENT_PUBKEY,
    Keypair
} from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";


function idToBuffer(id: anchor.BN): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(id.toString()));
    return buffer;
}

describe("hashmelody", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Hashmelody as Program<Hashmelody>;
    
    // Test accounts
    let platformWallet: Keypair;
    let platformConfig: PublicKey;
    let oracleAuthority: Keypair;

    before(async () => {
        // Generate new keypairs for platform wallet and oracle authority
        platformWallet = anchor.web3.Keypair.generate();
        oracleAuthority = anchor.web3.Keypair.generate();

        // Airdrop SOL to platform wallet for transaction fees
        const airdropSig = await provider.connection.requestAirdrop(
            platformWallet.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSig);

        // Derive platform config PDA
        [platformConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("platform_config")],
            program.programId
        );
    });

    it("Initializes the platform", async () => {
        try {
            const tx = await program.methods
                .initializePlatform(
                    platformWallet.publicKey,
                    oracleAuthority.publicKey
                )
                .accounts({
                    authority: provider.wallet.publicKey,
                    platformConfig: platformConfig,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("Platform initialized. Tx:", tx);

            // Verify platform config
            const configAccount = await program.account.platformConfig.fetch(
                platformConfig
            );
            assert.ok(configAccount.platformWallet.equals(platformWallet.publicKey));
            assert.ok(configAccount.oracleAuthority.equals(oracleAuthority.publicKey));
            assert.ok(configAccount.authority.equals(provider.wallet.publicKey));
        } catch (error) {
            console.error("Failed to initialize platform:", error);
            throw error;
        }
    });

    it("Updates platform configuration", async () => {
        const newPlatformWallet = anchor.web3.Keypair.generate();
        const newOracleAuthority = anchor.web3.Keypair.generate();

        try {
            const tx = await program.methods
                .updatePlatform(
                    newPlatformWallet.publicKey,
                    newOracleAuthority.publicKey
                )
                .accounts({
                    platformConfig: platformConfig,
                    authority: provider.wallet.publicKey,
                })
                .rpc();

            console.log("Platform config updated. Tx:", tx);

            // Verify updates
            const configAccount = await program.account.platformConfig.fetch(
                platformConfig
            );
            assert.ok(configAccount.platformWallet.equals(newPlatformWallet.publicKey));
            assert.ok(configAccount.oracleAuthority.equals(newOracleAuthority.publicKey));

            // Update our reference to platform wallet for subsequent tests
            platformWallet = newPlatformWallet;
            oracleAuthority = newOracleAuthority; // Add this line
        } catch (error) {
            console.error("Failed to update platform:", error);
            throw error;
        }
    });

    it("Creates a token and mints 5% to creator and platform", async () => {
        try {
            const mintKeypair = anchor.web3.Keypair.generate();
            const id = new anchor.BN(1);

            console.log("Mint pubkey:", mintKeypair.publicKey.toBase58());
            
            // Derive mint authority PDA - matches the contract structure
            const [mintAuthority] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("mint_authority"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            // Derive metadata PDA
            const [metadata] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    mintKeypair.publicKey.toBuffer(),
                    id.toArrayLike(Buffer, 'le', 8)
                ],
                program.programId
            );

            // Derive oracle PDA
            const [oracle] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("viewership_oracle"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            // Derive token vault PDA
            const [tokenVault] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("token_vault"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            // Get associated token accounts
            const creatorTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                provider.wallet.publicKey
            );

            const platformTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                platformWallet.publicKey
            );

            const vaultTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                tokenVault,
                true
            );

            const tokenName = "NFT1";
            const musicUri = "ipfs://example/123";

            console.log("Creating token with:");
            console.log("ID:", id.toString());
            console.log("Name:", tokenName);
            console.log("URI:", musicUri);
            
            const tx = await program.methods
                .createToken(
                    id,
                    tokenName,
                    musicUri
                )
                .accounts({
                    payer: provider.wallet.publicKey,
                    platformConfig: platformConfig,
                    platformWallet: platformWallet.publicKey,
                    mintAuthority: mintAuthority,
                    mint: mintKeypair.publicKey,
                    metadata: metadata,
                    tokenAccount: creatorTokenAccount,
                    platformTokenAccount: platformTokenAccount,
                    oracle: oracle,
                    tokenVault: tokenVault,
                    vaultTokenAccount: vaultTokenAccount,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([mintKeypair])
                .rpc({ 
                    skipPreflight: true // Add this to get more detailed error information
                });

            console.log("Token created. Tx:", tx);

            // Verify metadata
            const metadataAccount = await program.account.tokenMetadata.fetch(metadata);
            assert.equal(metadataAccount.name, tokenName);
            assert.equal(metadataAccount.musicUri, musicUri);
            assert.ok(metadataAccount.mint.equals(mintKeypair.publicKey));

            // Verify token accounts
            const creatorBalance = await provider.connection.getTokenAccountBalance(creatorTokenAccount);
            const platformBalance = await provider.connection.getTokenAccountBalance(platformTokenAccount);

            // Calculate expected amount (5% of 1 million tokens with 6 decimals)
            const expectedAmount = 50_000;

            console.log("Creator balance:", creatorBalance.value.uiAmount);
            console.log("Platform balance:", platformBalance.value.uiAmount);

            assert.equal(creatorBalance.value.uiAmount, expectedAmount);
            assert.equal(platformBalance.value.uiAmount, expectedAmount);

        } catch (error) {
            console.error("Failed to create token. Full error:", error);
            throw error;
        }
    });
    
    it("Updates oracle view count as authorized user", async () => {
        try {
            const mintKeypair = anchor.web3.Keypair.generate()
            const id = new anchor.BN(2); // Add unique id

            
            // Derive PDAs with mint as additional seed for mint authority
            const [mintAuthority] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("mint_authority"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            const [metadata] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    mintKeypair.publicKey.toBuffer(),
                    id.toArrayLike(Buffer, 'le', 8)
                ],
                program.programId
            );

            const [oracle] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("viewership_oracle"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            // Get associated token accounts
            const creatorTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                provider.wallet.publicKey
            );

            const platformTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                platformWallet.publicKey
            );

            // Create token first
            await program.methods
                .createToken(
                    id,
                    "Test Token 1",
                    "ipfs://test1"
                )
                .accounts({
                    payer: provider.wallet.publicKey,
                    platformConfig: platformConfig,
                    platformWallet: platformWallet.publicKey,
                    mintAuthority: mintAuthority,
                    mint: mintKeypair.publicKey,
                    metadata: metadata,
                    tokenAccount: creatorTokenAccount,
                    platformTokenAccount: platformTokenAccount,
                    oracle: oracle,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([mintKeypair])
                .rpc();

            // Test oracle update
            const newViewCount = new anchor.BN(1000);
            
            const tx = await program.methods
                .updateOracle(newViewCount)
                .accounts({
                    oracle: oracle,
                    mint: mintKeypair.publicKey,
                    platformConfig: platformConfig,
                    authority: oracleAuthority.publicKey,
                })
                .signers([oracleAuthority])
                .rpc();

            console.log("Oracle updated. Tx:", tx);

            // Verify oracle update
            const oracleAccount = await program.account.viewershipOracle.fetch(oracle);
            assert.ok(oracleAccount.mint.equals(mintKeypair.publicKey));
            assert.equal(oracleAccount.viewCount.toString(), newViewCount.toString());

            // Update again with higher view count
            const higherViewCount = new anchor.BN(2000);
            
            await program.methods
                .updateOracle(higherViewCount)
                .accounts({
                    oracle: oracle,
                    mint: mintKeypair.publicKey,
                    platformConfig: platformConfig,
                    authority: oracleAuthority.publicKey,
                })
                .signers([oracleAuthority])
                .rpc();

            // Verify second update
            const updatedOracle = await program.account.viewershipOracle.fetch(oracle);
            assert.equal(updatedOracle.viewCount.toString(), higherViewCount.toString());

        } catch (error) {
            console.error("Failed to update oracle:", error);
            throw error;
        }
    });

    it("Fails to update oracle with unauthorized user", async () => {
        try {
            const mintKeypair = anchor.web3.Keypair.generate();
            const unauthorizedUser = anchor.web3.Keypair.generate();
            const id = new anchor.BN(3); // Add unique id

            
            // Derive PDAs with mint as additional seed for mint authority
            const [mintAuthority] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("mint_authority"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            const [metadata] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    mintKeypair.publicKey.toBuffer(),
                    id.toArrayLike(Buffer, 'le', 8)
                ],
                program.programId
            );

            const [oracle] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("viewership_oracle"),
                    mintKeypair.publicKey.toBuffer()
                ],
                program.programId
            );

            const creatorTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                provider.wallet.publicKey
            );

            const platformTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                platformWallet.publicKey
            );

            // Create token
            await program.methods
                .createToken(
                    id,
                    "Test Token 2",
                    "ipfs://test2"
                )
                .accounts({
                    payer: provider.wallet.publicKey,
                    platformConfig: platformConfig,
                    platformWallet: platformWallet.publicKey,
                    mintAuthority: mintAuthority,
                    mint: mintKeypair.publicKey,
                    metadata: metadata,
                    tokenAccount: creatorTokenAccount,
                    platformTokenAccount: platformTokenAccount,
                    oracle: oracle,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([mintKeypair])
                .rpc();

            // Airdrop some SOL to unauthorized user for transaction
            const airdropSig = await provider.connection.requestAirdrop(
                unauthorizedUser.publicKey,
                1 * anchor.web3.LAMPORTS_PER_SOL
            );
            await provider.connection.confirmTransaction(airdropSig);

            // Try to update oracle with unauthorized user - should fail
            try {
                await program.methods
                    .updateOracle(new anchor.BN(1000))
                    .accounts({
                        oracle: oracle,
                        mint: mintKeypair.publicKey,
                        platformConfig: platformConfig,
                        authority: unauthorizedUser.publicKey,
                    })
                    .signers([unauthorizedUser])
                    .rpc();
                
                assert.fail("Expected error when updating oracle with unauthorized user");
            } catch (error) {
                assert.include(error.message, "constraint was violated");
            }
        } catch (error) {
            console.error("Test setup failed:", error);
            throw error;
        }
    });


    it("Verifies bonding curve pricing and token supply", async () => {
        try {
            const mintKeypair = anchor.web3.Keypair.generate();
            const buyer = anchor.web3.Keypair.generate();
            const id = new anchor.BN(4); // Add unique id

    
            // Request airdrop
            const signature = await provider.connection.requestAirdrop(
                buyer.publicKey,
                10 * anchor.web3.LAMPORTS_PER_SOL
            );
        
            // Create confirmation strategy
            const latestBlockhash = await provider.connection.getLatestBlockhash();
            const confirmation = await provider.connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            });
        
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
            }
        
            // Verify the balance
            const balance = await provider.connection.getBalance(buyer.publicKey);
            console.log(`Buyer balance: ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
        
            if (balance < anchor.web3.LAMPORTS_PER_SOL) {
                throw new Error("Insufficient funds after airdrop");
            }
        
            // Derive PDAs
            const [mintAuthority] = PublicKey.findProgramAddressSync(
                [Buffer.from("mint_authority"), mintKeypair.publicKey.toBuffer()],
                program.programId
            );

            const [metadata] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    mintKeypair.publicKey.toBuffer(),
                    id.toArrayLike(Buffer, 'le', 8)
                ],
                program.programId
            );

            const [oracle] = PublicKey.findProgramAddressSync(
                [Buffer.from("viewership_oracle"), mintKeypair.publicKey.toBuffer()],
                program.programId
            );

            const [tokenVault] = PublicKey.findProgramAddressSync(
                [Buffer.from("token_vault"), mintKeypair.publicKey.toBuffer()],
                program.programId
            );

            // Setup token accounts
            const creatorTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                provider.wallet.publicKey
            );

            const platformTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                platformWallet.publicKey
            );

            const buyerTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                buyer.publicKey
            );

            const vaultTokenAccount = await getAssociatedTokenAddress(
                mintKeypair.publicKey,
                tokenVault,
                true
            );

            // Create token
            await program.methods
                .createToken(
                    id,
                    "Bonding Test",
                    "ipfs://test-bonding"
                )
                .accounts({
                    payer: provider.wallet.publicKey,
                    platformConfig: platformConfig,
                    platformWallet: platformWallet.publicKey,
                    mintAuthority: mintAuthority,
                    mint: mintKeypair.publicKey,
                    metadata: metadata,
                    tokenAccount: creatorTokenAccount,
                    platformTokenAccount: platformTokenAccount,
                    oracle: oracle,
                    tokenVault: tokenVault,
                    vaultTokenAccount: vaultTokenAccount,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .signers([mintKeypair])
                .rpc();

            // Set initial views
            const viewCount = new anchor.BN(1000);
            await program.methods
                .updateOracle(viewCount)
                .accounts({
                    oracle: oracle,
                    mint: mintKeypair.publicKey,
                    platformConfig: platformConfig,
                    authority: oracleAuthority.publicKey,
                })
                .signers([oracleAuthority])
                .rpc();

            // Get initial supply
            const initialMintInfo = await provider.connection.getTokenSupply(mintKeypair.publicKey);
            console.log("Initial token supply:", initialMintInfo.value.uiAmount);

            // Make multiple purchases to test bonding curve
            const purchaseAmounts = [
                new anchor.BN(1_000_000),
                new anchor.BN(2_000_000),
                new anchor.BN(3_000_000)
            ]; // Different purchase amounts
            
            for (let amount of purchaseAmounts) {
                const preSupply = await provider.connection.getTokenSupply(mintKeypair.publicKey);
                const preBuyerBalance = await provider.connection.getTokenAccountBalance(buyerTokenAccount)
                    .catch(() => ({ value: { amount: "0" } })); // Handle case where account doesn't exist yet

                console.log("\nPurchasing", amount.toNumber() / 1_000_000, "tokens");
                console.log("Current supply:", preSupply.value.uiAmount);

                await program.methods
                    .purchaseToken(new anchor.BN(amount))
                    .accounts({
                        buyer: buyer.publicKey,
                        platformConfig: platformConfig,
                        platformWallet: platformWallet.publicKey,
                        mintAuthority: mintAuthority,
                        mint: mintKeypair.publicKey,
                        buyerTokenAccount: buyerTokenAccount,
                        tokenVault: tokenVault,
                        vaultTokenAccount: vaultTokenAccount,
                        oracle: oracle,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        rent: SYSVAR_RENT_PUBKEY,
                    })
                    .signers([buyer])
                    .rpc();

                // Verify token receipt and supply changes
                const postSupply = await provider.connection.getTokenSupply(mintKeypair.publicKey);
                const postBuyerBalance = await provider.connection.getTokenAccountBalance(buyerTokenAccount);

                // Check supply increase matches purchase amount
                const supplyIncrease = postSupply.value.uiAmount - preSupply.value.uiAmount;
                assert.approximately(supplyIncrease, amount.toNumber() / 1_000_000, 0.000001, "Supply increase should match purchase amount");

                // Check buyer balance increase
                const balanceIncrease = 
                    (Number(postBuyerBalance.value.amount) - Number(preBuyerBalance.value.amount)) / 1_000_000;
                assert.approximately(balanceIncrease, amount.toNumber() / 1_000_000, 0.000001, "Buyer balance increase should match purchase");

                // Verify price increase with supply (bonding curve)
                const vaultAccount = await program.account.tokenVault.fetch(tokenVault);
                console.log("Total collected in vault:", vaultAccount.totalCollected.toString(), "lamports");
                
                // If not the first purchase, verify price increased
                if (!amount.eq(purchaseAmounts[0])) {
                    assert.isTrue(
                        vaultAccount.totalCollected.toNumber() > 0,
                        "Price should increase with supply"
                    );
                }
            }

            // Final supply verification
            const finalSupply = await provider.connection.getTokenSupply(mintKeypair.publicKey);
            const totalPurchased = purchaseAmounts.reduce((a, b) => a.add(b), new anchor.BN(0)).toNumber() / 1_000_000;
            
            console.log("\nFinal Results:");
            console.log("Total tokens purchased:", totalPurchased);
            console.log("Final supply:", finalSupply.value.uiAmount);
            console.log("Initial supply:", initialMintInfo.value.uiAmount);
            
            // Verify total supply includes initial mint to creator/platform
            assert.approximately(
                finalSupply.value.uiAmount - initialMintInfo.value.uiAmount,
                totalPurchased,
                0.000001,
                "Final supply should reflect all purchases"
            );

        } catch (error) {
            console.error("Test failed:", error);
            throw error;
        }
    });

});