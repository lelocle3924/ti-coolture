import { useCallback, useEffect, useState } from "react";
import { getOrCreateUserProfile, toggleFollowShop } from "./dbService";
import { useAuth } from "./useAuth";

export const GUEST_ID = "guest_user";
export const GUEST_EMAIL = "guest@local";

const listeners = new Set<(ids: string[]) => void>();

function publish(ids: string[]) {
  for (const listener of listeners) listener(ids);
}

export interface SavedStores {
  ids: string[];
  ready: boolean;
  has: (storeId: string) => boolean;
  toggle: (storeId: string) => Promise<boolean>;
}

export function useSavedStores(): SavedStores {
  const { user, profile, refreshProfile } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const rowId = user?.uid || GUEST_ID;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (profile) {
        if (!cancelled) {
          setIds(profile.followedShops ?? []);
          setReady(true);
        }
        return;
      }
      const guest = await getOrCreateUserProfile(GUEST_ID, GUEST_EMAIL);
      if (!cancelled) {
        setIds(guest.followedShops ?? []);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    const listener = (next: string[]) => setIds(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggle = useCallback(
    async (storeId: string) => {
      const next = await toggleFollowShop(rowId, storeId);
      publish(next);
      if (user) await refreshProfile();
      return next.includes(storeId);
    },
    [rowId, user, refreshProfile]
  );

  return {
    ids,
    ready,
    has: (storeId: string) => ids.includes(storeId),
    toggle,
  };
}
