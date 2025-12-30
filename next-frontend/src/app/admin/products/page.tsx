"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { toastSuccess, toastError, toastInfo, toastWarning } from "@/utils/toast";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";

type Product = {
  id: number;
  name: string;
  sku: string;
  is_active: boolean;
  brand?: { name: string } | null;
  category?: { name: string } | null;
  variants_count: number;
};

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    products: { 
      data: [], 
      meta: { 
        current_page: 1, 
        last_page: 1, 
        total: 0, 
        per_page: 5,
        from: 0,
        to: 0,
        links: []
      } 
    },
    brands: {},
    categories: [],
    filters: {},
    perPageOptions: [10, 20, 50, 100],
    perPage: 10,
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [filterState, setFilterState] = useState({
    search: "",
    brand: "all",
    category: "all",
    status: "all",
    page: 1,
    per_page: 10,
  });

  const [bulkBrand, setBulkBrand] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");

  // Toast notifications are handled via RTK
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters: any = {
        page: filterState.page,
        per_page: filterState.per_page,
      };
      if (filterState.search) filters.search = filterState.search;
      if (filterState.brand !== 'all') filters.brand_id = parseInt(filterState.brand);
      if (filterState.category !== 'all') filters.category_id = parseInt(filterState.category);
      if (filterState.status !== 'all') filters.status = filterState.status;

      const response = await adminService.getProducts(filters);
      const productsData = response.data.items || response.data.data || [];
      const rawMeta = response.data.meta || {};
      
      // Map backend response (camelCase) to frontend format (snake_case)
      const meta = {
        current_page: rawMeta.current_page || rawMeta.page || 1,
        last_page: rawMeta.last_page || rawMeta.lastPage || (rawMeta.total && rawMeta.perPage ? Math.ceil(rawMeta.total / rawMeta.perPage) : 1),
        total: rawMeta.total || 0,
        per_page: rawMeta.per_page || rawMeta.perPage || filterState.per_page,
        from: rawMeta.from,
        to: rawMeta.to,
        links: rawMeta.links,
      };

      // Calculate last_page if not provided but we have total and per_page
      if (!meta.last_page && meta.total > 0 && meta.per_page > 0) {
        meta.last_page = Math.ceil(meta.total / meta.per_page);
      }

      // Generate pagination links using common utility
      const currentPage = meta.current_page;
      const lastPage = meta.last_page;
      const links = meta.links || generatePaginationLinks(currentPage, lastPage);

      // Fetch brands and categories for filters
      const [brandsResponse, categoriesResponse] = await Promise.all([
        adminService.getBrands(1, 100).catch(() => ({ data: { items: [] } })),
        adminService.getCategories(1, 100).catch(() => ({ data: { items: [] } })),
      ]);

      const brandsMap: Record<string, string> = {};
      (brandsResponse.data.items || []).forEach((brand: any) => {
        brandsMap[brand.id] = brand.name;
      });

      setData({
        products: {
          data: productsData,
          meta: {
            current_page: meta.current_page,
            last_page: meta.last_page,
            total: meta.total,
            per_page: meta.per_page,
            from: meta.from ?? (meta.current_page > 1 ? (meta.current_page - 1) * meta.per_page + 1 : (meta.total > 0 ? 1 : 0)),
            to: meta.to ?? Math.min(meta.current_page * meta.per_page, meta.total),
            links: links,
          },
        },
        brands: brandsMap,
        categories: categoriesResponse.data.items || [],
        filters: {},
        perPageOptions: [10, 20, 50, 100],
        perPage: filterState.per_page,
      });
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toastError(error.response?.data?.message || "Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterState]);

  const allSelected = useMemo(() => {
    if (data.products.data.length === 0) return false;
    return selectedProducts.length === data.products.data.length;
  }, [data.products.data, selectedProducts]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(data.products.data.map((p: any) => p.id));
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const applyFilters = (next: Partial<typeof filterState>) => {
    setFilterState((prev) => ({ ...prev, ...next, page: 1 }));
  };

  const ensureSelection = (callback: () => void) => {
    if (selectedProducts.length === 0) {
      toastWarning("Select at least one product first.");
      return;
    }
    callback();
  };

  const bulkDelete = () => {
    ensureSelection(() => {
      setConfirmModal({
        show: true,
        title: "Delete Products",
        message: `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await adminService.bulkDeleteProducts(selectedProducts);
            setSelectedProducts([]);
            await fetchProducts();
            setConfirmModal({
              show: false,
              title: "",
              message: "",
              onConfirm: () => {},
            });
          } catch (error: any) {
            toastError(error.response?.data?.message || "Failed to delete products. Please try again.");
          }
        },
      });
    });
  };

  const bulkStatus = (action: "activate" | "deactivate") => {
    ensureSelection(async () => {
      try {
        await adminService.bulkUpdateProductStatus(selectedProducts, action === 'activate');
        setSelectedProducts([]);
        await fetchProducts();
      } catch (error: any) {
        toastError(error.response?.data?.message || "Failed to update product status. Please try again.");
      }
    });
  };

  // Note: Bulk assign brand/category not available in API yet
  const bulkAssignBrand = () => {
    ensureSelection(async () => {
      if (!bulkBrand) {
        toastWarning("Select a brand to assign.");
        return;
      }
      toastInfo("Bulk brand assignment is not yet available in the API.");
    });
  };

  const bulkAssignCategory = () => {
    ensureSelection(async () => {
      if (!bulkCategory) {
        toastWarning("Select a category to assign.");
        return;
      }
      toastInfo("Bulk category assignment is not yet available in the API.");
    });
  };

  const duplicateProduct = async (id: number) => {
    try {
      await adminService.copyProduct(id);
      await fetchProducts();
      toastSuccess("Product duplicated successfully.");
    } catch (error: any) {
      toastError(error.response?.data?.message || "Failed to duplicate product. Please try again.");
    }
  };

  const deleteProduct = (id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Product",
      message:
        "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await adminService.deleteProduct(id);
          await fetchProducts();
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: () => {},
          });
        } catch (error: any) {
          toastError(error.response?.data?.message || "Failed to delete product. Please try again.");
        }
      },
    });
  };

  const changePage = (page: number) => {
    setFilterState((prev) => ({ ...prev, page }));
  };

  const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState((prev) => ({ ...prev, per_page: parseInt(event.target.value), page: 1 }));
  };

  if (loading && !data.products.data.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
        <section className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Products</h1>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
              <input
                type="search"
                value={filterState.search}
                onChange={(event) => applyFilters({ search: event.target.value })}
                placeholder="Search SKU or name"
                className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
              />
              <select
                value={filterState.brand}
                onChange={(event) => applyFilters({ brand: event.target.value })}
                className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
              >
                <option value="all">All brands</option>
                {Object.entries(data.brands).map(([id, name]: any) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={filterState.category}
                onChange={(event) =>
                  applyFilters({ category: event.target.value })
                }
                className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
              >
                <option value="all">All categories</option>
                {data.categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={filterState.status}
                onChange={(event) => applyFilters({ status: event.target.value })}
                className="w-full sm:w-auto rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            {selectedProducts.length} selected
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => bulkStatus("activate")}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-emerald-200 px-2.5 py-1 sm:px-3 text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => bulkStatus("deactivate")}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-amber-200 px-2.5 py-1 sm:px-3 text-amber-600 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Disable
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={bulkBrand}
                onChange={(event) => setBulkBrand(event.target.value)}
                className="rounded-xl sm:rounded-2xl border border-slate-200 px-2 py-1 sm:px-3 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
              >
                <option value="">Assign brand…</option>
                {Object.entries(data.brands).map(([id, name]: any) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={bulkAssignBrand}
                className="rounded-full border border-slate-200 px-2 py-1 sm:px-3 text-xs sm:text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={bulkCategory}
                onChange={(event) => setBulkCategory(event.target.value)}
                className="rounded-xl sm:rounded-2xl border border-slate-200 px-2 py-1 sm:px-3 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
              >
                <option value="">Assign category…</option>
                {data.categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={bulkAssignCategory}
                className="rounded-full border border-slate-200 px-2 py-1 sm:px-3 text-xs sm:text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-rose-200 px-2.5 py-1 sm:px-3 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v14M5 12h14"
                />
              </svg>
              New product
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                      aria-label="Select all products"
                    />
                  </th>
                  <th className="px-3 py-2 text-left sm:px-6 sm:py-3">SKU</th>
                  <th className="px-3 py-2 text-left sm:px-6 sm:py-3">Product</th>
                  <th className="px-3 py-2 text-left hidden md:table-cell sm:px-6 sm:py-3">Brand</th>
                  <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-6 sm:py-3">Category</th>
                  <th className="px-3 py-2 text-left hidden md:table-cell sm:px-6 sm:py-3">Variants</th>
                  <th className="px-3 py-2 text-left sm:px-6 sm:py-3">Status</th>
                  <th className="px-3 py-2 text-right sm:px-6 sm:py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.products.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 sm:px-6 sm:py-10 text-center text-xs sm:text-sm text-slate-500"
                    >
                      No products found. Start by adding your hero collections.
                    </td>
                  </tr>
                ) : (
                  data.products.data.map((product: any) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                          aria-label={`Select product ${product.sku}`}
                        />
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800 sm:px-6 sm:py-4">
                        <span className="text-xs sm:text-sm">{product.sku}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 sm:px-6 sm:py-4">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="font-medium text-sky-600 hover:text-sky-500 text-xs sm:text-sm"
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-500 hidden md:table-cell sm:px-6 sm:py-4">
                        <span className="text-xs sm:text-sm">{product.brand?.name ?? "—"}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 hidden lg:table-cell sm:px-6 sm:py-4">
                        <span className="text-xs sm:text-sm">{product.category?.name ?? "—"}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 hidden md:table-cell sm:px-6 sm:py-4">
                        <span className="text-xs sm:text-sm">{product.variants_count}</span>
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                            product.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                        <div className="flex justify-end gap-1.5 sm:gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            title="Edit product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6.5l4 4"
                              />
                            </svg>
                          </Link>
                          <button
                            type="button"
                            onClick={() => duplicateProduct(product.id)}
                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            title="Duplicate product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 16h8a2 2 0 002-2V6H8a2 2 0 00-2 2v6a2 2 0 002 2z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 16V18a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h2"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                            title="Delete product"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination 
          meta={data.products.meta as PaginationMeta} 
          onPageChange={(page) => {
            setFilterState((prev) => ({
              ...prev,
              page,
            }));
          }} 
        />
      </div>


      <ConfirmationModal
        show={confirmModal.show}
        onClose={() =>
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: () => {},
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
