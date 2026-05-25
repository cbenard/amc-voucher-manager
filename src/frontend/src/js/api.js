import * as signalR from '@microsoft/signalr';

const BASE = '/api/vouchers';

let hubConnection = null;
let onVoucherCreated = null;
let onVoucherUpdated = null;
let onVoucherArchived = null;
let onVoucherDeleted = null;

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
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create voucher');
  const voucher = await res.json();
  await hubConnection?.invoke('NotifyCreated', voucher).catch(() => {});
  return voucher;
}

export async function updateVoucher(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update voucher');
  const voucher = await res.json();
  await hubConnection?.invoke('NotifyUpdated', voucher).catch(() => {});
  return voucher;
}

export async function toggleArchive(id) {
  const res = await fetch(`${BASE}/${id}/archive`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to toggle archive');
  const voucher = await res.json();
  await hubConnection?.invoke('NotifyArchived', voucher).catch(() => {});
  return voucher;
}

export async function deleteVoucherApi(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete voucher');
  await hubConnection?.invoke('NotifyDeleted', id).catch(() => {});
}

export function isOnline() {
  return navigator.onLine;
}
