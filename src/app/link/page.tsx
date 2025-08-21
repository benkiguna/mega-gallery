import LinksManager from "../components/LinksManager";
import PasswordGate from "../components/PasswordGate";
import "../globals.css";
import { ThemeToggle } from "../components/theme-toggle";

export default function LinkPage() {
  return (
    <main className="min-h-screen bg-white px-2 py-4 bg-white text-black dark:bg-black dark:text-white">
      <div className="sticky top-0 z-50 w-full bg-white dark:bg-black border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Links Manager
        </h1>
        <ThemeToggle />
      </div>
      <PasswordGate>
        <div className="w-full px-4 py-6 flex flex-col items-center bg-white dark:bg-black">
          <div className="w-full max-w-6xl">
            <LinksManager />
          </div>
        </div>
      </PasswordGate>
    </main>
  );
}