"use client";

import { useEffect, useState } from "react";
import { subscribeSyncState, initSyncWorker, type SyncState } from "@/lib/offline/sync";

export function useSyncIntegration(): SyncState {
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle", pending: 0, failed: 0 });

  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncState);
    initSyncWorker();
    return unsubscribe;
  }, []);

  return syncState;
}
