import * as api from './api.js';
import * as db from './db.js';

let syncing = false;

export async function syncFromServer() {
  if (syncing) return;
  syncing = true;

  try {
    const vouchers = await api.fetchVouchers(null, true);
    for (const v of vouchers) {
      await db.putVoucher(v);
    }
    console.log(`Synced ${vouchers.length} vouchers from server`);
  } catch (err) {
    console.warn('Sync from server failed (offline?)', err);
  } finally {
    syncing = false;
  }
}

export async function flushPendingChanges() {
  const changes = await db.getPendingChanges();
  if (changes.length === 0) return;

  console.log(`Flushing ${changes.length} pending changes`);

  for (const change of changes) {
    try {
      switch (change.action) {
        case 'create':
          await api.createVoucher(change.data);
          break;
        case 'update':
          await api.updateVoucher(change.id, change.data);
          break;
        case 'archive':
          await api.toggleArchive(change.id);
          break;
        case 'delete':
          await api.deleteVoucherApi(change.id);
          break;
      }
      await db.removePendingChange(change.id);
    } catch (err) {
      console.warn(`Failed to flush change ${change.id}`, err);
    }
  }
}

export async function fullSync() {
  await flushPendingChanges();
  await syncFromServer();
}

export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.sync.register('sync-vouchers').catch(() => {
        console.warn('Background sync registration failed');
      });
    });
  }

  window.addEventListener('online', () => {
    console.log('Back online, syncing...');
    fullSync();
  });

  setInterval(() => {
    if (api.isOnline()) {
      fullSync();
    }
  }, 30000);
}
