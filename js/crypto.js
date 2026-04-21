/**
 * SecurColis - Module de chiffrement
 * Utilise Web Crypto API pour AES-256-GCM + PBKDF2
 */
const Crypto = (() => {
  const ALGO = 'AES-GCM';
  const KEY_LENGTH = 256;
  const IV_LENGTH = 12;
  const SALT_LENGTH = 16;
  const PBKDF2_ITERATIONS = 310000;

  function getRandomBytes(n) {
    return crypto.getRandomValues(new Uint8Array(n));
  }

  function toBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function fromBase64(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: ALGO, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function generateKey() {
    return crypto.subtle.generateKey(
      { name: ALGO, length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  return {
    /**
     * Chiffre des données avec un mot de passe (PBKDF2 + AES-256-GCM)
     * @returns {string} salt:iv:ciphertext en base64
     */
    async encryptWithPassword(data, password) {
      const salt = getRandomBytes(SALT_LENGTH);
      const iv = getRandomBytes(IV_LENGTH);
      const key = await deriveKey(password, salt);
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        enc.encode(JSON.stringify(data))
      );
      return `${toBase64(salt)}:${toBase64(iv)}:${toBase64(encrypted)}`;
    },

    /**
     * Déchiffre des données avec un mot de passe
     */
    async decryptWithPassword(encryptedStr, password) {
      const [saltB64, ivB64, dataB64] = encryptedStr.split(':');
      const salt = fromBase64(saltB64);
      const iv = fromBase64(ivB64);
      const data = fromBase64(dataB64);
      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        data
      );
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    },

    /**
     * Chiffre des données avec une clé générée aléatoirement
     * @returns {{ encrypted: string, key: string }} données chiffrées + clé exportable
     */
    async encryptWithRandomKey(data) {
      const key = await generateKey();
      const iv = getRandomBytes(IV_LENGTH);
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        enc.encode(JSON.stringify(data))
      );
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      return {
        encrypted: `${toBase64(iv)}:${toBase64(encrypted)}`,
        key: toBase64(exportedKey)
      };
    },

    /**
     * Déchiffre des données avec une clé exportée
     */
    async decryptWithKey(encryptedStr, keyB64) {
      const [ivB64, dataB64] = encryptedStr.split(':');
      const iv = fromBase64(ivB64);
      const data = fromBase64(dataB64);
      const rawKey = fromBase64(keyB64);
      const key = await crypto.subtle.importKey(
        'raw', rawKey, { name: ALGO, length: KEY_LENGTH }, false, ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: ALGO, iv },
        key,
        data
      );
      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    },

    /**
     * Hash un code PIN avec SHA-256 + salt
     */
    async hashPin(pin, salt) {
      const enc = new TextEncoder();
      const data = enc.encode(salt + pin);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return toBase64(hash);
    },

    /**
     * Génère un identifiant unique sécurisé
     */
    generateId() {
      const bytes = getRandomBytes(16);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Génère un sel aléatoire en base64
     */
    generateSalt() {
      return toBase64(getRandomBytes(SALT_LENGTH));
    },

    toBase64,
    fromBase64
  };
})();
