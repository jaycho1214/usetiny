const DB_NAME = "pdf-editor";
const STORE_NAME = "files";
const KEY = "current-pdf";

let cachedDB: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (cachedDB) return Promise.resolve(cachedDB);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      cachedDB = request.result;
      cachedDB.onclose = () => { cachedDB = null; };
      resolve(cachedDB);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function savePdfToIDB(data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(data, KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPdfFromIDB(): Promise<ArrayBuffer | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const request = tx.objectStore(STORE_NAME).get(KEY);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPdfFromIDB(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(KEY);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
