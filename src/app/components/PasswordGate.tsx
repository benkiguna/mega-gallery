"use client";

import { useState } from "react";

export default function PasswordGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"default" | "admin" | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "megabluff") {
      setMode("default");
    } else if (password === "admin") {
      setMode("admin");
    } else {
      setError("ACCESS DENIED");
    }
  };

  if (mode === "default") return <>{children}</>;
  if (mode === "admin") {
    return (
      <div className="h-screen w-screen bg-white dark:bg-black text-black dark:text-green-400 font-mono flex items-center justify-center px-4">
        <div className="text-center space-y-3 border border-gray-300 dark:border-green-700 rounded-md p-6 w-full max-w-md shadow-lg bg-white dark:bg-black">
          <h1 className="text-2xl font-semibold dark:text-green-400">
            🛠 Admin Console
          </h1>
          <p>
            System Status:{" "}
            <span className="text-green-700 dark:text-green-400 font-medium">
              All Systems Operational
            </span>
          </p>
          <p>
            Terminal Access Level:{" "}
            <span className="text-yellow-700 dark:text-yellow-400 font-medium">
              ROOT
            </span>
          </p>
          <p className="text-sm text-gray-600 dark:text-zinc-500">
            Press ⌘ + Q to exit
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-white dark:bg-black text-black dark:text-green-400 font-mono flex items-center justify-center p-4">
      <div className="w-full max-w-2xl min-h-[60vh] border border-gray-300 dark:border-green-700 rounded-md shadow-lg flex flex-col">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-200 dark:bg-zinc-800 rounded-t-md">
          <div className="flex space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
          </div>
          <p className="text-xs text-gray-600 dark:text-zinc-400">
            Secure Access Terminal v1.2
          </p>
          <div className="w-6" />
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-6 bg-white dark:bg-black rounded-b-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center text-lg sm:text-xl">
              <span className="mr-2 dark:text-green-400 text-gray-800">
                &gt;
              </span>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="bg-transparent border-none outline-none focus:ring-0 w-full text-left
                           text-black dark:text-green-400 placeholder-gray-500 dark:placeholder-green-600"
                placeholder="Enter access key"
              />
            </div>
            {error && (
              <p className="text-red-600 dark:text-red-500 text-sm text-left">
                {error}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
