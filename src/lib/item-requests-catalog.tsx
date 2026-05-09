import * as React from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { itemRequests as seedRequests, type ItemRequest } from "@/lib/mock-data";
import { subscribeItemRequestsFromFirestore } from "@/lib/firestore-item-requests";

export type ItemRequestsContextValue = {
  requests: ItemRequest[];
  liveFromFirestore: number;
};

const ItemRequestsContext = React.createContext<ItemRequestsContextValue | null>(null);

export function ItemRequestsProvider({ children }: { children: React.ReactNode }) {
  const [live, setLive] = React.useState<ItemRequest[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseConfigured) return undefined;
    return subscribeItemRequestsFromFirestore(setLive);
  }, []);

  const requests = React.useMemo(() => {
    const ids = new Set(live.map((r) => r.id));
    const filler = seedRequests.filter((s) => !ids.has(s.id));
    return [...live, ...filler];
  }, [live]);

  const value = React.useMemo<ItemRequestsContextValue>(
    () => ({ requests, liveFromFirestore: live.length }),
    [requests, live.length],
  );

  return <ItemRequestsContext.Provider value={value}>{children}</ItemRequestsContext.Provider>;
}

export function useCampusItemRequests() {
  const ctx = React.useContext(ItemRequestsContext);
  if (!ctx) throw new Error("useCampusItemRequests must be used within ItemRequestsProvider");
  return ctx;
}
