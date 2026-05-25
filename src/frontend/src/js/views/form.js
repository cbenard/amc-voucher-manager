import * as db from '../db.js';
import * as api from '../api.js';
import { openScanner } from '../scanner.js';
import { TYPE_CONFIG } from './home.js';

export async function renderForm(params) {
  const main = document.getElementById('main-content');
  const title = document.getElementById('app-title');

  const editId = params?.id;
  const isEdit = !!editId;

  let voucher = null;
  if (isEdit) {
    voucher = await db.getVoucher(editId);
    if (!voucher) {
      main.innerHTML = `<div class="empty-state"><p>Voucher not found</p></div>`;
      return;
    }
    title.textContent = 'Edit Voucher';
  } else {
    title.textContent = 'Add Voucher';
  }

  const today = new Date().toISOString().split('T')[0];

  let html = `
    <form id="voucher-form">
      <div class="type-tabs" id="type-tabs">`;

  for (const t of TYPE_CONFIG) {
    const selected = voucher?.type?.toLowerCase() === t.type || (!voucher && t.type === 'ticket');
    html += `
      <button type="button" class="type-tab ${selected ? 'active' : ''}" data-type="${t.type}">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.label}</span>
      </button>`;
  }

  html += `
      </div>

      <input type="hidden" name="type" id="input-type" value="${voucher?.type || 'Ticket'}" />

      <div class="form-group">
        <label>12-Digit Number</label>
        <input type="text" name="number12" id="input-number12" value="${escapeAttr(voucher?.number12 || '')}" maxlength="12" pattern="[0-9]*" inputmode="numeric" required />
        <button type="button" class="scan-btn" data-target="number12">&#128247; Scan Barcode</button>
      </div>

      <div class="form-group">
        <label>16-Digit Number</label>
        <input type="text" name="number16" id="input-number16" value="${escapeAttr(voucher?.number16 || '')}" maxlength="16" pattern="[0-9]*" inputmode="numeric" required />
        <button type="button" class="scan-btn" data-target="number16">&#128247; Scan Barcode</button>
      </div>

      <div class="form-group">
        <label>Date Added</label>
        <input type="date" name="dateAdded" id="input-dateAdded" value="${voucher?.dateAdded || today}" />
      </div>

      <div class="form-group" id="notes-group">
        <div id="notes-toggle-area" class="${voucher?.notes ? 'hidden' : ''}">
          <button type="button" class="notes-toggle" id="show-notes-btn">+ Add notes</button>
        </div>
        <div id="notes-input-area" class="${voucher?.notes ? '' : 'hidden'}">
          <label>Notes</label>
          <textarea name="notes" id="input-notes">${escapeAttr(voucher?.notes || '')}</textarea>
        </div>
      </div>

      <button type="submit" class="btn-primary">${isEdit ? 'Save Changes' : 'Add Voucher'}</button>
    </form>`;

  if (isEdit) {
    html += `<a href="#/voucher/${editId}" class="btn-secondary" style="display:block;text-align:center;text-decoration:none;margin-top:8px;" data-nav>Cancel</a>`;
  }

  main.innerHTML = html;

  setupForm(editId);
}

function setupForm(editId) {
  const tabs = document.querySelectorAll('.type-tab');
  const typeInput = document.getElementById('input-type');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      typeInput.value = capitalize(tab.dataset.type);
    });
  });

  document.getElementById('show-notes-btn')?.addEventListener('click', () => {
    document.getElementById('notes-toggle-area').classList.add('hidden');
    document.getElementById('notes-input-area').classList.remove('hidden');
  });

  document.querySelectorAll('.scan-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      openScanner((code) => {
        document.getElementById(`input-${targetId}`).value = code;
      });
    });
  });

  document.getElementById('voucher-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      type: document.getElementById('input-type').value,
      number12: document.getElementById('input-number12').value.trim(),
      number16: document.getElementById('input-number16').value.trim(),
      notes: document.getElementById('input-notes').value.trim() || null,
      dateAdded: document.getElementById('input-dateAdded').value || null,
    };

    if (!formData.number12 || !formData.number16) {
      showToast('Please enter both numbers');
      return;
    }

    try {
      if (editId) {
        if (api.isOnline()) {
          const updated = await api.updateVoucher(editId, {
            type: formData.type,
            number12: formData.number12,
            number16: formData.number16,
            notes: formData.notes,
            dateAdded: formData.dateAdded,
          });
          await db.putVoucher(updated);
        } else {
          await db.putVoucher({ ...formData, id: editId, updatedAt: new Date().toISOString() });
          await db.addPendingChange({ action: 'update', id: editId, data: formData });
        }
        showToast('Voucher updated');
        window.location.hash = `#/voucher/${editId}`;
      } else {
        if (api.isOnline()) {
          const created = await api.createVoucher(formData);
          await db.putVoucher(created);
          showToast('Voucher added');
          window.location.hash = `#/voucher/${created.id}`;
        } else {
          const tempId = crypto.randomUUID();
          const voucher = {
            id: tempId,
            type: formData.type,
            number12: formData.number12,
            number16: formData.number16,
            notes: formData.notes,
            dateAdded: formData.dateAdded,
            isArchived: false,
            archivedDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await db.putVoucher(voucher);
          await db.addPendingChange({ action: 'create', data: formData });
          showToast('Voucher added (offline, will sync)');
          window.location.hash = `#/voucher/${tempId}`;
        }
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
