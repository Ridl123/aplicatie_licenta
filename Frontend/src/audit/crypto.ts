export type SignAlg = "ECDSA_P256_SHA256";

function toB64(bytes: ArrayBuffer) {
  const arr = new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

// stringify stabil (ordine deterministă a cheilor)
export function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",")}}`;
}

export async function sha256Base64(data: string) {
  const enc = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return toB64(digest);
}

export type KeyMaterial = {
  alg: SignAlg;
  keyId: string;
  publicKeySpkiB64: string;
  privateKeyPkcs8B64: string;
};

// Pentru demonstratia din martie: cheile se păstrează local.
// În producție: cheia privată NU stă în client.
const LS_KEY = "audit_keymaterial_v1";

export async function loadOrCreateLocalKey(): Promise<KeyMaterial> {
  const existing = localStorage.getItem(LS_KEY);
  if (existing) return JSON.parse(existing) as KeyMaterial;

  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const spki = await crypto.subtle.exportKey("spki", pair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);

  const keyId = "local-p256-" + Math.random().toString(36).slice(2);

  const mat: KeyMaterial = {
    alg: "ECDSA_P256_SHA256",
    keyId,
    publicKeySpkiB64: toB64(spki),
    privateKeyPkcs8B64: toB64(pkcs8),
  };

  localStorage.setItem(LS_KEY, JSON.stringify(mat));
  return mat;
}

export async function importPrivateKey(mat: KeyMaterial) {
  return crypto.subtle.importKey(
    "pkcs8",
    fromB64(mat.privateKeyPkcs8B64),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

export async function importPublicKey(mat: KeyMaterial) {
  return crypto.subtle.importKey(
    "spki",
    fromB64(mat.publicKeySpkiB64),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
}

export async function signBase64(privateKey: CryptoKey, data: string) {
  const enc = new TextEncoder().encode(data);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, enc);
  return toB64(sig);
}

export async function verifyBase64(publicKey: CryptoKey, data: string, signatureB64: string) {
  const enc = new TextEncoder().encode(data);
  const ok = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    fromB64(signatureB64),
    enc
  );
  return ok;
}