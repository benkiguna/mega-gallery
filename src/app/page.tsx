import GalleryUploader from "./components/GalleryUploader";
import PasswordGate from "./components/PasswordGate";
import "../app/globals.css";

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-2 py-4">
      <PasswordGate>
        <GalleryUploader />
      </PasswordGate>
    </main>
  );
}
