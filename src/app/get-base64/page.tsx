'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SECRET_KEY = 'gallery-secret';

async function getKey() {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('salt-gallery'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}


async function encryptText(plainText: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey();
    const encoded = encoder.encode(plainText);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    const fullBuffer = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    // SAFER: Convert to base64 without stack overflow
    const binary = fullBuffer.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
  }
  
  export async function decryptText(encryptedText: string): Promise<string> {
    const data = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    const key = await getKey();
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    return decoder.decode(decrypted);
  }
  

export default function GetBase64Page() {
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result?.toString() || '';
        const encrypted = await encryptText(base64);
        setEncryptedOutput(encrypted);
        setCopied(false);
      } catch (err) {
        console.error('Encryption failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const plainText = formData.get('text-input')?.toString() || '';
    const encrypted = await encryptText(plainText);
    setEncryptedOutput(encrypted);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(encryptedOutput);
    setCopied(true);
  };

  return (
    <main className="min-h-screen bg-muted px-4 py-10 flex flex-col items-center">
      <Card className="w-full max-w-xl p-4">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Encrypt Image or Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <form onSubmit={handleTextSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Text to Encrypt</Label>
                  <Input
                    id="text-input"
                    name="text-input"
                    placeholder="Enter text to encrypt..."
                    className="px-4 py-2"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Encrypt Text
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="image">
              <div className="space-y-2 pt-4">
                <Label htmlFor="file-upload">Upload Image</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="px-3 py-2"
                />
                <p className="text-sm text-muted-foreground">Upload an image to encrypt its base64</p>
              </div>
            </TabsContent>

            {encryptedOutput && (
              <div className="space-y-2 pt-6">
                <Label className="text-sm">Encrypted Output</Label>
                $1h-12 overflow-hidden truncate font-mono text-sm$2
                  readOnly
                <Button onClick={handleCopy} className="w-full" variant="secondary">
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
