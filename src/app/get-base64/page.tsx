'use client';

import { useState } from 'react';

export default function GetBase64Page() {
  const [base64, setBase64] = useState('');
  const [copied, setCopied] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64(reader.result as string);
      setCopied(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(base64);
    setCopied(true);
  };

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Image to Base64 Converter</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="block w-full"
      />

      {base64 && (
        <>
          <textarea
            className="w-full h-40 p-2 border border-transparent rounded font-mono text-sm"
            value={base64}
            readOnly
          />
          <button
            onClick={handleCopy}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </>
      )}
    </main>
  );
}
