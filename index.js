const ethers = require('ethers');
require('dotenv').config();
// Configuration
const targetPrefix = '1969';
const providerUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'; // Change to your provider URL
const privateKey = process.env.PRIVATE_KEY; // WARNING: Be careful with private keys!

// Connect to Ethereum network
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

async function main() {
    let currentNonce = await wallet.getTransactionCount();

    // Function to send a zero-value transaction to increment the nonce
    async function sendZeroValueTransaction() {
        const tx = {
            to: wallet.address, // Send to self to increment nonce without transferring ETH
            value: ethers.utils.parseEther("0.0")
        };
        const sendResult = await wallet.sendTransaction(tx);
        await sendResult.wait();
        console.log(`Sent zero-value tx to increment nonce, tx hash: ${sendResult.hash}`);
    }

    // Calculate how many zero-value transactions are needed
    let desiredNonce = currentNonce;
    while (true) {
        const potentialAddress = ethers.utils.getContractAddress({ from: wallet.address, nonce: desiredNonce });
        if (potentialAddress.slice(2).startsWith(targetPrefix)) {
            console.log(`Matching nonce found: ${desiredNonce}, potential address: ${potentialAddress}`);
            break;
        }
        desiredNonce++;
    }

    // Increment nonce by sending zero-value transactions
    while (currentNonce < desiredNonce) {
        await sendZeroValueTransaction();
        currentNonce++;
    }

    console.log(`Nonce incremented to target. Ready to deploy the contract at nonce: ${desiredNonce}`);
}

main().catch(console.error);