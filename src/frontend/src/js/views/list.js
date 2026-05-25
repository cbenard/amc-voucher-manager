import * as db from '../db.js';
import { TYPE_CONFIG } from './home.js';

const TYPE_ICONS = Object.fromEntries(TYPE_CONFIG.map((t) => [t.type, t.icon]));

export async function renderList(params) {
  const main = document.getElementById('main-content');
  const title = document.getElementById('app-title');
  const type = params.type || 'ticket';

  const config = TYPE_CONFIG.find((t) => t.type === type);
  title.textContent = config ? config.label : 'Vouchers';

  const active = await db.getAllVouchers(type, false);
  active.sort((a, b) => {
    const d = new Date(a.dateAdded) - new Date(b.dateAdded);
    if (d !== 0) return d;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const archived = await db.getAllVouchers(type, true);
  const archivedOnly = archived.filter((v) => v.isArchived);
  archivedOnly.sort((a, b) => {
    const da = a.archivedDate ? new Date(a.archivedDate) : new Date(0);
    const dbd = b.archivedDate ? new Date(b.archivedDate) : new Date(0);
    return dbd - da;
  });

  let html = '';

  if (active.length === 0 && archivedOnly.length === 0) {
    html += `<div class="empty-state"><div class="icon">📭</div><p>No ${type} vouchers yet</p><a href="#/add" class="btn-primary" style="display:inline-block;text-decoration:none;margin-top:12px;padding:10px 24px;width:auto;" data-nav>Add One</a></div>`;
    main.innerHTML = html;
    return;
  }

  html += `<div class="voucher-list">`;

  for (const v of active) {
    html += renderCard(v, type);
  }

  if (archivedOnly.length > 0) {
    html += `
      <button class="archive-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('hidden')">
        <span>Archived (${archivedOnly.length})</span>
        <span class="arrow">&#9660;</span>
      </button>
      <div class="archived-list hidden">`;
    for (const v of archivedOnly) {
      html += renderCard(v, type, true);
    }
    html += `</div>`;
  }

  html += `</div>`;
  main.innerHTML = html;
}

function renderCard(v, type, isArchived = false) {
  const icon = TYPE_ICONS[type] || '🎫';
  const dateStr = formatDate(v.dateAdded);
  const notesPreview = v.notes
    ? v.notes.length > 80
      ? v.notes.slice(0, 80) + '...'
      : v.notes
    : '';
  const archiveLabel = isArchived && v.archivedDate ? `Archived ${formatDate(v.archivedDate)}` : '';

  return `
    <a href="#/voucher/${v.id}" class="voucher-card" data-nav>
      <div class="row">
        <span class="type-icon">${icon}</span>
        <span class="date">${dateStr}</span>
        ${archiveLabel ? `<span class="badge">${archiveLabel}</span>` : ''}
      </div>
      ${notesPreview ? `<div class="notes-preview">${escapeHtml(notesPreview)}</div>` : ''}
    </a>`;
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
