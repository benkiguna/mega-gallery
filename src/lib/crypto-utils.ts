// src/lib/crypto-utils.ts

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SECRET_KEY = 'gallery-secret';

async function getKey() {
  const keyMaterial = await crypto.subtle.importKey(
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

export async function encryptText(plainText: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey();
  const encoded = encoder.encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  const fullBuffer = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...fullBuffer));
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
