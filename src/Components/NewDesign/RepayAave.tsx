import useAaveHook from "@/hooks/useAaveHook";
import { MarketType } from "@/types/types";
import React, { useState } from "react";
import { useAccount } from "wagmi";

const RepayAave = () => {
  const [market, setMarket] = useState("EthereumCore"); // Or get this dynamically
  const [tokenSymbol, setTokenSymbol] = useState("USDC"); // Example token
  const [amount, setAmount] = useState(""); // From input

  const { address } = useAccount();

  const { repayToAave } = useAaveHook();
  const handleRepay = async () => {
    const repayData = {
      market: market as MarketType,
      tokenSymbol,
      amount,
      onBehalfOf: address, // Use address directly here
    };

    const result = await repayToAave(repayData);

    if (Array.isArray(result)) {
      alert(`Repayment submitted. TX Hash: ${result[0]}`);
    } else if (result && typeof result === "object" && "success" in result) {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full"
      />
      <button
        onClick={handleRepay}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Repay to Aave
      </button>
    </div>
  );
};

export default RepayAave;
