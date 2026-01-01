'use client';

import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { frontendService } from '@/services/frontendService';
import { kycService } from '@/services/kycService';
import { route } from '@/utils/route';
import { formatCurrency } from '@/utils/formatting';
import type { OrderShowItem, OrderPayment, OrderDetails } from '@/types';

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
  const [invoiceExists, setInvoiceExists] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [checkingInvoice, setCheckingInvoice] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderId = Number(id);
        if (isNaN(orderId)) {
          setLoading(false);
          return;
        }
        
        // Fetch order, KYC profile, and company settings in parallel
        const [orderResponse, kycResponse, settingsResponse] = await Promise.all([
          frontendService.getOrder(orderId),
          kycService.getOnboardingData().catch(() => null), // Don't fail if profile fetch fails
          frontendService.getPublicSettings().catch(() => null), // Don't fail if settings fetch fails
        ]);
        
        const orderData = orderResponse.data?.order;
        
        if (!orderData) {
          setLoading(false);
          return;
        }
        
        // Set user profile if available (includes business information)
        if (kycResponse?.data) {
          const profileData = kycResponse.data.profile || {};
          const userData = kycResponse.data.user || {};
          setUserProfile({
            ...userData,
            ...profileData,
          });
        }
        
        // Set company settings if available
        if (settingsResponse?.data) {
          setCompanySettings(settingsResponse.data);
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
        
        // Check if invoice exists for this order after order is loaded
        if (mappedOrder?.reference) {
          checkInvoiceExists(mappedOrder.reference, mappedOrder.id);
        }
      } catch (error: any) {
        console.error('Failed to fetch order', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const checkInvoiceExists = async (orderRef: string, orderId: number) => {
    if (!orderRef || !orderId) return;
    setCheckingInvoice(true);
    try {
      const response = await frontendService.getInvoices(1, 100); // Get first 100 invoices
      const invoices = response.data?.items || [];
      const foundInvoice = invoices.find(
        (inv: any) => inv.order_reference === orderRef || inv.order_id === orderId
      );
      if (foundInvoice) {
        setInvoiceExists(true);
        setInvoiceId(foundInvoice.id);
      } else {
        setInvoiceExists(false);
        setInvoiceId(null);
      }
    } catch (error) {
      // If error, assume no invoice
      setInvoiceExists(false);
      setInvoiceId(null);
    } finally {
      setCheckingInvoice(false);
    }
  };

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
    <>
      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        <header className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">
                Order {order.reference}
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                View order details and track fulfilment
              </p>
            </div>
            <Link
              href={route('frontend.orders.index')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
            >
              Back to list
            </Link>
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6">
          {/* Invoice Header */}
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              {/* Company Details */}
              <div>
                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">From</h3>
                {companySettings ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                      {companySettings.company_name || 'Elvee'}
                    </p>
                    {companySettings.address_line1 && (
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                        {companySettings.address_line1}
                      </p>
                    )}
                    {(companySettings.city || companySettings.state || companySettings.pincode) && (
                      <p className="text-xs text-slate-600 sm:text-sm">
                        {[companySettings.city, companySettings.state, companySettings.pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {companySettings.phone && (
                      <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                        Phone: {companySettings.phone}
                      </p>
                    )}
                    {companySettings.email && (
                      <p className="text-xs text-slate-600 sm:text-sm">
                        Email: {companySettings.email}
                      </p>
                    )}
                    {companySettings.gstin && (
                      <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                        GSTIN: {companySettings.gstin}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                      Elvee
                    </p>
                    <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                      123 Business Street
                    </p>
                    <p className="text-xs text-slate-600 sm:text-sm">
                      Mumbai, Maharashtra 400001
                    </p>
                    <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                      Phone: +91 98765 43210
                    </p>
                    <p className="text-xs text-slate-600 sm:text-sm">Email: info@elvee.com</p>
                    <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                      GSTIN: 27AAAAA0000A1Z5
                    </p>
                  </>
                )}
              </div>
              {/* Bill To */}
              <div>
                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">Bill To</h3>
                {userProfile ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                      {userProfile.business_name || userProfile.name || 'Your Account'}
                    </p>
                    {userProfile.email && (
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                        {userProfile.email}
                      </p>
                    )}
                    {userProfile.address_line1 && (
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                        {userProfile.address_line1}
                      </p>
                    )}
                    {userProfile.address_line2 && (
                      <p className="text-xs text-slate-600 sm:text-sm">
                        {userProfile.address_line2}
                      </p>
                    )}
                    {(userProfile.city || userProfile.state || userProfile.postal_code) && (
                      <p className="text-xs text-slate-600 sm:text-sm">
                        {[userProfile.city, userProfile.state, userProfile.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {userProfile.phone && (
                      <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                        Phone: {userProfile.phone}
                      </p>
                    )}
                    {userProfile.gst_number && (
                      <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                        GSTIN: {userProfile.gst_number}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                    Your Account
                  </p>
                )}
              </div>
              {/* Order Details */}
              <div className="text-left sm:text-right">
                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                  Order Details
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                  {order.reference}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Date:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatDate(order.created_at)}
                  </span>
                </p>
                <div className="mt-2 flex justify-start gap-2 sm:mt-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                      statusColors[order.status] ?? "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {order.status_label}
                  </span>
                </div>
                {invoiceExists && !checkingInvoice && invoiceId && (
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={route('customer.invoices.show', { id: invoiceId })}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-elvee-blue bg-elvee-blue/10 rounded-lg hover:bg-elvee-blue/20"
                    >
                      View Invoice
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products Table - Invoice Style */}
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="border-b-2 border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                      Item
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                      Unit Price
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                      Qty
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                      Total
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {item.product?.media?.[0] && (
                            <img
                              src={getMediaUrl(item.product.media[0].url)}
                              alt={item.product.media[0].alt}
                              className="h-10 w-10 flex-shrink-0 rounded-lg object-cover shadow-sm sm:h-12 sm:w-12"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={route('frontend.catalog.show', item.product?.id ?? item.id)}
                              className="text-xs font-semibold text-slate-900 hover:text-feather-gold transition sm:text-sm"
                            >
                              {item.name}
                            </Link>
                            <p className="text-[10px] text-slate-400 sm:text-xs">
                              SKU {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right sm:px-4 sm:py-4">
                        <div className="text-xs font-semibold text-slate-900 sm:text-sm">
                          {formatCurrency(item.unit_price)}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center sm:px-4 sm:py-4">
                        <span className="text-xs font-semibold text-slate-900 sm:text-sm">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right sm:px-4 sm:py-4">
                        <div className="text-xs font-semibold text-slate-900 sm:text-sm">
                          {formatCurrency(item.total_price)}
                        </div>
                      </td>
                      <td className="px-2 py-3 sm:px-4 sm:py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setProductDetailsModalOpen(item)}
                            className="inline-flex items-center gap-0.5 rounded-full border border-elvee-blue/30 px-2 py-1 text-[9px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5 sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[10px]"
                            title="View product details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
                      className="px-2 py-1.5 text-right text-xs text-slate-600 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Subtotal
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2"></td>
                    <td className="px-2 py-1.5 text-right text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                      {formatCurrency(order.subtotal_amount)}
                    </td>
                  </tr>
                  {order.discount_amount > 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 py-1.5 text-right text-xs text-slate-600 sm:px-4 sm:py-2 sm:text-sm"
                      >
                        Discount
                      </td>
                      <td className="px-2 py-1.5 sm:px-4 sm:py-2"></td>
                      <td className="px-2 py-1.5 text-right text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                        -{formatCurrency(order.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td
                      colSpan={2}
                      className="px-2 py-1.5 text-right text-xs text-slate-600 sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Tax (GST)
                    </td>
                    <td className="px-2 py-1.5 sm:px-4 sm:py-2"></td>
                    <td className="px-2 py-1.5 text-right text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                      {formatCurrency(order.tax_amount)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-300">
                    <td
                      colSpan={2}
                      className="px-2 py-2 text-right text-sm font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-base"
                    >
                      Grand Total
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3"></td>
                    <td className="px-2 py-2 text-right text-base font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-lg">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="space-y-4 sm:space-y-6">
              {/* Payments */}
              <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Payments
                </h2>
                <div className="mt-3 space-y-2 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:text-sm">
                  {order.payments.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[10px] text-slate-500 sm:rounded-2xl sm:p-6 sm:text-xs">
                      No payments recorded yet.
                    </p>
                  )}
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                          {payment.status}
                        </p>
                        <p className="text-[10px] text-slate-400 sm:text-xs">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-900 sm:text-sm">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                {(order.status === "pending_payment" ||
                  order.status === "payment_failed") && (
                  <div className="mt-3 flex justify-end sm:mt-4">
                    <Link
                      href={route('frontend.orders.pay', order.id)}
                      className="rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:px-4 sm:py-2 sm:text-sm"
                    >
                      Proceed to payment
                    </Link>
                  </div>
                )}
                {order.status === "payment_failed" && (
                  <p className="mt-1.5 text-[10px] text-rose-500 sm:mt-2 sm:text-xs">
                    Previous attempt failed. Please retry the payment.
                  </p>
                )}
              </div>

              {/* Status History */}
              <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Status History
                </h2>
                <div className="mt-3 space-y-2 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:text-sm">
                  {order.status_history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3"
                    >
                      <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                        {entry.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400 sm:text-xs">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Order Timeline */}
              <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                  Order Timeline
                </h2>
                <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                          Created
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                            Last Updated
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm">
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
                <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                    Source Quotations
                  </h2>
                  <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
                    This order was created from the following quotations
                  </p>
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                    {order.quotations.map((quotation) => (
                      <Link
                        key={quotation.id}
                        href={route('frontend.quotations.show', { id: quotation.id })}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-elvee-blue/50 hover:bg-elvee-blue/5 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
                      >
                        {quotation.product?.media?.[0] && (
                          <img
                            src={getMediaUrl(quotation.product.media[0].url)}
                            alt={quotation.product.media[0].alt}
                            className="h-8 w-8 flex-shrink-0 rounded-lg object-cover sm:h-10 sm:w-10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                            Quotation #{quotation.id}
                          </p>
                          <p className="text-[10px] text-slate-500 sm:text-xs">
                            {quotation.product?.name ?? "Product"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 sm:text-xs">
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
            <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">
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
                    className="h-4 w-4 sm:h-5 sm:w-5"
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
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
              <div className="space-y-4 sm:space-y-6">
                {/* Product Image and Basic Info */}
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                  {productDetailsModalOpen.product?.media?.[0] && (
                    <img
                      src={getMediaUrl(productDetailsModalOpen.product.media[0].url)}
                      alt={productDetailsModalOpen.product.media[0].alt}
                      className="h-24 w-24 flex-shrink-0 rounded-lg object-cover shadow-lg sm:h-32 sm:w-32"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 break-words sm:text-base lg:text-xl">
                      {productDetailsModalOpen.name}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs lg:text-sm">
                      SKU: {productDetailsModalOpen.sku}
                    </p>
                    <div className="mt-2 flex gap-2 sm:mt-3">
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-1 sm:text-xs">
                        Qty: {productDetailsModalOpen.quantity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                  <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">
                    Pricing
                  </h5>
                  <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
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
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600 flex-shrink-0">Metal:</span>
                              <span className="font-semibold text-slate-900 text-right break-words">
                                {formatCurrency(metalCost)}
                              </span>
                            </div>
                          )}
                          {diamondCost > 0 && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600 flex-shrink-0">Diamond:</span>
                              <span className="font-semibold text-slate-900 text-right break-words">
                                {formatCurrency(diamondCost)}
                              </span>
                            </div>
                          )}
                          {makingCharge > 0 && (
                            <div className="flex justify-between gap-2">
                              <span className="text-slate-600 flex-shrink-0">
                                Making Charge:
                              </span>
                              <span className="font-semibold text-slate-900 text-right break-words">
                                {formatCurrency(makingCharge)}
                              </span>
                            </div>
                          )}
                          {discount > 0 && (
                            <div className="flex justify-between gap-2 text-rose-600">
                              <span className="flex-shrink-0">Discount:</span>
                              <span className="font-semibold text-right break-words">
                                -{formatCurrency(discount)}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="border-t border-slate-300 pt-1.5 sm:pt-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold text-slate-900 flex-shrink-0">
                          Unit Price:
                        </span>
                        <span className="font-semibold text-slate-900 text-right break-words">
                          {formatCurrency(
                            productDetailsModalOpen.unit_price
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 mt-1.5 sm:mt-2">
                        <span className="font-semibold text-slate-900 flex-shrink-0">
                          Total Price:
                        </span>
                        <span className="font-semibold text-slate-900 text-right break-words">
                          {formatCurrency(
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
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                      <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">
                        Configuration
                      </h5>
                      <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
                        {Object.entries(
                          productDetailsModalOpen.configuration
                        ).map(([key, value]) => {
                          let displayValue: string;
                          if (value === null || value === undefined || value === "") {
                            displayValue = "—";
                          } else if (typeof value === "boolean") {
                            displayValue = value ? "Yes" : "No";
                          } else if (typeof value === "object") {
                            displayValue = JSON.stringify(value);
                          } else {
                            displayValue = String(value);
                          }
                          
                          return (
                            <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                              <span className="text-slate-600 min-w-0 flex-shrink-0">
                                {key.replace(/_/g, " ")}:
                              </span>
                              <span className="font-semibold text-slate-900 break-words text-right sm:text-left">
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                {productDetailsModalOpen.metadata &&
                  Object.keys(productDetailsModalOpen.metadata).length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                      <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">
                        Additional Information
                      </h5>
                      <div className="space-y-1.5 text-xs sm:space-y-2 sm:text-sm">
                        {Object.entries(productDetailsModalOpen.metadata).map(
                          ([key, value]) => {
                            let displayValue: string;
                            if (value === null || value === undefined || value === "") {
                              displayValue = "—";
                            } else if (typeof value === "boolean") {
                              displayValue = value ? "Yes" : "No";
                            } else if (typeof value === "object") {
                              displayValue = JSON.stringify(value);
                            } else {
                              displayValue = String(value);
                            }
                            
                            return (
                              <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-2">
                                <span className="text-slate-600 min-w-0 flex-shrink-0">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="font-semibold text-slate-900 break-words text-right sm:text-left">
                                  {displayValue}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

