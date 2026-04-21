/**
 * SecurColis - Module de stockage IndexedDB
 * Gère le stockage local chiffré des livraisons
 */
const DB = (() => {
  const DB_NAME = 'securcolis';
  const DB_VERSION = 1;
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('deliveries')) {
          const store = d.createObjectStore('deliveries', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('created', 'created', { unique: false });
        }
        if (!d.objectStoreNames.contains('settings')) {
          d.createObjectStore('settings', { keyPath: 'key' });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }

  function tx(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  return {
    async init() {
      await open();
    },

    async saveDelivery(delivery) {
      await open();
      return promisify(tx('deliveries', 'readwrite').put(delivery));
    },

    async getDelivery(id) {
      await open();
      return promisify(tx('deliveries', 'readonly').get(id));
    },

    async getAllDeliveries() {
      await open();
      return promisify(tx('deliveries', 'readonly').getAll());
    },

    async deleteDelivery(id) {
      await open();
      return promisify(tx('deliveries', 'readwrite').delete(id));
    },

    async setSetting(key, value) {
      await open();
      return promisify(tx('settings', 'readwrite').put({ key, value }));
    },

    async getSetting(key) {
      await open();
      const result = await promisify(tx('settings', 'readonly').get(key));
      return result ? result.value : null;
    },

    async clearAll() {
      await open();
      const t = db.transaction(['deliveries', 'settings'], 'readwrite');
      t.objectStore('deliveries').clear();
      t.objectStore('settings').clear();
      return new Promise((resolve, reject) => {
        t.oncomplete = resolve;
        t.onerror = () => reject(t.error);
      });
    }
  };
})();
