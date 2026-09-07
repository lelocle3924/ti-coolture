import { useCallback, useEffect, useState } from "react";
import { getOrCreateUserProfile, toggleWishlist } from "./dbService";
import { useAuth } from "./useAuth";

/* ═══════════════════════════════════════════════════════════════════════════
   What this visitor has saved — one source, three readers.

   The set is needed in three places at once now: the heart on a product card
   (/products), the count on the nav's saved-items button, and the list on
   /wishlist. Reading it straight off `profile` works for none of them,
   because the site is normally met signed out: AuthProvider's refreshProfile()
   returns early with no user, so `profile` is null and stays null.

   The guest therefore gets a real row, "guest_user", the same shape as anyone
   else's. That is what makes a save survive a reload, and what leaves
   something to migrate if the visitor later signs in.

   Changes are published to every mounted reader, because the writer and the
   readers are on different pages: saving on /products has to move the nav's
   count immediately, and un-saving on /wishlist has to move it back. The
   store underneath is synchronous localStorage, so a subscription is enough —
   there is nothing to poll.
   ═══════════════════════════════════════════════════════════════════════════ */

export const GUEST_ID = "guest_user";
export const GUEST_EMAIL = "guest@local";

/** Mounted readers, notified whenever the saved set changes. */
const listeners = new Set<(ids: string[]) => void>();

function publish(ids: string[]) {
  for (const listener of listeners) listener(ids);
}

export interface SavedProducts {
  /** Product ids, in the order they were saved. */
  ids: string[];
  /** False until the row has been read once, so a count never flashes 0. */
  ready: boolean;
  has: (productId: string) => boolean;
  /** Adds or removes, and returns whether the product is saved afterwards. */
  toggle: (productId: string) => Promise<boolean>;
}

export function useSavedProducts(): SavedProducts {
  const { user, profile, refreshProfile } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const rowId = user?.uid || GUEST_ID;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (profile) {
        if (!cancelled) {
          setIds(profile.wishlist ?? []);
          setReady(true);
        }
        return;
      }
      const guest = await getOrCreateUserProfile(GUEST_ID, GUEST_EMAIL);
      if (!cancelled) {
        setIds(guest.wishlist ?? []);
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  /* Every mounted reader follows every write, whichever page made it. */
  useEffect(() => {
    const listener = (next: string[]) => setIds(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggle = useCallback(
    async (productId: string) => {
      const next = await toggleWishlist(rowId, productId);
      publish(next);
      // keeps `profile` in step for the pages that still read it directly
      if (user) await refreshProfile();
      return next.includes(productId);
    },
    [rowId, user, refreshProfile]
  );

  return {
    ids,
    ready,
    has: (productId: string) => ids.includes(productId),
    toggle,
  };
}
