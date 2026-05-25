import * as db from '../db.js';
import * as api from '../api.js';
import { renderQR } from '../qrcode.js';
import { renderBarcode } from '../barcode.js';
import { TYPE_CONFIG } from './home.js';

const TYPE_ICONS = Object.fromEntries(TYPE_CONFIG.map((t) => [t.type, t.icon]));

export async function renderDetail(params) {
  const main = document.getElementById('main-content');
  const title = document.getElementById('app-title');

  const id = params.id;
  const voucher = await db.getVoucher(id);
  if (!voucher) {
    main.innerHTML = `<div class="empty-state"><p>Voucher not found</p><a href="#/" data-nav>Go Home</a></div>`;
    return;
  }

  title.textContent = 'Voucher Detail';

  const icon = TYPE_ICONS[voucher.type?.toLowerCase()] || '🎫';
  const dateStr = formatDate(voucher.dateAdded);
  const typeLabel = voucher.type;

  let html = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="font-size:1.5em;">${icon}</span>
        <span style="font-weight:600;font-size:1.1em;">${typeLabel}</span>
        <span style="color:var(--text-muted);font-size:0.85em;">${dateStr}</span>
        ${voucher.isArchived ? `<span class="badge" style="background:var(--primary);color:white;">Archived ${formatDate(voucher.archivedDate)}</span>` : ''}
      </div>
      ${voucher.notes ? `<p style="color:var(--text-muted);font-size:0.9em;white-space:pre-wrap;">${escapeHtml(voucher.notes)}</p>` : ''}
    </div>

    <div class="barcode-section">
      <div id="qr-card" class="barcode-card">
        <div class="label">QR Code (16-digit)</div>
        <div id="qr-render"></div>
        <div class="blur-overlay"><span class="tap-hint">Tap to reveal</span></div>
      </div>

      <div id="barcode12-card" class="barcode-card">
        <div class="label">12-Digit Barcode</div>
        <div id="barcode12-render"></div>
        <div class="blur-overlay"><span class="tap-hint">Tap to reveal</span></div>
      </div>

      <div id="barcode16-card" class="barcode-card">
        <div class="label">16-Digit Barcode</div>
        <div id="barcode16-render"></div>
        <div class="blur-overlay"><span class="tap-hint">Tap to reveal</span></div>
      </div>
    </div>

    <div style="margin-top:24px;">
      <button id="archive-btn" class="btn-secondary">${voucher.isArchived ? 'Unarchive' : 'Archive'}</button>
      <a href="#/edit/${voucher.id}" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;" data-nav>Edit</a>
      <button id="delete-btn" class="btn-danger">Delete</button>
    </div>`;

  main.innerHTML = html;

  renderQR(document.getElementById('qr-render'), voucher.number16);
  renderBarcode(document.getElementById('barcode12-render'), voucher.number12);
  renderBarcode(document.getElementById('barcode16-render'), voucher.number16);

  setupBlurToggles();
  setupActions(id, voucher.isArchived);
}

function setupBlurToggles() {
  const cards = document.querySelectorAll('.barcode-card');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const wasUnblurred = card.classList.contains('unblurred');
      cards.forEach((c) => c.classList.remove('unblurred'));
      if (!wasUnblurred) {
        card.classList.add('unblurred');
      }
    });
  });
}

function setupActions(id, isArchived) {
  const archiveBtn = document.getElementById('archive-btn');
  archiveBtn?.addEventListener('click', async () => {
    try {
      await api.toggleArchive(id);
      await db.putVoucher(await api.fetchVoucher(id));
      showToast(isArchived ? 'Voucher unarchived' : 'Voucher archived');
      renderDetail({ id });
    } catch {
      showToast('Failed to toggle archive (offline?)');
    }
  });

  const deleteBtn = document.getElementById('delete-btn');
  deleteBtn?.addEventListener('click', () => {
    showConfirm(
      'Delete Voucher',
      'Are you sure you want to permanently delete this voucher? This cannot be undone.',
      () => {
        showConfirm(
          'Confirm Delete',
          'Really delete? This is permanent.',
          async () => {
            try {
              await api.deleteVoucherApi(id);
              await db.deleteVoucher(id);
              showToast('Voucher deleted');
              window.location.hash = '#/';
            } catch {
              showToast('Failed to delete (offline?)');
            }
          }
        );
      }
    );
  });
}

function formatDate(dateOnly) {
  if (!dateOnly) return '';
  const [y, m, d] = String(dateOnly).split('-');
  return `${m}/${d}/${y}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="cancel">Cancel</button>
        <button class="confirm">Confirm</button>
      </div>
    </div>`;

  overlay.querySelector('.cancel').onclick = () => overlay.remove();
  overlay.querySelector('.confirm').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}
