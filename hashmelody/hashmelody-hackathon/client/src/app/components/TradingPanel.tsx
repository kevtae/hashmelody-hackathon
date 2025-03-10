"use client";

import { useState } from "react";

export default function TradingPanel() {
  const [amount, setAmount] = useState("");

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Trade Music Coin</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full p-2 mb-4 bg-gray-800 text-white rounded-lg"
      />
      <div className="flex gap-4">
        <button className="flex-1 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          Buy
        </button>
        <button className="flex-1 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Sell
        </button>
      </div>
    </div>
  );
}
