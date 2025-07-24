import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
	useAccount,
	useContractRead,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { getAddress } from "viem";
import { ConnectButton, WalletButton } from "@rainbow-me/rainbowkit";

// ABIs for the contracts
const stakingContractABI = [
	{
		name: "getUserStaked",
		type: "function",
		stateMutability: "view",
		inputs: [{ type: "address", name: "user" }],
		outputs: [{ type: "uint256[]" }],
	},
	{
		name: "getPendingPoints",
		type: "function",
		stateMutability: "view",
		inputs: [],
		outputs: [{ type: "uint256" }],
	},
	{
		name: "stake",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [{ type: "uint256", name: "tokenId" }],
		outputs: [],
	},
	{
		name: "unstake",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [{ type: "uint256", name: "tokenId" }],
		outputs: [],
	},
];
const nftContractABI = [
	{
		name: "isApprovedForAll",
		type: "function",
		stateMutability: "view",
		inputs: [
			{ type: "address", name: "owner" },
			{ type: "address", name: "operator" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		name: "setApprovalForAll",
		type: "function",
		stateMutability: "nonpayable",
		inputs: [
			{ type: "address", name: "operator" },
			{ type: "bool", name: "approved" },
		],
		outputs: [],
	},
];

// Contract Addresses
const STAKING_CONTRACT_ADDRESS = "0x537044a96910cBB7E71D770857Be19c74C013dE0";
const NFT_CONTRACT_ADDRESS = "0x874df014adc21d0f76c706b2f58b069487a6d71d";

export default function Hero() {
	const { address, isConnected } = useAccount();

	// --- State Management ---
	const [allNfts, setAllNfts] = useState([]);
	const [stakedIdsSet, setStakedIdsSet] = useState(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [pendingTokenId, setPendingTokenId] = useState(null);
	const [refetchTrigger, setRefetchTrigger] = useState(0);

	// --- wagmi Hooks ---
	const { data: approveHash, writeContract: approve } = useWriteContract();
	const { data: stakeHash, writeContract: stake } = useWriteContract();
	const { data: unstakeHash, writeContract: unstake } = useWriteContract();

	// --- FIXED: Read PENDING POINTS from contract ---
	const { data: pendingPoints, isLoading: isLoadingPoints } = useContractRead({
		address: STAKING_CONTRACT_ADDRESS,
		abi: stakingContractABI,
		functionName: "getPendingPoints",
		args: [],
		account: address, // This tells the hook to make the call from the user's address
		enabled: isConnected,
		refetchInterval: 5000,
		query: { queryKey: ["getPendingPoints", address, refetchTrigger] },
	});

	const { data: stakedIds, isFetching: isFetchingStakedIds } = useContractRead({
		address: STAKING_CONTRACT_ADDRESS,
		abi: stakingContractABI,
		functionName: "getUserStaked",
		args: [address],
		enabled: isConnected,
		query: { queryKey: ["getUserStaked", address, refetchTrigger] },
	});

	const { data: isApproved, refetch: refetchApprovalStatus } = useContractRead({
		address: NFT_CONTRACT_ADDRESS,
		abi: nftContractABI,
		functionName: "isApprovedForAll",
		args: [address, STAKING_CONTRACT_ADDRESS],
		enabled: isConnected,
	});

	// --- Data Fetching and Combining ---
	const fetchAndCombineData = useCallback(async () => {
		if (!isConnected || !address) return;
		setIsLoading(true);

		const unstakedApiUrl = `https://api-mainnet.magiceden.dev/v3/rtp/monad-testnet/users/${address}/tokens/v7?contract=${NFT_CONTRACT_ADDRESS}`;
		const unstakedPromise = fetch(unstakedApiUrl).then((res) => res.json());

		const [unstakedData] = await Promise.all([
			unstakedPromise,
			stakedIds !== undefined,
		]);

		const unstakedList = unstakedData.tokens || [];
		const localStakedIds = new Set((stakedIds || []).map((id) => Number(id)));
		setStakedIdsSet(localStakedIds);

		const stakedList = Array.from(localStakedIds).map((id) => {
			const tokenId = id.toString();
			return {
				token: {
					tokenId,
					name: `Little Origins #${tokenId}`,
					imageSmall: `https://bafybeidh6trxtd2pb7isozlrf42vwhpokbg7f3uadkrgs4iqlrl4oxmh2a.ipfs.w3s.link/${tokenId}.png`,
				},
			};
		});

		const combined = [...unstakedList, ...stakedList];
		combined.sort(
			(a, b) => parseInt(a.token.tokenId) - parseInt(b.token.tokenId)
		);

		setAllNfts(combined);
		setIsLoading(false);
	}, [isConnected, address, stakedIds]);

	useEffect(() => {
		fetchAndCombineData();
	}, [fetchAndCombineData]);

	useEffect(() => {
		console.log("Pending Points:", pendingPoints?.toString());
	}, [pendingPoints]);

	// --- Transaction Handlers ---
	const { isLoading: isApproving } = useWaitForTransactionReceipt({
		hash: approveHash,
		onSuccess: () => refetchApprovalStatus(),
	});

	const useStakingTransaction = (hash) =>
		useWaitForTransactionReceipt({
			hash,
			onSuccess: () => {
				console.log("Masuk");
				setPendingTokenId(null);
				fetchAndCombineData();
				console.log("Selesai");
			},
		});
	const { isLoading: isStaking } = useStakingTransaction(stakeHash);
	const { isLoading: isUnstaking } = useStakingTransaction(unstakeHash);

	const handleApprove = () =>
		approve({
			address: NFT_CONTRACT_ADDRESS,
			abi: nftContractABI,
			functionName: "setApprovalForAll",
			args: [STAKING_CONTRACT_ADDRESS, true],
		});
	const handleStake = (tokenId) => {
		setPendingTokenId(tokenId);
		stake({
			address: STAKING_CONTRACT_ADDRESS,
			abi: stakingContractABI,
			functionName: "stake",
			args: [parseInt(tokenId)],
		});
	};
	const handleUnstake = (tokenId) => {
		setPendingTokenId(tokenId);
		unstake({
			address: STAKING_CONTRACT_ADDRESS,
			abi: stakingContractABI,
			functionName: "unstake",
			args: [parseInt(tokenId)],
		});
	};

	return (
		<div className='bg-green-400 w-full min-h-screen flex items-center justify-center text-center text-white p-4'>
			<motion.div
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='w-full max-w-screen-xl mx-auto flex flex-col items-center justify-center gap-5'
			>
				{!isConnected ? (
					<div className='flex flex-wrap justify-center gap-4'>
						<WalletButton wallet='metamask' />
						<WalletButton wallet='coinbase' />
					</div>
				) : (
					<div className='flex flex-col gap-6 items-center bg-black bg-opacity-20 p-6 rounded-lg w-full'>
						<div className='text-lg'>
							<p>
								<strong>Connected as:</strong> {getAddress(address)}
							</p>
							<p className='mt-1'>
								<strong>Pending Points:</strong>{" "}
								<span className='font-bold text-yellow-400'>
									{isLoadingPoints ? "..." : pendingPoints?.toString() || "0"}
								</span>
							</p>
							{!isApproved && (
								<button
									onClick={handleApprove}
									disabled={isApproving}
									className='btn-primary mt-4'
								>
									{isApproving ? "Approving..." : "Approve Staking"}
								</button>
							)}
						</div>

						<div className='w-full'>
							<h3 className='text-2xl font-bold mb-4'>Your NFT Collection</h3>
							{isLoading || isFetchingStakedIds ? (
								<p>Loading your collection...</p>
							) : allNfts.length > 0 ? (
								<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-4 bg-gray-900/30 rounded-md'>
									{allNfts.map(({ token }) => {
										const isStaked = stakedIdsSet.has(Number(token.tokenId));
										const isPending = pendingTokenId === token.tokenId;

										return (
											<div
												key={token.tokenId}
												className='rounded-lg overflow-hidden flex flex-col bg-gray-800'
											>
												<img
													src={
														token.imageSmall ||
														`https://bafybeidh6trxtd2pb7isozlrf42vwhpokbg7f3uadkrgs4iqlrl4oxmh2a.ipfs.w3s.link/${token.tokenId}.png`
													}
													alt={token.name}
													className='w-full h-auto object-cover aspect-square'
												/>
												<div className='p-2 flex-grow flex flex-col justify-between'>
													<p className='text-sm font-bold truncate'>
														{token.name || `Little Origins #${token.tokenId}`}
													</p>
													{isApproved &&
														(isStaked ? (
															<button
																onClick={() => handleUnstake(token.tokenId)}
																disabled={isUnstaking && isPending}
																className='btn-secondary mt-2 w-full'
															>
																{isUnstaking && isPending
																	? "Unstaking..."
																	: "Unstake"}
															</button>
														) : (
															<button
																onClick={() => handleStake(token.tokenId)}
																disabled={isStaking && isPending}
																className='btn-primary mt-2 w-full'
															>
																{isStaking && isPending
																	? "Staking..."
																	: "Stake"}
															</button>
														))}
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<p>You have no NFTs from this collection.</p>
							)}
						</div>
					</div>
				)}
				<div className='mt-4'>
					<ConnectButton />
				</div>
			</motion.div>
		</div>
	);
}
