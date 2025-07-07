import { ethers } from 'ethers';
import { recoverTypedDataAddress } from 'viem';

// Initialize provider and signer with error handling
let provider;
let relayerWallet;

try {
    if (!process.env.RPC_URL) throw new Error('RPC_URL is not defined');
    if (!process.env.RELAYER_PRIVATE_KEY) throw new Error('RELAYER_PRIVATE_KEY is not defined');

    provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
} catch (setupError) {
    console.error('Initialization error:', setupError.message);
    process.exit(1);
}

// Contract ABI - must match your actual contract
const CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "signer", "type": "address" },
            { "internalType": "address[]", "name": "users", "type": "address[]" },
            { "internalType": "uint256", "name": "tier", "type": "uint256" },
            { "internalType": "uint256", "name": "nonce", "type": "uint256" },
            { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "setInviteTierWithSig",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "nonces",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// Enhanced error logger
const logError = (error, context = {}) => {
    console.error('\n--- ERROR ---');
    console.error('Message:', error.message);
    console.error('Reason:', error.reason || 'N/A');
    console.error('Code:', error.code || 'N/A');
    console.error('Context:', context);

    if (error.stack) {
        console.error('Stack:', error.stack);
    }

    if (error.data) {
        console.error('Data:', error.data);
    }

    console.error('----------------\n');
};

export default async function handler(req, res) {
    // Set consistent response headers
    res.setHeader('Content-Type', 'application/json');

    // Reject non-POST requests
    if (req.method !== 'POST') {
        logError(new Error('Invalid method'), { method: req.method });
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            allowedMethods: ['POST']
        });
    }

    // Validate content type
    if (!req.headers['content-type']?.includes('application/json')) {
        return res.status(415).json({
            success: false,
            error: 'Unsupported Media Type',
            requiredContentType: 'application/json'
        });
    }

    try {
        // Validate request body
        if (!req.body) {
            throw new Error('Missing request body');
        }

        const { signer, users, tier, nonce, signature } = req.body;

        // Validate required fields
        if (!signer || !users || tier === undefined || nonce === undefined || !signature) {
            throw new Error('Missing required fields in request body');
        }

        // Prepare EIP-712 domain
        const domain = {
            name: process.env.DOMAIN_NAME || "YourContractName",
            version: process.env.DOMAIN_VERSION || "1",
            chainId: parseInt(process.env.CHAIN_ID || '1'),
            verifyingContract: process.env.CONTRACT_ADDRESS,
        };

        // Prepare EIP-712 types
        const types = {
            SetInviteTier: [
                { name: "users", type: "address[]" },
                { name: "tier", type: "uint256" },
                { name: "nonce", type: "uint256" },
            ],
        };

        // Verify signature
        let recoveredAddress;
        try {
            recoveredAddress = await recoverTypedDataAddress({
                domain,
                types,
                primaryType: "SetInviteTier",
                message: {
                    users,
                    tier: BigInt(tier),
                    nonce: BigInt(nonce),
                },
                signature,
            });
        } catch (sigError) {
            throw new Error(`Signature verification failed: ${sigError.message}`);
        }

        // Verify signer matches recovered address
        if (recoveredAddress.toLowerCase() !== signer.toLowerCase()) {
            throw new Error(`Signer mismatch (expected ${signer}, got ${recoveredAddress})`);
        }

        // Initialize contract
        const contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            CONTRACT_ABI,
            relayerWallet
        );

        // Check current nonce
        const currentNonce = await contract.nonces(signer);
        if (BigInt(nonce) !== currentNonce) {
            throw new Error(`Nonce mismatch (expected ${currentNonce}, got ${nonce})`);
        }

        // Estimate gas first
        let gasEstimate;
        try {
            gasEstimate = await contract.estimateGas.setInviteTierWithSig(
                signer,
                users,
                tier,
                nonce,
                signature
            );
        } catch (estimationError) {
            throw new Error(`Transaction will fail: ${estimationError.reason}`);
        }

        // Send transaction
        const tx = await contract.setInviteTierWithSig(
            signer,
            users,
            tier,
            nonce,
            signature,
            {
                gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
            }
        );

        // Return successful response
        return res.status(200).json({
            success: true,
            txHash: tx.hash,
            message: 'Transaction submitted successfully',
            gasEstimate: gasEstimate.toString(),
            nonce: nonce.toString()
        });

    } catch (error) {
        logError(error, {
            endpoint: '/api/relayTransaction',
            body: req.body
        });

        // Determine appropriate status code
        const statusCode = error.code === 'INVALID_ARGUMENT' ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && {
                details: {
                    code: error.code,
                    reason: error.reason,
                    stack: error.stack
                }
            })
        });
    }
}