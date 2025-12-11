// crypto.js — PBKDF2 + AES-GCM using password
async function deriveKey(password, salt, iterations=200000){
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations, hash:'SHA-256' },
    keyMaterial,
    { name:'AES-GCM', length:256 },
    false,
    ['encrypt','decrypt']
  );
}
function b64enc(buf){ return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64dec(b64){ return Uint8Array.from(atob(b64), c=>c.charCodeAt(0)); }
async function aesEncryptJson(obj, secret){
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 200000;
  const key = await deriveKey(secret, salt, iterations);
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
  return { iv:b64enc(iv), salt:b64enc(salt), iterations, cipher:b64enc(cipher) };
}
async function aesDecryptJson(bundle, secret){
  const iv = b64dec(bundle.iv); const salt = b64dec(bundle.salt);
  const key = await deriveKey(secret, salt, bundle.iterations||200000);
  const cipher = b64dec(bundle.cipher);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, cipher);
  return JSON.parse(new TextDecoder().decode(plain));
}
window.GCrypto = { aesEncryptJson, aesDecryptJson };
