"use client";

import { useCurrentUser, useEvmAddress } from "@coinbase/cdp-hooks";

export default function DashboardPage() {
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg text-gray-600">
        Welcome to your dashboard! Here you can manage your account and view
        your data.
      </p>
      <div>
        <p>User ID: {currentUser?.userId}</p>
        <p>Wallet Address: {evmAddress}</p>
      </div>
    </div>
  );
}
