import React, { useState } from "react";
import { motion } from "framer-motion";
import { ConnectButton, WalletButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useSignTypedData, useContractRead } from "wagmi";
import { recoverTypedDataAddress } from "viem";

export default function Hero() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading } = useBalance({ address });
  const [isSigning, setIsSigning] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const ContractAddress = "0x1488Ae1F469095E62D59F185d3d1bBAFAB3631F8";

  const ABI = [
    {
      "type": "function",
      "name": "setInviteTierWithSig",
      "inputs": [
        { "name": "signer", "type": "address" },
        { "name": "users", "type": "address[]" },
        { "name": "tier", "type": "uint256" },
        { "name": "nonce", "type": "uint256" },
        { "name": "signature", "type": "bytes" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "nonces",
      "inputs": [{ "name": "", "type": "address" }],
      "outputs": [{ "name": "", "type": "uint256" }],
      "stateMutability": "view"
    }
  ];

  // Read the current nonce from the contract
  const { data: currentNonce, refetch: refetchNonce } = useContractRead({
    address: ContractAddress,
    abi: ABI,
    functionName: 'nonces',
    args: [address],
    enabled: !!address,
  });

  // EIP-712 Typed Data structure
  const domain = {
    name: "YourContractName",
    version: "1",
    chainId: 11155111, // Replace with your chainId
    verifyingContract: ContractAddress,
  };

  const types = {
    SetInviteTier: [
      { name: "users", type: "address[]" },
      { name: "tier", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const { signTypedDataAsync } = useSignTypedData();

  const handleSignAndSubmit = async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      // Get current nonce from contract
      await refetchNonce();

      if (currentNonce === undefined) {
        throw new Error("Could not fetch nonce");
      }

      // Prepare the message
      const message = {
        users: [address], // Array of users to set tier for
        tier: 1, // Example tier
        nonce: Number(currentNonce),
      };

      // Sign the typed data
      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: "SetInviteTier",
        message,
      });

      console.log({
        signer: address,
        users: message.users,
        tier: message.tier,
        nonce: message.nonce,
        signature,
      })

      // Send to your relayer backend
      const response = await fetch('/api/relayTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signer: address,
          users: message.users,
          tier: message.tier,
          nonce: message.nonce,
          signature,
        }),
      });

      // First check if response is OK
      if (!response.ok) {
        // Try to parse error response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Then parse successful response
      const result = await response.json();

      if (result.success) {
        setTxHash(result.txHash);
      } else {
        console.error("Full Error:", {
          message: err.message,
          stack: err.stack,
          response: err.response
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="bg-green-400 w-full min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ transform: "translateX(-100px)", opacity: 0 }}
        whileInView={{ transform: "translateX(0px)", opacity: 1 }}
        exit={{ transform: "translateX(-100px)", opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-5"
      >
        {!isConnected ? (
          <div>
            <WalletButton wallet="rainbow" />
            <WalletButton wallet="metamask" />
            <WalletButton wallet="coinbase" />
            <WalletButton wallet="walletconnect" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {address && <p>Address: {address}</p>}
            {balance && (
              <p>
                {isLoading
                  ? "Loading..."
                  : `${balance?.formatted} ${balance?.symbol}`}
              </p>
            )}
            {currentNonce !== undefined && (
              <p>Current Nonce: {currentNonce.toString()}</p>
            )}

            <button
              onClick={handleSignAndSubmit}
              disabled={isSigning || currentNonce === undefined}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isSigning ? "Signing..." : "Sign & Set Tier (Gasless)"}
            </button>

            {txHash && (
              <div className="text-green-600">
                Transaction sent! Hash: {txHash}
              </div>
            )}
            {error && (
              <div className="text-red-600">
                Error: {error}
              </div>
            )}
          </div>
        )}
        <ConnectButton />
      </motion.div>
    </div>
  );
}