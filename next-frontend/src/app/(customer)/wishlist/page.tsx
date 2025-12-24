"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { frontendService } from "@/services/frontendService";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { route } from "@/utils/route";

type WishlistItem = {
  id: string | number;
  product_id: string | number;
  variant_id: string | number | null;
  sku?: string | null;
  name?: string | null;
  thumbnail?: string | null;
  variant_label?: string | null;
  configuration?: Record<string, unknown> | null;
};

export default function WishlistPage() {
  const { refreshWishlist, removeProductId } = useWishlist();
  const { refreshCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItems, setBusyItems] = useState<Set<string | number>>(new Set());
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper function to get media URL (matching catalog page implementation)
  const getMediaUrl = useCallback((url: string | null | undefined): string | null => {
    if (!url) return null;
    
    // Normalize double slashes (except after http:// or https://)
    // This handles cases where URL might be /storage//storage/path
    let cleanUrl = String(url).replace(/(?<!:)\/{2,}/g, '/');
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    // Backend serves static files at root level, so /storage/ paths are accessible directly
    // The backend returns URLs like /storage/path/to/file.jpg
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    // Ensure URL starts with / for proper path construction
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = `/${cleanUrl}`;
    }
    return `${baseUrl}${cleanUrl}`;
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await frontendService.getWishlist();
      
      if (response.data && response.data.items) {
        // Convert string IDs to numbers and format thumbnail URLs
        const formattedItems = response.data.items.map((item: any) => {
          // Process thumbnail URL - backend returns /storage/... format
          // Convert to full URL for frontend display
          let thumbnailUrl: string | null = null;
          if (item.thumbnail) {
            // Backend returns URLs like /storage/path/to/file.jpg
            // Convert to full URL: http://localhost:3001/storage/path/to/file.jpg
            thumbnailUrl = getMediaUrl(item.thumbnail);
          }
          
          return {
            ...item,
            id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
            product_id: typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id,
            variant_id: item.variant_id ? (typeof item.variant_id === 'string' ? parseInt(item.variant_id) : item.variant_id) : null,
            thumbnail: thumbnailUrl,
          };
        });
        setItems(formattedItems);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setError('Failed to load wishlist. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeItem = async (item: WishlistItem) => {
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    
    if (busyItems.has(itemId)) return;
    
    try {
      setBusyItems(prev => new Set(prev).add(itemId));
      await frontendService.removeFromWishlist(itemId);
      
      // Get product ID before updating state
      const productId = items.find((i) => {
        const id = typeof i.id === 'string' ? parseInt(i.id) : i.id;
        return id === itemId;
      })?.product_id;
      
      // Optimistically update UI
      setItems((prevItems) => prevItems.filter((i) => {
        const id = typeof i.id === 'string' ? parseInt(i.id) : i.id;
        return id !== itemId;
      }));
      
      // Update context (outside state updater to avoid React error)
      if (productId) {
        const pid = typeof productId === 'string' ? parseInt(productId) : productId;
        removeProductId(pid);
      }
      
      // Refresh wishlist count
      refreshWishlist();
      
      setFlashMessage({ type: 'success', message: 'Removed from wishlist.' });
      setTimeout(() => setFlashMessage(null), 3000);
    } catch (err: any) {
      console.error('Error removing item:', err);
      setFlashMessage({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to remove item. Please try again.' 
      });
      setTimeout(() => setFlashMessage(null), 3000);
    } finally {
      setBusyItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const moveToCart = async (item: WishlistItem) => {
    const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
    
    if (busyItems.has(itemId)) return;
    
    try {
      setBusyItems(prev => new Set(prev).add(itemId));
      await frontendService.moveToCart(itemId, 1);
      
      // Get product ID before updating state
      const productId = items.find((i) => {
        const id = typeof i.id === 'string' ? parseInt(i.id) : i.id;
        return id === itemId;
      })?.product_id;
      
      // Optimistically update UI
      setItems((prevItems) => prevItems.filter((i) => {
        const id = typeof i.id === 'string' ? parseInt(i.id) : i.id;
        return id !== itemId;
      }));
      
      // Update context (outside state updater to avoid React error)
      if (productId) {
        const pid = typeof productId === 'string' ? parseInt(productId) : productId;
        removeProductId(pid);
      }
      
      // Refresh wishlist count
      refreshWishlist();
      
      // Refresh cart count (item was moved to cart)
      refreshCart();
      
      setFlashMessage({ type: 'success', message: 'Moved to your quotation list.' });
      setTimeout(() => setFlashMessage(null), 3000);
    } catch (err: any) {
      console.error('Error moving to cart:', err);
      setFlashMessage({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to move item to cart. Please try again.' 
      });
      setTimeout(() => setFlashMessage(null), 3000);
    } finally {
      setBusyItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
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
        {flashMessage && (
          <div
            className={`rounded-lg border p-4 ${
              flashMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{flashMessage.message}</p>
              <button
                onClick={() => setFlashMessage(null)}
                className="ml-4 text-current opacity-70 hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
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
        )}

        <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Wishlist</h1>
              <p className="mt-2 text-sm text-slate-500">
                Keep track of designs you love and move them to the quotation list when you&apos;re ready.
              </p>
            </div>
            {!isEmpty && (
              <Link
                href={route('frontend.catalog.index')}
                className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
              >
                Browse more products
              </Link>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-sm text-rose-600">
              <p>{error}</p>
              <button
                onClick={fetchWishlist}
                className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
              >
                Try again
              </button>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-sm text-slate-500">
              <p>
                Your wishlist is empty. Add favourites while browsing the catalogue.
              </p>
              <Link
                href={route('frontend.catalog.index')}
                className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
              >
                Explore catalogue
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => {
                const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
                const productId = typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id;
                const isBusy = busyItems.has(itemId);
                // Thumbnail is already processed in fetchWishlist, use directly
                const thumbnailUrl = item.thumbnail;

                return (
                  <article
                    key={itemId}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                  >
                    <Link
                      href={route('frontend.catalog.show', productId)}
                      className="relative block aspect-square overflow-hidden bg-slate-100"
                    >
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={item.name ?? "Product image"}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          onError={(e) => {
                            // Fallback to placeholder on error
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                                  <span class="text-lg font-semibold">${item.name ?? 'Product'}</span>
                                </div>
                              `;
                            }
                          }}
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
                        <Link href={route('frontend.catalog.show', productId)} className="block">
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
                          disabled={isBusy}
                          className="flex-1 rounded-lg bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-elvee-blue/30 transition hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBusy ? 'Moving...' : 'Move to quotations'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={isBusy}
                          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
