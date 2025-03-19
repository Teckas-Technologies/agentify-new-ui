import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, Account, AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const SOLANA_RPC_URL = "https://sonic.helius-rpc.com"; // Your RPC URL

/**
 * Fetch the owner of the associated token account (ATA).
 */
export const getTokenOwner = async (mintAddress: string, walletAddress: string) => {
    try {
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");
        const mintPublicKey = new PublicKey(mintAddress);
        const walletPublicKey = new PublicKey(walletAddress);

        // Derive the associated token account (ATA)
        const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey);

        // Fetch the token account details
        const accountInfo = await getAccount(connection, tokenAccount);

        console.log("Token Owner Address:", accountInfo.owner.toBase58());
        return accountInfo.owner.toBase58();
    } catch (error) {
        console.error("Error fetching token owner:", error);
        return null;
    }
};


// Function to get owner of a token account
// import { Connection, PublicKey } from "@solana/web3.js";
// import { getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";

/**
 * Fetch the owner of a given SPL token account.
 */
export async function getTokenAccountOwner(
    connection: Connection,
    tokenAccountAddress: string
) {
    try {
        const tokenAccountPubKey = new PublicKey(tokenAccountAddress);

        // Fetch token account info
        const accountInfo = await connection.getAccountInfo(tokenAccountPubKey);

        if (!accountInfo) {
            console.log("Token account not found.");
            return null;
        }

        console.log("ACC Info:", accountInfo)

        const accountData = AccountLayout.decode(accountInfo.data);
        
        // Extract owner's public key
        const ownerPubKey = new PublicKey(accountData.owner);

        console.log("Token Account Owner:", ownerPubKey.toBase58());
        return ownerPubKey.toBase58();
        

    } catch (error) {
        console.error("Error fetching token account owner:", error);
        return null;
    }
}

// Example Usage
// (async () => {
//     const connection = new Connection("https://api.mainnet-beta.solana.com");
//     const tokenAccount = "TOKEN_ACCOUNT_ADDRESS_HERE"; // Replace with actual token account address
//     const ownerAddress = await getTokenAccountOwner(connection, tokenAccount);
//     console.log("Owner Address:", ownerAddress);
// })();