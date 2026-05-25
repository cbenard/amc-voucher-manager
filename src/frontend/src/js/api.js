import * as signalR from '@microsoft/signalr';

const BASE = '/api/vouchers';
let csrfToken = null;

let hubConnection = null;
let onVoucherCreated = null;
let onVoucherUpdated = null;
let onVoucherArchived = null;
let onVoucherDeleted = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/antiforgery/token');
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.token;
    }
  } catch {
    console.warn('Failed to fetch CSRF token');
  }
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken) {
    headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return headers;
}

async function mutateRequest(url, options) {
  if (!csrfToken) {
    await fetchCsrfToken();
  }
  options.headers = authHeaders();
  let res = await fetch(url, options);
  if (res.status === 400) {
    await fetchCsrfToken();
    if (csrfToken) {
      options.headers = authHeaders();
      res = await fetch(url, options);
    }
  }
  return res;
}

export async function connectHub(callbacks) {
  onVoucherCreated = callbacks.onVoucherCreated;
  onVoucherUpdated = callbacks.onVoucherUpdated;
  onVoucherArchived = callbacks.onVoucherArchived;
  onVoucherDeleted = callbacks.onVoucherDeleted;

  hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/vouchers')
    .withAutomaticReconnect()
    .build();

  hubConnection.on('VoucherCreated', (v) => onVoucherCreated?.(v));
  hubConnection.on('VoucherUpdated', (v) => onVoucherUpdated?.(v));
  hubConnection.on('VoucherArchived', (v) => onVoucherArchived?.(v));
  hubConnection.on('VoucherDeleted', (id) => onVoucherDeleted?.(id));

  try {
    await hubConnection.start();
    console.log('SignalR connected');
  } catch (err) {
    console.warn('SignalR connection failed, will retry', err);
    setTimeout(() => connectHub(callbacks), 5000);
  }

  hubConnection.onreconnected(() => {
    console.log('SignalR reconnected');
  });
}

export async function fetchVouchers(type, includeArchived) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (includeArchived) params.set('includeArchived', 'true');

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch vouchers');
  return res.json();
}

export async function fetchVoucher(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch voucher');
  return res.json();
}

export async function createVoucher(data) {
  const res = await mutateRequest(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Duplicate voucher');
  }
  if (!res.ok) throw new Error('Failed to create voucher');
  return res.json();
}

export async function updateVoucher(id, data) {
  const res = await mutateRequest(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update voucher');
  return res.json();
}

export async function toggleArchive(id) {
  const res = await mutateRequest(`${BASE}/${id}/archive`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to toggle archive');
  return res.json();
}

export async function deleteVoucherApi(id) {
  const res = await mutateRequest(`${BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete voucher');
}

export function isOnline() {
  return navigator.onLine;
}
