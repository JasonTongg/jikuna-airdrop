import Link from "next/link";
import Image from "next/image";
import React from "react";
import Logo from "../public/assets/logo.png";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { GiHamburgerMenu } from "react-icons/gi";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default function Navbar() {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<nav className='flex items-center justify-between w-full z-[99] p-4  gap-4 padding-section fixed max-w-screen-2xl px-4 sm:px-6 lg:px-8 top-0 left-1/2 translate-x-[-50%] bg-[rgba(0,0,0,0.25)]'>
			<Link href='/' className="lg:w-[263px] xs:block hidden">
				<Image src={Logo} className='w-[65px]' />
			</Link>
			<div className="items-center justify-center gap-5 lg:flex hidden">
				<Link href="/#product" className="bg-white py-1 px-7 rounded-[100px] hover:scale-105 active:scale-95 transition-all">Product</Link>
				<Link href="/stake" className="bg-white py-1 px-7 rounded-[100px] hover:scale-105 active:scale-95 transition-all">Stake</Link>
				<Link href="/point" className="hover:scale-105 active:scale-95 transition-all bg-[#5A68F9] text-white py-1 px-7 rounded-[100px]">Airdrop</Link>
			</div>
			<ConnectButton />
			<GiHamburgerMenu
				className="text-3xl lg:hidden block cursor-pointer text-white"
				onClick={handleClick}
			/>
			<Menu
				id="basic-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					"aria-labelledby": "basic-button",
				}}
			>
				<div className="bg-white text-black">
					<Link href="#about" onClick={handleClose}>
						<MenuItem>Product</MenuItem>
					</Link>
					<Link href="#how" onClick={handleClose}>
						<MenuItem>Stake</MenuItem>
					</Link>
					<Link href="#token" onClick={handleClose}>
						<MenuItem>Airdrop</MenuItem>
					</Link>
				</div>
			</Menu>
		</nav>
	);
}
