import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Obj1 from "../public/assets/Obj1.png";
import Obj2 from "../public/assets/Obj2.png";
import Obj3 from "../public/assets/Obj3.png";

export default function Index() {
	const { littleOriginPoint, jikunaPoint } = useSelector((state) => state.data);
	const { address, isConnected } = useAccount();

	return (
		<div className='bg-bg min-h-screen w-full relative pt-20 flex flex-col items-center justify-start'>
			{isConnected && address ? (
				<h2 className='text-2xl font-bold mb-4'>
					Total Point: {Number(littleOriginPoint) + Number(jikunaPoint)}
				</h2>
			) : (
				<ConnectButton />
			)}
		</div>
	);
}
