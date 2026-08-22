import { idbReadQueue, idbEnqueue, idbRemove, idbUpdate } from "./idb";

export type OfflineOperationKind =
  | "cash_sale"
  | "customer_update"
  | "table_update"
  | "inventory_note";

export interface OfflineOperation<T = unknown> {
  id: string;
  kind: OfflineOperationKind;
  payload: T;
  createdAt: string;
  attempts: number;
}

const KEY = "emd-offline-operations-v1";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readLocalStorageQueue(): OfflineOperation[] {
  const storage = browserStorage();
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(KEY) ?? "[]") as OfflineOperation[];
  } catch {
    return [];
  }
}

function writeLocalStorageQueue(queue: OfflineOperation[]): void {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(KEY, JSON.stringify(queue));
}

async function isIdbAvailable(): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    await idbReadQueue();
    return true;
  } catch {
    return false;
  }
}

export async function readOfflineQueue(): Promise<OfflineOperation[]> {
  if (await isIdbAvailable()) {
    try {
      return await idbReadQueue();
    } catch {
      // Fall back to localStorage
    }
  }
  return readLocalStorageQueue();
}

export async function enqueueOfflineOperation<T>(
  kind: OfflineOperationKind,
  payload: T,
  id = crypto.randomUUID()
): Promise<OfflineOperation<T>> {
  const operation: OfflineOperation<T> = {
    id,
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0
  };

  if (await isIdbAvailable()) {
    try {
      await idbEnqueue(operation);
      return operation;
    } catch {
      // Fall back to localStorage
    }
  }

  const queue = readLocalStorageQueue();
  if (!queue.some((item) => item.id === operation.id)) {
    writeLocalStorageQueue([...queue, operation]);
  }
  return operation;
}

export async function markOfflineOperationDone(id: string): Promise<void> {
  if (await isIdbAvailable()) {
    try {
      await idbRemove(id);
      return;
    } catch {
      // Fall back to localStorage
    }
  }
  writeLocalStorageQueue(readLocalStorageQueue().filter((item) => item.id !== id));
}

export async function incrementOfflineAttempt(id: string): Promise<void> {
  if (await isIdbAvailable()) {
    try {
      const queue = await idbReadQueue();
      const op = queue.find((item) => item.id === id);
      if (op) {
        await idbUpdate({ ...op, attempts: op.attempts + 1 });
      }
      return;
    } catch {
      // Fall back to localStorage
    }
  }
  const queue = readLocalStorageQueue().map((item) =>
    item.id === id ? { ...item, attempts: item.attempts + 1 } : item
  );
  writeLocalStorageQueue(queue);
}
