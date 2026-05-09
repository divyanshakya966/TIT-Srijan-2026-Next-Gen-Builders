import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { firestoreDocToProduct } from "@/lib/firestore-listings";
import { products as seedProducts, type Category, type Product } from "@/lib/mock-data";

export const PRODUCT_CATEGORIES: Category[] = [
  "Books",
  "Gadgets",
  "Notes",
  "Electronics",
  "Cycles",
  "Hostel Essentials",
  "Lab Equipment",
  "Furniture",
];

const CATEGORY_ORDER = PRODUCT_CATEGORIES;

export function categorySummaries(products: Product[]): { name: Category; count: number }[] {
  return CATEGORY_ORDER.map((name) => ({
    name,
    count: products.filter((p) => p.category === name).length,
  }));
}

export type CatalogContextValue = {
  products: Product[];
  loading: boolean;
  firestoreLinked: boolean;
};

const CatalogContext = React.createContext<CatalogContextValue | null>(null);

function mergeCatalog(seed: Product[], fromFs: Product[]): Product[] {
  const map = new Map(seed.map((p) => [p.id, p]));
  for (const p of fromFs) {
    map.set(p.id, p);
  }
  return Array.from(map.values());
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [fromFs, setFromFs] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [firestoreLinked, setFirestoreLinked] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined" || !isFirebaseConfigured) {
      setLoading(false);
      setFirestoreLinked(false);
      return undefined;
    }

    const unsub = onSnapshot(
      collection(db, "listings"),
      (snap) => {
        const next: Product[] = [];
        snap.forEach((docSnap) => {
          const p = firestoreDocToProduct(docSnap.id, docSnap.data() as Record<string, unknown>);
          if (p) next.push(p);
        });
        setFromFs(next);
        setLoading(false);
        setFirestoreLinked(true);
      },
      (err) => {
        console.error(err);
        setFromFs([]);
        setLoading(false);
        setFirestoreLinked(false);
      },
    );

    return unsub;
  }, []);

  const products = React.useMemo(() => mergeCatalog(seedProducts, fromFs), [fromFs]);

  const value = React.useMemo(
    () => ({ products, loading, firestoreLinked }),
    [products, loading, firestoreLinked],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = React.useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
