import React, { useEffect } from "react";
import About from "@/components/About";
import Social from "@/components/Social";
import Tokenomics from "@/components/Tokenomics";
import Hero from "@/components/Hero";
import { useSelector } from "react-redux";
import { fetchDexscreener, fetchDextools, fetchUniswap } from "@/store/data";
import Store from "@/store/store";
import HowToBuy from "@/components/HowToBuy";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Index() {
	// Use useSelector to get the relevant state from Redux
	const { littleOriginPoint, jikunaPoint } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();

	const [value, setValue] = React.useState("one");

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	return (
		<div className='bg-gray-500 min-h-screen w-full relative pt-20 flex flex-col items-center justify-start'>
			{isConnected && address ? (
				<h2 className='text-2xl font-bold mb-4'>
					Total Point: {Number(littleOriginPoint) + Number(jikunaPoint)}
				</h2>
			) : (
				<ConnectButton />
			)}
			<Box>
				<Tabs
					value={value}
					onChange={handleChange}
					textColor='secondary'
					indicatorColor='secondary'
					aria-label='secondary tabs example'
				>
					<Tab value='one' label='Item One' />
					<Tab value='two' label='Item Two' />
					<Tab value='three' label='Item Three' />
					<Tab value='four' label='Item Four' />
				</Tabs>
			</Box>

			<Box>
				{value === "one" && <Hero />}
				{value === "two" && <About />}
				{value === "three" && <HowToBuy />}
				{value === "four" && <Tokenomics />}
			</Box>
		</div>
	);
}
