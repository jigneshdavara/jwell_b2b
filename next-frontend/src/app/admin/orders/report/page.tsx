'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/utils/formatting';
import * as XLSX from 'xlsx';

type StatisticsData = {
  summary: {
    total_orders: number;
    total_revenue: string;
    total_subtotal: string;
    total_tax: string;
    total_discount: string;
    average_order_value: string;
  };
  by_status: Array<{
    status: string;
    status_label: string;
    count: number;
    revenue: number;
  }>;
  by_date: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
};

type User = {
  id: number;
  name: string;
  email: string;
};

// Status-based color mapping for charts - matches status colors used in orders list
const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    // Pending states - Amber
    pending: '#F59E0B',
    pending_payment: '#F59E0B',
    
    // Failed/Cancelled - Rose/Red
    payment_failed: '#EF4444',
    cancelled: '#EF4444',
    
    // Production states - Indigo
    awaiting_materials: '#6366F1',
    under_production: '#6366F1',
    in_production: '#6366F1',
    
    // Approved/Success states - Emerald Green
    approved: '#10B981',
    delivered: '#10B981',
    paid: '#10B981',
    
    // Quality check - Blue
    quality_check: '#3B82F6',
    
    // Ready to dispatch - Purple
    ready_to_dispatch: '#8B5CF6',
    
    // Dispatched - Elvee Blue (brand color)
    dispatched: '#0E244D',
  };
  
  return statusColorMap[status.toLowerCase()] || '#6B7280'; // Default gray for unknown statuses
};

