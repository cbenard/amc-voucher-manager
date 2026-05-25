import { openDB } from 'idb';

const DB_NAME = 'amc-vouchers';
const DB_VERSION = 1;

let dbPromise;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vouchers')) {
          const store = db.createObjectStore('vouchers', { keyPath: 'id' });
          store.createIndex('type', 'type');
          store.createIndex('isArchived', 'isArchived');
          store.createIndex('dateAdded', 'dateAdded');
          store.createIndex('archivedDate', 'archivedDate');
        }
        if (!db.objectStoreNames.contains('pendingChanges')) {
          db.createObjectStore('pendingChanges', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllVouchers(type, includeArchived) {
  const db = await getDB();
  const tx = db.transaction('vouchers', 'readonly');
  const store = tx.objectStore('vouchers');
  let vouchers = await store.getAll();

  if (type) {
    vouchers = vouchers.filter((v) => typeof v.type === 'string' && v.type.toLowerCase() === type.toLowerCase());
  }
  if (!includeArchived) {
    vouchers = vouchers.filter((v) => !v.isArchived);
  }
  return vouchers;
}

export async function getVoucher(id) {
  const db = await getDB();
  return db.get('vouchers', id);
}

function notify() {
  window.dispatchEvent(new CustomEvent('voucher-data-changed'));
}

export async function putVoucher(voucher) {
  const db = await getDB();
  await db.put('vouchers', voucher);
  notify();
}

export async function deleteVoucher(id) {
  const db = await getDB();
  await db.delete('vouchers', id);
  notify();
}

export async function getAllVouchersRaw() {
  const db = await getDB();
  return db.getAll('vouchers');
}

export async function addPendingChange(change) {
  const db = await getDB();
  return db.add('pendingChanges', {
    ...change,
    createdAt: Date.now(),
  });
}

export async function getPendingChanges() {
  const db = await getDB();
  return db.getAll('pendingChanges');
}

export async function clearPendingChanges() {
  const db = await getDB();
  await db.clear('pendingChanges');
}

export async function removePendingChange(id) {
  const db = await getDB();
  await db.delete('pendingChanges', id);
}
