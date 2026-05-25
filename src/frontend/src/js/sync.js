import * as api from './api.js';
import * as db from './db.js';

let syncing = false;

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

export async function syncFromServer() {
  if (syncing) return;
  syncing = true;

  try {
    const vouchers = await api.fetchVouchers(null, true);
    for (const v of vouchers) {
      await db.putVoucher(v);
    }
  } catch (err) {
    console.warn('Sync from server failed (offline?)', err);
  } finally {
    syncing = false;
  }
}

export async function flushPendingChanges() {
  const changes = await db.getPendingChanges();
  if (changes.length === 0) return;

  let failed = false;

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
      if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        await db.removePendingChange(change.id);
      } else {
        console.warn(`Failed to flush change ${change.id}`, err);
        failed = true;
      }
    }
  }

  if (failed) {
    showToast('Background sync failed — pull down to retry');
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
    fullSync();
  });

  setInterval(() => {
    if (api.isOnline()) {
      fullSync();
    }
  }, 30000);
}
