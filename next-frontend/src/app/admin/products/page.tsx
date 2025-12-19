"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import AlertModal from "@/components/ui/AlertModal";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    products: { data: [], meta: {}, links: [] },
    brands: {},
    categories: [],
    filters: {},
    perPageOptions: [10, 20, 50, 100],
    perPage: 20,
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [filterState, setFilterState] = useState({
    search: "",
    brand: "all",
    category: "all",
    status: "all",
    page: 1,
    per_page: 20,
  });

  const [bulkBrand, setBulkBrand] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");

  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchProducts = async () => {
    setLoading(true);
    // Mock data
    const mockData = {
      products: {
        data: [
          { id: 1, name: 'Diamond Solitaire Ring', sku: 'ELV-1001', is_active: true, brand: { name: 'Elvee Atelier' }, category: { name: 'Rings' }, variants_count: 3 },
          { id: 2, name: 'Gold Tennis Bracelet', sku: 'ELV-1002', is_active: true, brand: { name: 'Signature' }, category: { name: 'Bracelets' }, variants_count: 1 },
          { id: 3, name: 'Emerald Stud Earrings', sku: 'ELV-1003', is_active: false, brand: { name: 'Elvee Atelier' }, category: { name: 'Earrings' }, variants_count: 2 },
        ],
        meta: { from: 1, to: 3, total: 3, per_page: 20 },
        links: [
          { url: '#', label: '&laquo; Previous', active: false },
          { url: '#', label: '1', active: true },
          { url: '#', label: 'Next &raquo;', active: false },
        ]
      },
      brands: { 1: 'Elvee Atelier', 2: 'Signature' },
      categories: [{ id: 1, name: 'Rings' }, { id: 2, name: 'Earrings' }, { id: 3, name: 'Bracelets' }],
      filters: {},
      perPageOptions: [10, 20, 50, 100],
      perPage: 20,
    };
    setData(mockData);
    setLoading(false);
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
      setAlertModal({
        show: true,
        title: "Selection Required",
        message: "Select at least one product first.",
      });
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
          setData((prev: any) => ({
            ...prev,
            products: {
              ...prev.products,
              data: prev.products.data.filter((p: any) => !selectedProducts.includes(p.id))
            }
          }));
          setSelectedProducts([]);
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: () => {},
          });
        },
      });
    });
  };

  const bulkStatus = (action: "activate" | "deactivate") => {
    ensureSelection(async () => {
      setData((prev: any) => ({
        ...prev,
        products: {
          ...prev.products,
          data: prev.products.data.map((p: any) => 
            selectedProducts.includes(p.id) ? { ...p, is_active: action === 'activate' } : p
          )
        }
      }));
      setSelectedProducts([]);
    });
  };

  const bulkAssignBrand = () => {
    ensureSelection(async () => {
      if (!bulkBrand) {
        setAlertModal({
          show: true,
          title: "Brand Required",
          message: "Select a brand to assign.",
        });
        return;
      }
      const brandName = data.brands[bulkBrand];
      setData((prev: any) => ({
        ...prev,
        products: {
          ...prev.products,
          data: prev.products.data.map((p: any) => 
            selectedProducts.includes(p.id) ? { ...p, brand: { name: brandName } } : p
          )
        }
      }));
      setSelectedProducts([]);
      setBulkBrand("");
    });
  };

  const bulkAssignCategory = () => {
    ensureSelection(async () => {
      if (!bulkCategory) {
        setAlertModal({
          show: true,
          title: "Category Required",
          message: "Select a category to assign.",
        });
        return;
      }
      const categoryName = data.categories.find((c: any) => String(c.id) === bulkCategory)?.name;
      setData((prev: any) => ({
        ...prev,
        products: {
          ...prev.products,
          data: prev.products.data.map((p: any) => 
            selectedProducts.includes(p.id) ? { ...p, category: { name: categoryName } } : p
          )
        }
      }));
      setSelectedProducts([]);
      setBulkCategory("");
    });
  };

  const duplicateProduct = async (id: number) => {
    const product = data.products.data.find((p: any) => p.id === id);
    if (product) {
      setData((prev: any) => ({
        ...prev,
        products: {
          ...prev.products,
          data: [...prev.products.data, { ...product, id: Date.now(), name: `${product.name} (Copy)` }]
        }
      }));
    }
  };

  const deleteProduct = (id: number) => {
    setConfirmModal({
      show: true,
      title: "Delete Product",
      message:
        "Are you sure you want to delete this product? This action cannot be undone.",
      onConfirm: async () => {
        setData((prev: any) => ({
          ...prev,
          products: {
            ...prev.products,
            data: prev.products.data.filter((p: any) => p.id !== id)
          }
        }));
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          onConfirm: () => {},
        });
      },
    });
  };

  const changePage = (page: number) => {
    setFilterState((prev) => ({ ...prev, page }));
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
      <div className="space-y-8">
        <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <input
                type="search"
                value={filterState.search}
                onChange={(event) => applyFilters({ search: event.target.value })}
                placeholder="Search SKU or name"
                className="rounded-2xl border border-slate-200 px-4 py-2"
              />
              <select
                value={filterState.brand}
                onChange={(event) => applyFilters({ brand: event.target.value })}
                className="rounded-2xl border border-slate-200 px-4 py-2"
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
                className="rounded-2xl border border-slate-200 px-4 py-2"
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
                className="rounded-2xl border border-slate-200 px-4 py-2"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {selectedProducts.length} selected
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => bulkStatus("activate")}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enable
            </button>
            <button
              type="button"
              onClick={() => bulkStatus("deactivate")}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-amber-200 px-3 py-1 text-amber-600 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Disable
            </button>
            <div className="flex items-center gap-2">
              <select
                value={bulkBrand}
                onChange={(event) => setBulkBrand(event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-1 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkCategory}
                onChange={(event) => setBulkCategory(event.target.value)}
                className="rounded-2xl border border-slate-200 px-3 py-1 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={selectedProducts.length === 0}
              className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
            <Link
              href="/admin/products/create"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                    aria-label="Select all products"
                  />
                </th>
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Brand</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Variants</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.products.data.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleSelection(product.id)}
                      className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                      aria-label={`Select product ${product.sku}`}
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="font-medium text-sky-600 hover:text-sky-500"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {product.brand?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {product.category?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {product.variants_count}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        product.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                        title="Edit product"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                        title="Duplicate product"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                        title="Delete product"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
              ))}
              {data.products.data.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No products found. Start by adding your hero collections.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Showing {data.products.meta?.from ?? 0} to{" "}
            {data.products.meta?.to ?? 0} of {data.products.meta?.total ?? 0}{" "}
            entries
          </div>
          <div className="flex flex-wrap gap-2">
            {data.products.links.map((link: any, index: number) => {
              const cleanLabel = link.label
                .replace("&laquo;", "«")
                .replace("&raquo;", "»")
                .replace(/&nbsp;/g, " ")
                .trim();

              if (!link.url) {
                return (
                  <span
                    key={`${link.label}-${index}`}
                    className="rounded-full px-3 py-1 text-sm text-slate-400"
                  >
                    {cleanLabel}
                  </span>
                );
              }

              // Extract page number from URL if needed, but here we just use the label if it's a number
              const pageNum = parseInt(cleanLabel);

              return (
                <button
                  key={`${link.label}-${index}`}
                  type="button"
                  onClick={() => !isNaN(pageNum) && changePage(pageNum)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    link.active
                      ? "bg-sky-600 text-white shadow shadow-sky-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cleanLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AlertModal
        show={alertModal.show}
        onClose={() => setAlertModal({ show: false, title: "", message: "" })}
        title={alertModal.title}
        message={alertModal.message}
      />

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
