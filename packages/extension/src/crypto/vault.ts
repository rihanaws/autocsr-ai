// AES-GCM encryption via Web Crypto API. Key stored in chrome.storage.session (ephemeral).

const KEY_NAME = "autocsr_vault_key";
const ALG = { name: "AES-GCM", length: 256 };

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.session.get(KEY_NAME);
  if (stored[KEY_NAME]) {
    const raw = new Uint8Array(stored[KEY_NAME]);
    return crypto.subtle.importKey("raw", raw, ALG, false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey(ALG, true, ["encrypt", "decrypt"]);
  const raw = await crypto.subtle.exportKey("raw", key);
  await chrome.storage.session.set({ [KEY_NAME]: Array.from(new Uint8Array(raw)) });
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encoded: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = new Uint8Array(atob(encoded).split("").map((c) => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
