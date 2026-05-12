import * as React from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { itemRequests as seedRequests, type ItemRequest } from "@/lib/mock-data";
import { subscribeItemRequestsFromFirestore } from "@/lib/firestore-item-requests";

export type ItemRequestsContextValue = {
  requests: ItemRequest[];
  liveFromFirestore: number;
  loading: boolean;
  error: Error | null;
};

const ItemRequestsContext = React.createContext<ItemRequestsContextValue | null>(null);

export function ItemRequestsProvider({ children }: { children: React.ReactNode }) {
  const [live, setLive] = React.useState<ItemRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseConfigured) {
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);
    return subscribeItemRequestsFromFirestore(
      (rows) => {
        setLive(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLive([]);
        setLoading(false);
        setError(err);
      },
    );
  }, []);

  const requests = React.useMemo(() => {
    const ids = new Set(live.map((r) => r.id));
    const filler = seedRequests.filter((s) => !ids.has(s.id));
    return [...live, ...filler];
  }, [live]);

  const value = React.useMemo<ItemRequestsContextValue>(
    () => ({ requests, liveFromFirestore: live.length, loading, error }),
    [requests, live.length, loading, error],
  );

  return <ItemRequestsContext.Provider value={value}>{children}</ItemRequestsContext.Provider>;
}

export function useCampusItemRequests() {
  const ctx = React.useContext(ItemRequestsContext);
  if (!ctx) throw new Error("useCampusItemRequests must be used within ItemRequestsProvider");
  return ctx;
}
