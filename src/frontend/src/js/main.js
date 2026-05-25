import { initRouter, route, navigate, getCurrentRoute } from './router.js';
import * as api from './api.js';
import * as db from './db.js';
import { fullSync, flushPendingChanges, registerBackgroundSync } from './sync.js';
import { renderHome } from './views/home.js';
import { renderList } from './views/list.js';
import { renderDetail } from './views/detail.js';
import { renderForm } from './views/form.js';

function setupMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const sideMenu = document.getElementById('side-menu');

  menuBtn.addEventListener('click', () => {
    const isOpen = sideMenu.classList.toggle('open');
    if (isOpen) {
      const overlay = document.createElement('div');
      overlay.id = 'menu-overlay';
      overlay.addEventListener('click', () => {
        sideMenu.classList.remove('open');
        overlay.remove();
      });
      document.body.appendChild(overlay);
    } else {
      document.getElementById('menu-overlay')?.remove();
    }
  });

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', () => {
      sideMenu.classList.remove('open');
      document.getElementById('menu-overlay')?.remove();
    });
  });
}

function init() {
  setupMenu();

  route('/', () => renderHome());
  route('/list/:type', (params) => renderList(params));
  route('/voucher/:id', (params) => renderDetail(params));
  route('/add', () => renderForm({}));
  route('/edit/:id', (params) => renderForm(params));

  initRouter();

  api.connectHub({
    onVoucherCreated: (v) => db.putVoucher(v),
    onVoucherUpdated: (v) => db.putVoucher(v),
    onVoucherArchived: (v) => db.putVoucher(v),
    onVoucherDeleted: (id) => db.deleteVoucher(id),
  });

  api.fetchCsrfToken();

  if (api.isOnline()) {
    fullSync().then(() => console.log('Initial sync complete'));
  }

  window.addEventListener('voucher-data-changed', () => {
    if (getCurrentRoute() === '/') {
      renderHome();
    }
  });

  document.getElementById('sync-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    fullSync().then(() => showToast('Sync complete')).catch(() => showToast('Sync failed'));
  });

  registerBackgroundSync();
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

document.addEventListener('DOMContentLoaded', init);
