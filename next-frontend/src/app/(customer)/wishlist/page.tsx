"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wishlistService } from "@/services/wishlistService";

type WishlistItem = {
  id: number;
  product_id: number;
  variant_id: number | null;
  sku?: string;
  name?: string;
  thumbnail?: string | null;
  variant_label?: string | null;
  configuration?: Record<string, unknown> | null;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    // Mock wishlist data
    setItems([
      { id: 1, product_id: 1, variant_id: 1, sku: 'ELV-1001', name: 'Diamond Solitaire Ring', variant_label: '18K Yellow Gold' },
      { id: 2, product_id: 2, variant_id: 2, sku: 'ELV-1002', name: 'Gold Tennis Bracelet', variant_label: '22K Gold' },
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeItem = async (item: WishlistItem) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
  };

  const moveToCart = async (item: WishlistItem) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
  };

  const isEmpty = items.length === 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
        <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Wishlist</h1>
              <p className="mt-2 text-sm text-slate-500">
                Keep track of designs you love and move them to the quotation
                list when you&apos;re ready.
              </p>
            </div>
            {!isEmpty && (
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
              >
                Browse more products
              </Link>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-sm text-slate-500">
              <p>
                Your wishlist is empty. Add favourites while browsing the
                catalogue.
              </p>
              <Link
                href="/catalog"
                className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
              >
                Explore catalogue
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                >
                  <Link
                    href={`/catalog/${item.product_id}`}
                    className="relative block aspect-square overflow-hidden bg-slate-100"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name ?? "Product image"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                        <span className="text-lg font-semibold">
                          {item.name ?? "Product"}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex-1">
                      <Link href={`/catalog/${item.product_id}`} className="block">
                        <h3 className="text-base font-semibold text-slate-900 transition hover:text-feather-gold line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      {item.variant_label && (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {item.variant_label}
                        </p>
                      )}
                      {item.sku && (
                        <p className="mt-1 text-xs text-slate-400">
                          SKU {item.sku}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveToCart(item)}
                        className="flex-1 rounded-lg bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-elvee-blue/30 transition hover:bg-navy"
                      >
                        Move to quotations
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Remove from wishlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="h-4 w-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
  );
}

