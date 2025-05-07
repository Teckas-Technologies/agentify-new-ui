import React, { useState } from "react";
import { useBeraSwap } from "@/hooks/useBeraSwap";

const SwapComponent = () => {
  const {
    isSwapping,
    error,
    txHash,
    swap,
  } = useBeraSwap();

  const [amount, setAmount] = useState("1");

  // Example token addresses and metadata for HONEY and USDC on Berachain
  const WETH = {
    address: "0x4200000000000000000000000000000000000023", // Berachain WETH address (common placeholder)
    decimals: 18,
    symbol: "WETH",
  };
  
  const USDC = {
    address: "0xF9f98bF7F7dA2E11EeD7AcC0A5b165b22Ae6C70B",
    decimals: 6,
    symbol: "USDC",
  };
  
  
  
  

  const handleSwap = async () => {
    try {
      const tx = await swap(
        WETH.address,
        WETH.decimals,
        WETH.symbol,
        USDC.address,
        USDC.decimals,
        USDC.symbol,
        "0.01" // try a small amount of WETH
      );
      console.log("Swap successful, TX hash:", tx);
    } catch (err) {
      console.error("Swap failed", err);
    }
  };

  return (
    <div>
      <h2>Swap HONEY to USDC</h2>
      <input
        type="text"
        placeholder="Amount of HONEY"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSwap} disabled={isSwapping}>
        {isSwapping ? "Swapping..." : "Swap"}
      </button>
      {txHash && <p>Transaction Hash: {txHash}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
};

export default SwapComponent;
