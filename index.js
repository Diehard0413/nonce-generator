const { ethers } = require('ethers'); 
const dotenv = require('dotenv');
dotenv.config();

// Configuration
const targetPrefix = '1969';
const providerUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'; // Change to your provider URL
const privateKey = process.env.PK_key; // WARNING: Be careful with private keys!

// Connect to Ethereum network
const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

async function main() {
    let currentNonce = await provider.getTransactionCount(wallet.address);
    console.log(`Current nonce is: ${currentNonce}`);

    // Function to send a zero-value transaction to increment the nonce
    async function sendZeroValueTransaction(currentNonce) {
        const tx = {
            to: wallet.address, // Send to self to increment nonce without transferring ETH
            value: ethers.parseEther("0.0")
        };
        const sendResult = await wallet.sendTransaction(tx);
        await sendResult.wait();
        console.log(`Sent zero-value tx to increment nonce, tx hash: ${sendResult.hash}, nonce: ${currentNonce}`);
    }

    // Calculate how many zero-value transactions are needed
    let desiredNonce = currentNonce;
    while (true) {
        const potentialAddress = ethers.getCreateAddress({ from: wallet.address, nonce: desiredNonce });
        if (potentialAddress.slice(2).startsWith(targetPrefix)) {
            console.log(`Matching nonce found: ${desiredNonce}, potential address: ${potentialAddress}`);
            break;
        }
        desiredNonce++;
    }

    // Increment nonce by sending zero-value transactions
    while (currentNonce < desiredNonce) {
        await sendZeroValueTransaction(currentNonce);
        currentNonce++;
    }

    console.log(`Nonce incremented to target. Ready to deploy the contract at nonce: ${desiredNonce}`);
}

main().catch(console.error);