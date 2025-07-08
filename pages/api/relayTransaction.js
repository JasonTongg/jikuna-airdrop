import { ethers, JsonRpcProvider } from "ethers";
import { recoverTypedDataAddress } from "viem";

let provider;
let relayerWallet;

try {
	if (!process.env.RPC_URL || !process.env.RELAYER_PRIVATE_KEY) {
		throw new Error("Missing RPC_URL or RELAYER_PRIVATE_KEY in .env");
	}

	provider = new JsonRpcProvider(process.env.RPC_URL);
	relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
	console.log(
		process.env.RPC_URL,
		process.env.RELAYER_PRIVATE_KEY,
		process.env.CONTRACT_ADDRESS,
		process.env.CHAIN_ID,
		process.env.DOMAIN_NAME,
		process.env.DOMAIN_VERSION
	);
} catch (initError) {
	console.error("Initialization Error:", initError.message);
	process.exit(1);
}

const CONTRACT_ABI = [
	{
		inputs: [
			{ internalType: "address", name: "signer", type: "address" },
			{ internalType: "address[]", name: "users", type: "address[]" },
			{ internalType: "uint256", name: "tier", type: "uint256" },
			{ internalType: "uint256", name: "nonce", type: "uint256" },
			{ internalType: "bytes", name: "signature", type: "bytes" },
		],
		name: "setInviteTierWithSig",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ internalType: "address", name: "", type: "address" }],
		name: "nonces",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
];

export default async function handler(req, res) {
	res.setHeader("Content-Type", "application/json");

	if (req.method !== "POST") {
		return res
			.status(405)
			.json({ success: false, error: "Method not allowed" });
	}

	try {
		const { signer, users, tier, nonce, signature } = req.body;

		// Validate env
		const contractAddress = process.env.CONTRACT_ADDRESS;
		const domainName = process.env.DOMAIN_NAME || "YourContractName";
		const domainVersion = process.env.DOMAIN_VERSION || "1";
		const chainId = parseInt(process.env.CHAIN_ID || "11155111");

		if (!contractAddress) throw new Error("CONTRACT_ADDRESS is not defined");

		console.log("🔧 ENV CHECK:", {
			CONTRACT_ADDRESS: contractAddress,
			DOMAIN_NAME: domainName,
			CHAIN_ID: chainId,
		});

		// Validate request body
		if (
			!signer ||
			!users ||
			tier === undefined ||
			nonce === undefined ||
			!signature
		) {
			return res
				.status(400)
				.json({ success: false, error: "Missing required fields" });
		}

		const domain = {
			name: domainName,
			version: domainVersion,
			chainId: chainId,
			verifyingContract: contractAddress,
		};

		const types = {
			SetInviteTier: [
				{ name: "users", type: "address[]" },
				{ name: "tier", type: "uint256" },
				{ name: "nonce", type: "uint256" },
			],
		};

		const message = {
			users,
			tier: BigInt(tier),
			nonce: BigInt(nonce),
		};

		// Recover signer
		const recoveredAddress = await recoverTypedDataAddress({
			domain,
			types,
			primaryType: "SetInviteTier",
			message,
			signature,
		});

		console.log("🔐 Recovered address:", recoveredAddress);

		if (recoveredAddress.toLowerCase() !== signer.toLowerCase()) {
			return res.status(401).json({
				success: false,
				error: `Signature mismatch: expected ${signer}, got ${recoveredAddress}`,
			});
		}

		const contract = new ethers.Contract(
			contractAddress,
			CONTRACT_ABI,
			relayerWallet
		);

		const onChainNonce = await contract.nonces(signer);
		console.log("🔢 On-chain nonce:", onChainNonce.toString());

		if (onChainNonce.toString() !== nonce.toString()) {
			return res.status(400).json({
				success: false,
				error: `Nonce mismatch. On-chain: ${onChainNonce}, Provided: ${nonce}`,
			});
		}

		const tx = await contract.setInviteTierWithSig(
			signer,
			users,
			tier,
			nonce,
			signature,
			{ gasLimit: 10000000 }
		);

		console.log("✅ Transaction submitted:", tx.hash);

		return res.status(200).json({
			success: true,
			txHash: tx.hash,
			message: "Transaction submitted successfully",
		});
	} catch (err) {
		console.error("❌ Relay error:", err);

		return res.status(500).json({
			success: false,
			error: err.message,
		});
	}
}
