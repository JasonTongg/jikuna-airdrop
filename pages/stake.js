import React, { useEffect } from "react";
import About from "@/components/About";
import Social from "@/components/Social";
import Tokenomics from "@/components/Tokenomics";
import Hero from "@/components/Hero";
import { useSelector } from "react-redux";
import HowToBuy from "@/components/HowToBuy";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useAccount } from "wagmi";

export default function Index() {
	// Use useSelector to get the relevant state from Redux
	const { littleOriginPoint, jikunaPoint } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();

	const [value, setValue] = React.useState("one");

	const handleChange = (event, newValue) => {
		setValue(newValue);
	};

	return (
		<div className='bg-bg min-h-screen w-full relative pt-20 flex flex-col items-center justify-start'>
			{isConnected && address ? (
				<h2 className='text-2xl font-bold mb-4 text-white mt-[2rem]'>
					Total Point: {Number(littleOriginPoint) + Number(jikunaPoint)}
				</h2>
			) : (
				<h2 className='text-2xl font-bold mb-4 text-white mt-[2rem]'>
					Total Point: 0
				</h2>
			)}

			<Box>
				<Tabs
					value={value}
					onChange={handleChange}
					sx={{
						'& .MuiTabs-indicator': {
							backgroundColor: 'white',
						},
					}}
					textColor='inherit'
					aria-label='white tabs example'
				>
					<Tab value='one' label='Jikuna Little Origin' sx={{ color: 'white' }} />
					<Tab value='two' label='Jikupass' sx={{ color: 'white' }} />
					<Tab value='three' label='Coming soon' sx={{ color: 'white' }} disabled />
					<Tab value='four' label='Coming soon' sx={{ color: 'white' }} disabled />
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
