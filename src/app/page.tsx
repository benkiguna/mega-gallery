import MainTabs from "./components/MainTabs";
import PasswordGate from "./components/PasswordGate";
import "../app/globals.css";
import { ThemeToggle } from "./components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-2 py-4 bg-white text-black dark:bg-black dark:text-white">
      <div className="sticky top-0 z-50 w-full bg-white dark:bg-black border-b dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm transition-colors">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Gallery & Links
        </h1>
        <ThemeToggle />
      </div>
      <PasswordGate>
        <MainTabs />
      </PasswordGate>
    </main>
  );
}