export default function AdminOrdersReport() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('graph');
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadStatistics();
  }, [selectedUserId]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await adminService.getCustomers({ page: 1, per_page: 1000 });
      const items = response.data.items || response.data.data || [];
      setUsers(items.map((item: any) => ({
        id: Number(item.id),
        name: item.name || item.email || 'Unknown',
        email: item.email || '',
      })));
    } catch (error: any) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await adminService.getOrderStatistics(selectedUserId);
      setStatistics(response.data);
    } catch (error: any) {
      console.error('Failed to load order statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!statistics) return;

    // Prepare CSV data - Tables first, then summary
    let csv = 'Order Report\n\n';

    csv += 'Orders by Status\n';
    csv += 'Status,Count,Revenue\n';
    statistics.by_status.forEach((item) => {
      csv += `${item.status_label},${item.count},${item.revenue}\n`;
    });

    csv += '\nOrders Over Time (Last 30 Days)\n';
    csv += 'Date,Order Count,Revenue\n';
    statistics.by_date.forEach((item) => {
      csv += `${formatDate(item.date)},${item.count},${item.revenue}\n`;
    });

    csv += '\nSummary\n';
    csv += `Total Orders,${statistics.summary.total_orders}\n`;
    csv += `Total Revenue,${statistics.summary.total_revenue}\n`;
    csv += `Total Subtotal,${statistics.summary.total_subtotal}\n`;
    csv += `Total Tax,${statistics.summary.total_tax}\n`;
    csv += `Total Discount,${statistics.summary.total_discount}\n`;
    csv += `Average Order Value,${statistics.summary.average_order_value}\n`;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `order-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLSX = () => {
    if (!statistics) return;

    const wb = XLSX.utils.book_new();

    // Orders by Status sheet (first)
    const statusData: any[][] = [
      ['Status', 'Count', 'Revenue'],
    ];
    
    // Add all status rows
    if (statistics.by_status && statistics.by_status.length > 0) {
      statistics.by_status.forEach((item) => {
        statusData.push([
          item.status_label || item.status || '',
          item.count || 0,
          item.revenue || 0,
        ]);
      });
    }
    
    // Add total row
    statusData.push([
      'Total',
      statistics.summary.total_orders || 0,
      parseFloat(statistics.summary.total_revenue || '0'),
    ]);
    
    const statusWs = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, statusWs, 'Orders by Status');

    // Orders Over Time sheet (second)
    const dateData: any[][] = [
      ['Date', 'Order Count', 'Revenue'],
    ];
    
    // Add all date rows
    if (statistics.by_date && statistics.by_date.length > 0) {
      statistics.by_date.forEach((item) => {
        dateData.push([
          formatDate(item.date),
          item.count || 0,
          item.revenue || 0,
        ]);
      });
    }
    
    // Add total row for dates
    const totalDateCount = statistics.by_date?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    const totalDateRevenue = statistics.by_date?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
    dateData.push([
      'Total',
      totalDateCount,
      totalDateRevenue,
    ]);
    
    const dateWs = XLSX.utils.aoa_to_sheet(dateData);
    XLSX.utils.book_append_sheet(wb, dateWs, 'Orders Over Time');

    // Summary sheet (last)
    const summaryData: any[][] = [
      ['Order Report Summary'],
      [],
      ['Total Orders', statistics.summary.total_orders || 0],
      ['Total Revenue', parseFloat(statistics.summary.total_revenue || '0')],
      ['Total Subtotal', parseFloat(statistics.summary.total_subtotal || '0')],
      ['Total Tax', parseFloat(statistics.summary.total_tax || '0')],
      ['Total Discount', parseFloat(statistics.summary.total_discount || '0')],
      ['Average Order Value', parseFloat(statistics.summary.average_order_value || '0')],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Write and download
    XLSX.writeFile(wb, `order-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!statistics) return;

    try {
      const response = await adminService.exportOrderReportPDF(selectedUserId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order-report-${new Date().toISOString().split('T')[0]}.pdf`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 py-12 sm:py-16 text-xs sm:text-sm text-slate-500">
        <p>Failed to load order statistics.</p>
        <button
          onClick={loadStatistics}
          className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Head title="Order Report" />
      <style dangerouslySetInnerHTML={{
        __html: `
          .recharts-wrapper,
          .recharts-wrapper *,
          .recharts-wrapper:focus,
          .recharts-wrapper:focus-visible,
          .recharts-wrapper:focus *,
          .recharts-surface,
          .recharts-surface *,
          .recharts-surface:focus,
          .recharts-surface:focus-visible,
          .recharts-surface:focus *,
          .recharts-surface svg,
          .recharts-wrapper svg,
          .recharts-surface svg *,
          .recharts-wrapper svg * {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
            stroke-width: 0 !important;
          }
          .recharts-legend-wrapper,
          .recharts-legend-wrapper *,
          .recharts-tooltip-wrapper,
          .recharts-tooltip-wrapper *,
          .recharts-cartesian-axis,
          .recharts-cartesian-axis *,
          .recharts-bar,
          .recharts-bar *,
          .recharts-pie,
          .recharts-pie *,
          .recharts-cell,
          .recharts-cell * {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .recharts-cartesian-grid line,
          .recharts-cartesian-axis-line {
            stroke: #e5e7eb !important;
          }
        `
      }} />

      <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
        <header className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">Order Report</h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                {selectedUserId
                  ? `Statistics for ${users.find((u) => u.id === selectedUserId)?.name || 'selected user'}`
                  : 'Total orders statistics and analytics.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex gap-2">
                <button
                  onClick={exportToPDF}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                  title="Export to PDF"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={exportToXLSX}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                  title="Export to Excel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  XLSX
                </button>
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                  title="Export to CSV"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
              </div>
              <Link
                href="/admin/orders"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
            <div className="text-xs sm:text-sm font-medium text-slate-500">Total Orders</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{statistics.summary.total_orders}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
            <div className="text-xs sm:text-sm font-medium text-slate-500">Total Revenue</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-elvee-blue">
              {formatCurrency(parseFloat(statistics.summary.total_revenue))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
            <div className="text-xs sm:text-sm font-medium text-slate-500">Average Order Value</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-feather-gold">
              {formatCurrency(parseFloat(statistics.summary.average_order_value))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
            <div className="text-xs sm:text-sm font-medium text-slate-500">Total Tax</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {formatCurrency(parseFloat(statistics.summary.total_tax))}
            </div>
          </div>
        </div>

        {/* Report Section with Toggle */}
        <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Order Statistics</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                    viewMode === 'graph'
                      ? 'bg-elvee-blue text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Graph
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                    viewMode === 'table'
                      ? 'bg-elvee-blue text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Table
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="user-filter" className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
                Filter by User:
              </label>
              <select
                id="user-filter"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs sm:text-sm text-slate-900 bg-white focus:border-slate-300 focus:ring-0 outline-none transition min-w-[180px] sm:min-w-[200px]"
                disabled={loadingUsers}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 sm:mt-10">
            {viewMode === 'graph' ? (
              <div className="space-y-10 sm:space-y-12">
              {/* Orders by Status Pie Chart */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">Orders by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.by_status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.status_label}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status_label"
                    >
                      {statistics.by_status.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(value, entry: any) => `${entry.payload.status_label} (${entry.payload.count})`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by Status Bar Chart */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">Revenue by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.by_status}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="status_label"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                          notation: 'compact',
                        }).format(value)
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value || 0)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {statistics.by_status.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Orders Over Time */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">Orders Over Time (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.by_date}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDate(value)}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => formatDate(value)}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#0E244D" name="Order Count" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="#AE8135" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </div>
            ) : (
              <div className="space-y-10 sm:space-y-12">
              {/* Orders by Status Table */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">Orders by Status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="border-b-2 border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] font-semibold text-slate-600 sm:text-xs">Status</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] font-semibold text-slate-600 sm:text-xs">Order Count</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] font-semibold text-slate-600 sm:text-xs">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statistics.by_status.map((item, index) => (
                        <tr key={item.status} className="hover:bg-slate-50/50 transition">
                          <td className="px-3 py-3 sm:px-4 sm:py-4">
                            <span className="font-semibold text-slate-900">{item.status_label}</span>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                            <span className="font-semibold text-slate-900">{item.count}</span>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                            <span className="font-semibold text-slate-900">{formatCurrency(item.revenue)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-300 bg-slate-50">
                      <tr>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-left font-bold text-slate-900">Total</td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-bold text-slate-900">
                          {statistics.summary.total_orders}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-right font-bold text-slate-900">
                          {formatCurrency(parseFloat(statistics.summary.total_revenue))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Orders Over Time Table */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-700 sm:text-base">Orders Over Time (Last 30 Days)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="border-b-2 border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] font-semibold text-slate-600 sm:text-xs">Date</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] font-semibold text-slate-600 sm:text-xs">Order Count</th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] font-semibold text-slate-600 sm:text-xs">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statistics.by_date.map((item) => (
                        <tr key={item.date} className="hover:bg-slate-50/50 transition">
                          <td className="px-3 py-3 sm:px-4 sm:py-4">
                            <span className="font-semibold text-slate-900">{formatDate(item.date)}</span>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                            <span className="font-semibold text-slate-900">{item.count}</span>
                          </td>
                          <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                            <span className="font-semibold text-slate-900">{formatCurrency(item.revenue)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

