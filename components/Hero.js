import React, { useState, useEffect, useCallback, use } from "react";
import { motion } from "framer-motion";
import {
	useAccount,
	usePublicClient, // 👈 NEW: Import the public client hook
	useContractRead,
	useWriteContract,
} from "wagmi";
import { useDispatch } from "react-redux";
import { setLittleOriginPoint } from "@/store/data";
import { ToastContainer, toast } from "react-toastify";
import { PiCoin } from "react-icons/pi";

// ABIs and Contract Addresses remain the same...
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
const STAKING_CONTRACT_ADDRESS = "0x537044a96910cBB7E71D770857Be19c74C013dE0";
const NFT_CONTRACT_ADDRESS = "0x874df014adc21d0f76c706b2f58b069487a6d71d";

export default function Hero() {
	const dispatch = useDispatch();
	const { address, isConnected } = useAccount();
	const publicClient = usePublicClient(); // 👈 NEW: Get the public client instance

	// --- State Management ---
	const [allNfts, setAllNfts] = useState([]);
	const [stakedIdsSet, setStakedIdsSet] = useState(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [pendingTokenId, setPendingTokenId] = useState(null);
	const [refetchTrigger, setRefetchTrigger] = useState(0);

	// --- wagmi Hooks ---
	const { writeContractAsync: approve } = useWriteContract();
	const { writeContractAsync: stake } = useWriteContract();
	const { writeContractAsync: unstake } = useWriteContract();

	// All useContractRead hooks remain the same...
	const { data: pendingPoints, isLoading: isLoadingPoints } = useContractRead({
		address: STAKING_CONTRACT_ADDRESS,
		abi: stakingContractABI,
		functionName: "getPendingPoints",
		args: [],
		account: address,
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
	const { data: isApproved } = useContractRead({
		address: NFT_CONTRACT_ADDRESS,
		abi: nftContractABI,
		functionName: "isApprovedForAll",
		args: [address, STAKING_CONTRACT_ADDRESS],
		enabled: isConnected,
	});

	// The data fetching logic remains the same...
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
		const combined = [...stakedList, ...unstakedList];
		const nftMap = new Map(combined.map((item) => [item.token.tokenId, item]));
		const uniqueNfts = Array.from(nftMap.values());

		uniqueNfts.sort(
			(a, b) => parseInt(a.token.tokenId) - parseInt(b.token.tokenId)
		);

		setAllNfts(uniqueNfts);
		setIsLoading(false);
	}, [isConnected, address, stakedIds]);

	useEffect(() => {
		fetchAndCombineData();
	}, [fetchAndCombineData]);

	// --- REWRITTEN: Transaction Handlers ---
	const handleApprove = async () => {
		setPendingTokenId("approve");
		toast.dark("Approving NFT...");
		try {
			const hash = await approve({
				address: NFT_CONTRACT_ADDRESS,
				abi: nftContractABI,
				functionName: "setApprovalForAll",
				args: [STAKING_CONTRACT_ADDRESS, true],
			});
			await publicClient.waitForTransactionReceipt({ hash });
			toast.dark("Approval Successful!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (error) {
			console.error("Approval failed:", error.message);
		} finally {
			setPendingTokenId(null);
		}
	};

	const handleUnApprove = async () => {
		setPendingTokenId("unapprove");
		toast.dark("Unapproving NFT...");
		try {
			const hash = await approve({
				address: NFT_CONTRACT_ADDRESS,
				abi: nftContractABI,
				functionName: "setApprovalForAll",
				args: [STAKING_CONTRACT_ADDRESS, false],
			});
			await publicClient.waitForTransactionReceipt({ hash });
			toast.dark("Unapproval Successful!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (error) {
			console.error("Approval failed:", error.message);
		} finally {
			setPendingTokenId(null);
		}
	};

	const handleStake = async (tokenId) => {
		setPendingTokenId(tokenId);
		try {
			const hash = await stake({
				address: STAKING_CONTRACT_ADDRESS,
				abi: stakingContractABI,
				functionName: "stake",
				args: [parseInt(tokenId)],
			});
			await publicClient.waitForTransactionReceipt({ hash });
			toast.dark("Token Staked Successfully!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (error) {
			console.error("Stake failed:", error.message);
		} finally {
			setPendingTokenId(null);
		}
	};

	const handleUnstake = async (tokenId) => {
		setPendingTokenId(tokenId);
		try {
			const hash = await unstake({
				address: STAKING_CONTRACT_ADDRESS,
				abi: stakingContractABI,
				functionName: "unstake",
				args: [parseInt(tokenId)],
			});
			await publicClient.waitForTransactionReceipt({ hash });
			toast.dark("Token Unstacked Successfully!");
			setTimeout(() => {
				window.location.reload();
			}, 2000);
		} catch (error) {
			console.error("Unstake failed:", error.message);
		} finally {
			setPendingTokenId(null);
		}
	};

	useEffect(() => {
		if (pendingPoints !== undefined) {
			dispatch(setLittleOriginPoint(pendingPoints));
		}
	}, [pendingPoints, dispatch]);

	return (
		<div className='w-full flex items-center flex-col justify-center text-center text-white px-8 py-4'>
			<ToastContainer />
			<motion.div
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='w-full max-w-screen-xl mx-auto flex flex-col items-center justify-center gap-5'
			>
				<div className='flex flex-col gap-6 items-center rounded-lg w-full'>
					<div className='w-full'>
						{isLoading || isFetchingStakedIds ? (
							<p>Loading your collection...</p>
						) : allNfts.length > 0 ? (
							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 rounded-md'>
								{allNfts.map(({ token }) => {
									const isStaked = stakedIdsSet.has(Number(token.tokenId));
									const isPending = pendingTokenId === token.tokenId;

									return (
										<div
											key={token.tokenId}
											className='relative rounded-lg overflow-hidden flex flex-col bg-gray-800'
										>
											<div className='relative w-full h-auto'>
												<img
													src={
														token.imageSmall ||
														`https://bafybeidh6trxtd2pb7isozlrf42vwhpokbg7f3uadkrgs4iqlrl4oxmh2a.ipfs.w3s.link/${token.tokenId}.png`
													}
													alt={token.name}
													className='w-full h-auto object-cover aspect-square'
												/>
												{isStaked && (
													<div className='absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-bold'>
														<PiCoin className="text-white animate-bounce text-4xl" />
													</div>
												)}
											</div>
											<div className='p-2 flex-grow flex flex-col justify-between'>
												<p className='text-sm font-bold truncate'>
													{token.name || `Little Origins #${token.tokenId}`}
												</p>
												{isApproved ? (
													isStaked ? (
														<button
															onClick={() => handleUnstake(token.tokenId)}
															disabled={isPending}
															className='btn-secondary mt-2 w-full'
														>
															{isPending ? "Unstaking..." : "Unstake"}
														</button>
													) : (
														<button
															onClick={() => handleStake(token.tokenId)}
															disabled={isPending}
															className='btn-primary mt-2 w-full'
														>
															{isPending ? "Staking..." : "Stake"}
														</button>
													)
												) : (
													<button
														onClick={handleApprove}
														disabled={pendingTokenId === "approve"}
														className='btn-primary mt-4'
													>
														Approve Staking
													</button>
												)}
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
			</motion.div>
		</div>
	);
}
