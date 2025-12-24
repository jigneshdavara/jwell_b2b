'use client';

import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { frontendService } from '@/services/frontendService';
import { route } from '@/utils/route';

type OrderShowItem = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  configuration?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  price_breakdown?: {
    metal?: number;
    diamond?: number;
    making?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
  } | null;
  calculated_making_charge?: number | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    base_price?: number | null;
    making_charge_amount?: number | null;
    making_charge_percentage?: number | null;
    making_charge_types?: string[];
    media: Array<{ url: string; alt: string }>;
  } | null;
};

type OrderPayment = {
  id: number;
  status: string;
  amount: number;
  created_at?: string | null;
};

type OrderDetails = {
  id: number;
  reference: string;
  status: string;
  status_label: string;
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  created_at?: string | null;
  updated_at?: string | null;
  items: OrderShowItem[];
  payments: OrderPayment[];
  status_history: Array<{
    id: number;
    status: string;
    created_at?: string | null;
  }>;
  quotations?: Array<{
    id: number;
    status: string;
    quantity: number;
    product?: {
      id: number;
      name: string;
      sku: string;
      media: Array<{ url: string; alt: string }>;
    } | null;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  pending_payment: "bg-amber-100 text-amber-700",
  payment_failed: "bg-rose-100 text-rose-700",
  awaiting_materials: "bg-indigo-100 text-indigo-700",
  under_production: "bg-indigo-100 text-indigo-700",
  approved: "bg-emerald-100 text-emerald-700",
  in_production: "bg-indigo-100 text-indigo-700",
  quality_check: "bg-blue-100 text-blue-700",
  ready_to_dispatch: "bg-purple-100 text-purple-700",
  dispatched: "bg-elvee-blue/10 text-elvee-blue",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const formatDate = (input?: string | null) =>
  input
    ? new Date(input).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

export default function OrderShowPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [productDetailsModalOpen, setProductDetailsModalOpen] =
    useState<OrderShowItem | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = Number(id);
        if (isNaN(orderId)) {
          setLoading(false);
          return;
        }
        const response = await frontendService.getOrder(orderId);
        const orderData = response.data?.order;
        
        if (!orderData) {
          setLoading(false);
          return;
        }

        // Map backend response to frontend format
        const mappedOrder: OrderDetails = {
          id: Number(orderData.id),
          reference: orderData.reference || '',
          status: orderData.status || 'pending',
          status_label: orderData.status_label || orderData.status || 'Pending',
          total_amount: Number(orderData.total_amount) || 0,
          subtotal_amount: Number(orderData.subtotal_amount) || 0,
          tax_amount: Number(orderData.tax_amount) || 0,
          discount_amount: Number(orderData.discount_amount) || 0,
          created_at: orderData.created_at || null,
          updated_at: orderData.updated_at || null,
          items: (orderData.items || []).map((item: any) => ({
            id: Number(item.id),
            name: item.name || '',
            sku: item.sku || '',
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            total_price: Number(item.total_price) || 0,
            configuration: item.configuration || null,
            metadata: item.metadata || null,
            price_breakdown: item.price_breakdown || null,
            calculated_making_charge: item.calculated_making_charge || null,
            product: item.product ? {
              id: Number(item.product.id),
              name: item.product.name || '',
              sku: item.product.sku || '',
              base_price: item.product.base_price ? Number(item.product.base_price) : null,
              making_charge_amount: item.product.making_charge_amount ? Number(item.product.making_charge_amount) : null,
              making_charge_percentage: item.product.making_charge_percentage ? Number(item.product.making_charge_percentage) : null,
              making_charge_types: item.product.making_charge_types || [],
              media: (item.product.media || []).map((m: any) => ({
                url: m.url || '',
                alt: m.alt || item.product.name || '',
              })),
            } : null,
          })),
          payments: (orderData.payments || []).map((payment: any) => ({
            id: Number(payment.id),
            status: payment.status || '',
            amount: Number(payment.amount) || 0,
            created_at: payment.created_at || null,
          })),
          status_history: (orderData.status_history || []).map((entry: any) => ({
            id: Number(entry.id),
            status: entry.status || '',
            created_at: entry.created_at || null,
          })),
          quotations: orderData.quotations ? (orderData.quotations || []).map((q: any) => ({
            id: Number(q.id),
            status: q.status || '',
            quantity: Number(q.quantity) || 0,
            product: q.product ? {
              id: Number(q.product.id),
              name: q.product.name || '',
              sku: q.product.sku || '',
              media: (q.product.media || []).map((m: any) => ({
                url: m.url || '',
                alt: m.alt || q.product.name || '',
              })),
            } : null,
          })) : undefined,
        };
        
        setOrder(mappedOrder);
      } catch (error: any) {
        console.error('Failed to fetch order', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getMediaUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Order not found</p>
          <Link href={route('frontend.orders.index')} className="mt-4 text-sm text-elvee-blue hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
        <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Order {order.reference}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                View order details and track fulfilment
              </p>
            </div>
            <Link
              href={route('frontend.orders.index')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            >
              Back to list
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Company Details */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400">From</h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Elvee
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  123 Business Street
                </p>
                <p className="text-sm text-slate-600">
                  Mumbai, Maharashtra 400001
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Phone: +91 98765 43210
                </p>
                <p className="text-sm text-slate-600">Email: info@elvee.com</p>
                <p className="mt-2 text-sm text-slate-600">
                  GSTIN: 27AAAAA0000A1Z5
                </p>
              </div>
              {/* Bill To */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400">Bill To</h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  Your Account
                </p>
              </div>
              {/* Order Details */}
              <div className="text-right">
                <h3 className="text-xs font-semibold text-slate-400">
                  Order Details
                </h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {order.reference}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Date:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatDate(order.created_at)}
                  </span>
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[order.status] ?? "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {order.status_label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table - Invoice Style */}
          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.product?.media?.[0] && (
                            <img
                              src={getMediaUrl(item.product.media[0].url)}
                              alt={item.product.media[0].alt}
                              className="h-12 w-12 rounded-lg object-cover shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={route('frontend.catalog.show', item.product?.id ?? item.id)}
                              className="text-sm font-semibold text-slate-900 hover:text-feather-gold transition"
                            >
                              {item.name}
                            </Link>
                            <p className="text-xs text-slate-400">
                              SKU {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {currencyFormatter.format(item.unit_price)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {currencyFormatter.format(item.total_price)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setProductDetailsModalOpen(item)}
                            className="inline-flex items-center gap-1 rounded-full border border-elvee-blue/30 px-2.5 py-1.5 text-[10px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5"
                            title="View product details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-3 w-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-2 text-right text-sm text-slate-600"
                    >
                      Subtotal
                    </td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                      {currencyFormatter.format(order.subtotal_amount)}
                    </td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-2 text-right text-sm text-slate-600"
                      >
                        Discount
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                        -{currencyFormatter.format(order.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-2 text-right text-sm text-slate-600"
                    >
                      Tax (GST)
                    </td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                      {currencyFormatter.format(order.tax_amount)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-300">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-right text-base font-bold text-slate-900"
                    >
                      Grand Total
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                      {currencyFormatter.format(order.total_amount)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {/* Payments */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                <h2 className="text-lg font-semibold text-slate-900">
                  Payments
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {order.payments.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      No payments recorded yet.
                    </p>
                  )}
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {payment.status}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {currencyFormatter.format(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                {(order.status === "pending_payment" ||
                  order.status === "payment_failed") && (
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={route('frontend.orders.pay', order.id)}
                      className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                    >
                      Proceed to payment
                    </Link>
                  </div>
                )}
                {order.status === "payment_failed" && (
                  <p className="mt-2 text-xs text-rose-500">
                    Previous attempt failed. Please retry the payment.
                  </p>
                )}
              </div>

              {/* Status History */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                <h2 className="text-lg font-semibold text-slate-900">
                  Status History
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {order.status_history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <span className="font-semibold text-slate-800">
                        {entry.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Order Timeline */}
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                <h2 className="text-lg font-semibold text-slate-900">
                  Order Timeline
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          Created
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-400">
                            Last Updated
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatDate(order.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Quotations */}
              {order.quotations && order.quotations.length > 0 && (
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Source Quotations
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    This order was created from the following quotations
                  </p>
                  <div className="mt-4 space-y-3">
                    {order.quotations.map((quotation) => (
                      <Link
                        key={quotation.id}
                        href={route('frontend.quotations.show', { id: quotation.id })}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-elvee-blue/50 hover:bg-elvee-blue/5"
                      >
                        {quotation.product?.media?.[0] && (
                          <img
                            src={getMediaUrl(quotation.product.media[0].url)}
                            alt={quotation.product.media[0].alt}
                            className="h-10 w-10 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            Quotation #{quotation.id}
                          </p>
                          <p className="text-xs text-slate-500">
                            {quotation.product?.name ?? "Product"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Qty: {quotation.quantity}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {productDetailsModalOpen && (
        <Modal
          show={true}
          onClose={() => setProductDetailsModalOpen(null)}
          maxWidth="4xl"
        >
          <div className="flex min-h-0 flex-col">
            <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Product Details
                </h3>
                <button
                  type="button"
                  onClick={() => setProductDetailsModalOpen(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-5 w-5"
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
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Product Image and Basic Info */}
                <div className="flex gap-6">
                  {productDetailsModalOpen.product?.media?.[0] && (
                    <img
                      src={getMediaUrl(productDetailsModalOpen.product.media[0].url)}
                      alt={productDetailsModalOpen.product.media[0].alt}
                      className="h-32 w-32 rounded-lg object-cover shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-slate-900">
                      {productDetailsModalOpen.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      SKU: {productDetailsModalOpen.sku}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        Qty: {productDetailsModalOpen.quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h5 className="mb-3 text-sm font-semibold text-slate-700">
                    Pricing
                  </h5>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      // Use stored price breakdown from order if available
                      const priceBreakdown =
                        productDetailsModalOpen.price_breakdown;
                      const metalCost = priceBreakdown?.metal ?? 0;
                      const diamondCost = priceBreakdown?.diamond ?? 0;
                      const makingCharge =
                        priceBreakdown?.making ??
                        productDetailsModalOpen.calculated_making_charge ??
                        0;
                      const discount = priceBreakdown?.discount ?? 0;

                      return (
                        <>
                          {metalCost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Metal:</span>
                              <span className="font-semibold text-slate-900">
                                {currencyFormatter.format(metalCost)}
                              </span>
                            </div>
                          )}
                          {diamondCost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Diamond:</span>
                              <span className="font-semibold text-slate-900">
                                {currencyFormatter.format(diamondCost)}
                              </span>
                            </div>
                          )}
                          {makingCharge > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">
                                Making Charge:
                              </span>
                              <span className="font-semibold text-slate-900">
                                {currencyFormatter.format(makingCharge)}
                              </span>
                            </div>
                          )}
                          {discount > 0 && (
                            <div className="flex justify-between text-rose-600">
                              <span>Discount:</span>
                              <span className="font-semibold">
                                -{currencyFormatter.format(discount)}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="border-t border-slate-300 pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-900">
                          Unit Price:
                        </span>
                        <span className="font-semibold text-slate-900">
                          {currencyFormatter.format(
                            productDetailsModalOpen.unit_price
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="font-semibold text-slate-900">
                          Total Price:
                        </span>
                        <span className="font-semibold text-slate-900">
                          {currencyFormatter.format(
                            productDetailsModalOpen.total_price
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration */}
                {productDetailsModalOpen.configuration &&
                  Object.keys(productDetailsModalOpen.configuration).length >
                    0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h5 className="mb-3 text-sm font-semibold text-slate-700">
                        Configuration
                      </h5>
                      <div className="space-y-2 text-sm">
                        {Object.entries(
                          productDetailsModalOpen.configuration
                        ).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-600">
                              {key.replace(/_/g, " ")}:
                            </span>
                            <span className="font-semibold text-slate-900">
                              {value === null ||
                              value === undefined ||
                              value === ""
                                ? "—"
                                : typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                {productDetailsModalOpen.metadata &&
                  Object.keys(productDetailsModalOpen.metadata).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h5 className="mb-3 text-sm font-semibold text-slate-700">
                        Additional Information
                      </h5>
                      <div className="space-y-2 text-sm">
                        {Object.entries(productDetailsModalOpen.metadata).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-600">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-semibold text-slate-900">
                                {value === null ||
                                value === undefined ||
                                value === ""
                                  ? "—"
                                  : typeof value === "boolean"
                                  ? value
                                    ? "Yes"
                                    : "No"
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

