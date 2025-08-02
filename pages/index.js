import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Obj1 from "../public/assets/Obj1.png";
import Obj2 from "../public/assets/Obj2.png";
import Obj3 from "../public/assets/Obj3.png";
import Image from "next/image";
import Logo from "../public/assets/logo.png";
import Link from "next/link";

export default function Index() {
	const { littleOriginPoint, jikunaPoint } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();

	return (
		<div className='bg-bg min-h-screen w-full relative py-28 flex flex-col items-center justify-start'>
			<div className="grid gap-3 w-full px-4 sm:px-14 grid-home">
				<div className="w-full xl:h-[400px] xl:py-0 py-8 flex items-center xl:items-start justify-center flex-col text-white ">
					<h2 className="text-4xl sm:text-6xl font-bold">JIKUNA</h2>
					<h3 className="text-base sm:text-xl font-bold xl:text-start text-center xl:max-w-[100vw] max-w-[700px]">Anime-themed NFT project on the Monad blockchain, combining digital ownership, DeFi utility, and community engagement.</h3>
					<p className="text-base mt-[1rem] xl:text-start text-center xl:max-w-[100vw] max-w-[700px]">Built on Monad's high-performance Layer 1, it offers low fees and scalability for NFTs and DeFi. More than just a collection, Jikuna is a movement blending anime aesthetics, Web3 innovation, and real-world impact.</p>
				</div>
				<div className="sm:h-[400px] flex items-center justify-center flex-col">
					<Image src={Obj1} className="sm:h-[100%] sm:w-auto w-[100%]" />
				</div>
			</div>
			<div id="product" className="flex flex-col items-center justify-center gap-6 w-full mt-[3rem]">
				<h2 className="text-4xl text-white font-bold">PRODUCT</h2>
				<div className="flex items-center justify-center flex-wrap gap-4">
					<Link href="https://magiceden.io/collections/monad-testnet/0x874df014adc21d0f76c706b2f58b069487a6d71d" target="_blank" className="bg-transparent cursor-pointer hover:scale-105 active:scale-95 transition-all">
						<Image src={Obj2} className="px-4 pt-4" />
						<h2 className="pb-4 text-white text-xl font-bold mt-[0.5rem]">Jikuna Little Origin</h2>
					</Link>
					<Link href="https://magiceden.io/collections/monad-testnet/0x66bfe7c5c2dc052492938a9f7d50251a47b375ef" target="_blank" className="bg-transparent cursor-pointer hover:scale-105 active:scale-95 transition-all">
						<Image src={Obj3} className="px-4 pt-4" />
						<h2 className="pb-4 text-white text-xl font-bold mt-[0.5rem]">Jikupass</h2>
					</Link>
					<div className="bg-transparent relative">
						<div className="w-full h-full absolute z-[2] rounded-[30px] flex items-center justify-center text-2xl font-bold text-white bg-[rgba(0,0,0,.35)]">
							<Image src={Logo}></Image>
						</div>
						<Image src={Obj3} className="blur-[6px] px-4 pt-4" />
						<h2 className="pb-4 text-white text-xl font-bold mt-[0.5rem]">Coming Soon</h2>
					</div>
					<div className="bg-transparent relative">
						<div className="w-full h-full absolute z-[2] rounded-[30px] flex items-center justify-center text-2xl font-bold text-white bg-[rgba(0,0,0,.35)]">
							<Image src={Logo}></Image>
						</div>
						<Image src={Obj3} className="blur-[6px] px-4 pt-4" />
						<h2 className="pb-4 text-white text-xl font-bold mt-[0.5rem]">Coming Soon</h2>
					</div>
				</div>
			</div>
		</div>
	);
}
