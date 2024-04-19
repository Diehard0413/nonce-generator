const { ethers } = require('ethers'); 
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const targetPrefix = '1969';
const maxNonces = 10; // Maximum number of nonces to check per wallet
const providerUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'; // Change to your provider URL
const privateKey = process.env.PK_key; // WARNING: Be careful with private keys!

// Connect to Ethereum network
const provider = new ethers.JsonRpcProvider(providerUrl);
// const wallet = new ethers.Wallet(privateKey, provider);

async function main() {
    let found = false;
    let desiredNonce = 0;
    let wallet;
    while (!found) {
        // Generate a random wallet
        wallet = ethers.Wallet.createRandom().connect(provider);
        const address = wallet.address;
        console.log(`Wallet address: ${address}`);

        // Check potential contract addresses for the first 10 nonces
        for (let nonce = 0; nonce < maxNonces; nonce++) {
            const potentialAddress = ethers.getCreateAddress({
                from: address,
                nonce: nonce
            });

            // Check if the address starts with the desired prefix
            if (potentialAddress.slice(2).startsWith(targetPrefix)) {
                console.log(`Found a wallet! Address: ${address}, Private Key: ${wallet.privateKey}`);
                console.log(`Matching contract address: ${potentialAddress} at nonce: ${nonce}`);
                found = true;
                desiredNonce = nonce;
                break;
            }
        }
    }

    let currentNonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce is: ${currentNonce}`);

    // Increment nonce by sending zero-value transactions
    while (currentNonce < desiredNonce) {
        await sendZeroValueTransaction(wallet, currentNonce);
        currentNonce++;
    }

    console.log(`Nonce incremented to target. Ready to deploy the contract at nonce: ${desiredNonce}`);
}

// Function to send a zero-value transaction to increment the nonce
async function sendZeroValueTransaction(wallet, currentNonce) {
    const tx = {
        to: wallet.address, // Send to self to increment nonce without transferring ETH
        value: ethers.parseEther("0.0")
    };
    const sendResult = await wallet.sendTransaction(tx);
    await sendResult.wait();
    console.log(`Sent zero-value tx to increment nonce, tx hash: ${sendResult.hash}, nonce: ${currentNonce}`);
}

main().catch(console.error);