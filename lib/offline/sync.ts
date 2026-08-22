import { idbReadQueue, idbRemove, idbUpdate } from "./idb";
import type { OfflineOperation } from "./queue";

export type SyncStatus = "idle" | "syncing" | "synced" | "failed";

export interface SyncState {
  status: SyncStatus;
  pending: number;
  failed: number;
}

type SyncListener = (state: SyncState) => void;

const listeners = new Set<SyncListener>();
let currentState: SyncState = { status: "idle", pending: 0, failed: 0 };
let syncing = false;

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2000;

function getBackoffDelay(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, attempts), 60000);
}

function shouldRetry(op: OfflineOperation): boolean {
  return op.attempts < MAX_ATTEMPTS;
}

function notify() {
  listeners.forEach((fn) => fn(currentState));
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

async function processQueue(): Promise<void> {
  if (syncing) return;
  syncing = true;

  const queue = await idbReadQueue();
  if (queue.length === 0) {
    currentState = { status: "idle", pending: 0, failed: 0 };
    notify();
    syncing = false;
    return;
  }

  const retryable = queue.filter(shouldRetry);
  const exhausted = queue.filter((op) => !shouldRetry(op));

  if (retryable.length === 0) {
    currentState = { status: "failed", pending: 0, failed: exhausted.length };
    notify();
    syncing = false;
    return;
  }

  currentState = { status: "syncing", pending: retryable.length, failed: 0 };
  notify();

  let failed = 0;
  let remaining = 0;

  for (const op of retryable) {
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(op)
      });

      if (response.ok) {
        await idbRemove(op.id);
      } else {
        await idbUpdate({ ...op, attempts: op.attempts + 1 });
        failed++;
        remaining++;
      }
    } catch {
      await idbUpdate({ ...op, attempts: op.attempts + 1 });
      failed++;
      remaining++;
    }
  }

  currentState = {
    status: remaining === 0 ? "synced" : "failed",
    pending: remaining,
    failed: failed + exhausted.length
  };
  notify();
  syncing = false;

  if (remaining > 0 && remaining <= 3) {
    const maxAttempts = Math.max(...retryable.filter(shouldRetry).map((op) => op.attempts));
    setTimeout(() => { if (navigator.onLine) processQueue(); }, getBackoffDelay(maxAttempts));
  }
}

export async function triggerSync(): Promise<void> {
  await processQueue();
}

export async function getPendingCount(): Promise<number> {
  const queue = await idbReadQueue();
  return queue.length;
}

export function initSyncWorker(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    processQueue();
  });

  setInterval(() => {
    if (navigator.onLine) {
      processQueue();
    }
  }, 30000);
}

export { getBackoffDelay, shouldRetry, MAX_ATTEMPTS };
