import * as db from '../db.js';

const TYPE_CONFIG = [
  { type: 'ticket', icon: '🎟️', label: 'Tickets' },
  { type: 'drink', icon: '🥤', label: 'Drinks' },
  { type: 'popcorn', icon: '🍿', label: 'Popcorn' },
];

export async function renderHome() {
  const main = document.getElementById('main-content');
  const title = document.getElementById('app-title');
  title.textContent = 'AMC Vouchers';

  let html = '<div class="type-grid">';
  for (const t of TYPE_CONFIG) {
    const count = await getActiveCount(t.type);
    html += `
      <a href="#/list/${t.type}" class="type-card" data-nav>
        <div class="icon">${t.icon}</div>
        <div class="label">${t.label}</div>
        <div class="count">${count}</div>
      </a>`;
  }
  html += '</div>';

  html += `<a href="#/add" class="btn-primary" style="display:block;text-align:center;text-decoration:none;margin-top:8px;" data-nav>+ Add Voucher</a>`;

  main.innerHTML = html;
}

async function getActiveCount(type) {
  const all = await db.getAllVouchers(type, false);
  return all.length;
}

export { TYPE_CONFIG };
