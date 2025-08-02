import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Obj1 from "../public/assets/Obj1.png";
import Obj2 from "../public/assets/Obj2.png";
import Obj3 from "../public/assets/Obj3.png";
import Circle from "../public/assets/Circle.png";
import Image from "next/image";
import {
	useAccount,
	usePublicClient, // 👈 NEW: Import the public client hook
	useContractRead,
	useWriteContract,
} from "wagmi";
import { useDispatch } from "react-redux";
import { setLittleOriginPoint, setJikunaPoint } from "@/store/data";
import { ToastContainer, toast } from "react-toastify";

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

const STAKING_CONTRACT_ADDRESS = "0x537044a96910cBB7E71D770857Be19c74C013dE0";
const NFT_CONTRACT_ADDRESS = "0x874df014adc21d0f76c706b2f58b069487a6d71d";
const STAKING_CONTRACT_ADDRESS2 = "0x8D912E01Cd1d0B08dDB36752E538788c6B30422b";
const NFT_CONTRACT_ADDRESS2 = "0x66bFe7C5C2dc052492938a9f7D50251A47B375ef";

export default function Index() {
	const { littleOriginPoint, jikunaPoint } = useSelector((state) => state.data);
	const dispatch = useDispatch();
	const { address, isConnected } = useAccount();

	// --- State Management ---
	const [allNfts, setAllNfts] = useState([]);
	const [stakeNfts, setStakeNfts] = useState([]);
	const [stakedIdsSet, setStakedIdsSet] = useState(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [refetchTrigger, setRefetchTrigger] = useState(0);
	const [allNfts2, setAllNfts2] = useState([]);
	const [stakeNfts2, setStakeNfts2] = useState([]);
	const [stakedIdsSet2, setStakedIdsSet2] = useState(new Set());
	const [isLoading2, setIsLoading2] = useState(true);
	const [refetchTrigger2, setRefetchTrigger2] = useState(0);

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
	const { data: pendingPoints2, isLoading: isLoadingPoints2 } = useContractRead({
		address: STAKING_CONTRACT_ADDRESS2,
		abi: stakingContractABI,
		functionName: "getPendingPoints",
		args: [],
		account: address,
		enabled: isConnected,
		refetchInterval: 5000,
		query: { queryKey: ["getPendingPoints", address, refetchTrigger2] },
	});
	const { data: stakedIds2, isFetching: isFetchingStakedIds2 } = useContractRead({
		address: STAKING_CONTRACT_ADDRESS2,
		abi: stakingContractABI,
		functionName: "getUserStaked",
		args: [address],
		enabled: isConnected,
		query: { queryKey: ["getUserStaked", address, refetchTrigger2] },
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
		setStakeNfts(stakedList);
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

	const fetchAndCombineData2 = useCallback(async () => {
		if (!isConnected || !address) return;
		setIsLoading2(true);
		const unstakedApiUrl = `https://api-mainnet.magiceden.dev/v3/rtp/monad-testnet/users/${address}/tokens/v7?contract=${NFT_CONTRACT_ADDRESS2}`;
		const unstakedPromise = fetch(unstakedApiUrl).then((res) => res.json());
		const [unstakedData] = await Promise.all([
			unstakedPromise,
			stakedIds2 !== undefined,
		]);
		const unstakedList = unstakedData.tokens || [];
		const localStakedIds = new Set((stakedIds2 || []).map((id) => Number(id)));
		setStakedIdsSet2(localStakedIds);
		const stakedList = Array.from(localStakedIds).map((id) => {
			const tokenId = id.toString();
			return {
				token: {
					tokenId,
					name: `Little Origins #${tokenId}`,
					imageSmall: `https://bafybeigmar5cy3aglukkz3nuhgqtw2opg4a3x4f5agcebfgcajstiufogy.ipfs.w3s.link/${tokenId}.png`,
				},
			};
		});
		setStakeNfts2(stakedList);
		const combined = [...stakedList, ...unstakedList];
		const nftMap = new Map(combined.map((item) => [item.token.tokenId, item]));
		const uniqueNfts = Array.from(nftMap.values());

		uniqueNfts.sort(
			(a, b) => parseInt(a.token.tokenId) - parseInt(b.token.tokenId)
		);

		setAllNfts2(uniqueNfts);
		setIsLoading(false);
	}, [isConnected, address, stakedIds2]);

	useEffect(() => {
		fetchAndCombineData2();
	}, [fetchAndCombineData2]);

	useEffect(() => {
		if (pendingPoints !== undefined) {
			dispatch(setLittleOriginPoint(pendingPoints));
		}
	}, [pendingPoints, dispatch]);

	useEffect(() => {
		if (pendingPoints2 !== undefined) {
			dispatch(setJikunaPoint(pendingPoints2));
		}
	}, [pendingPoints2, dispatch]);

	useEffect(() => {
		console.log("All NFTs:", allNfts);
		console.log("All NFTs Length:", allNfts.length);
		console.log("All NFTs 2:", allNfts2);
		console.log("All NFTs 2 Length:", allNfts2.length);
	}, [allNfts, allNfts2]);

	return (
		<div className='bg-bg min-h-[110vh] sm:min-h-screen w-full relative pt-40 sm:pt-20 flex flex-col items-center justify-start'>
			<ToastContainer />
			<div className="absolute bottom-[67vh] left-1/2 translate-x-[-50%] flex flex-col items-center justify-center gap-2">
				<h2 className="text-2xl sm:text-4xl w-full text-center text-white font-bold ">JIKUNA AIRDROP</h2>
				<div className="sm:hidden flex flex-col items-center justify-center text-white">
					<h3 className="">Jikuna Point</h3>
					{isConnected && address ? (
						<h2 className='text-white text-3xl font-bold'>
							{Number(littleOriginPoint) + Number(jikunaPoint)}
						</h2>
					) : (
						<h2 className='text-white text-3xl font-bold'>
							0
						</h2>
					)}
				</div>
			</div>
			<Image src={Circle} className="h-auto sm:h-[60vh] w-full sm:w-auto absolute bottom-0 left-1/2 translate-x-[-50%]" />
			<div className="w-[100vw] min-w-[100vw] md:min-w-[750px] md:w-[70vw] h-[60vh] absolute bottom-0 left-1/2 translate-x-[-50%]">
				<div className="hidden sm:flex flex-col items-center justify-center text-white absolute bottom-[20px] left-1/2 translate-x-[-50%]">
					<h3 className="">Jikuna Point</h3>
					{isConnected && address ? (
						<h2 className='text-white text-3xl font-bold'>
							{Number(littleOriginPoint) + Number(jikunaPoint)}
						</h2>
					) : (
						<h2 className='text-white text-3xl font-bold'>
							0
						</h2>
					)}
				</div>
				<div className="flex sm:hidden mt-auto flex-row items-center justify-center flex-wrap gap-4 w-full">
					<div className="transparent2" style={{ backgroundColor: allNfts.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Jikuna Little Origin Testnet Holder</div>
					<div className="transparent2" style={{ backgroundColor: allNfts2.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Jikupass Testnet Holder</div>
					<div className="transparent2" style={{ backgroundColor: stakeNfts.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Stake Jikuna Little Origin Testnet</div>
					<div className="transparent2" style={{ backgroundColor: stakeNfts2.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Stake Jikupass Testnet Holder</div>
					<div className={`transparent2 md:translate-x-12 bg-white bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
					<div className={`transparent2 bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
					<div className={`transparent2 md:translate-x-12 bg-white bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
					<div className={`transparent2 bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
				</div>
				<div className="hidden sm:flex flex-col items-start justify-evenly gap-4 w-fit h-full absolute left-4 md:left-0 top-1/2 translate-y-[-50%]">
					<div className={`transparent2 md:translate-x-40`} style={{ backgroundColor: allNfts.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Jikuna Little Origin Testnet Holder</div>
					<div className={`transparent2 md:translate-x-28`} style={{ backgroundColor: allNfts2.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Jikupass Testnet Holder</div>
					<div className={`transparent2 md:translate-x-12 bg-white bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
					<div className={`transparent2 bg-[rgba(255,255,255,.2)]`}>Coming Soon</div>
				</div>
				<div className="hidden sm:flex flex-col items-end justify-evenly gap-4 w-fit h-full absolute right-4 md:right-0 top-1/2 translate-y-[-50%]">
					<div className="transparent2 -translate-x-0 md:-translate-x-40" style={{ backgroundColor: stakeNfts.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Stake Jikuna Little Origin Testnet</div>
					<div className="transparent2 -translate-x-0 md:-translate-x-28" style={{ backgroundColor: stakeNfts2.length > 0 ? "rgba(129, 252, 143, .3)" : "rgba(245, 66, 102, .2)" }}>Stake Jikupass Testnet Holder</div>
					<div className="transparent2 -translate-x-0 md:-translate-x-12 bg-[rgba(255,255,255,.2)]">Coming Soon</div>
					<div className="transparent2 bg-[rgba(255,255,255,.2)]">Coming Soon</div>
				</div>
			</div>
		</div >
	);
}
