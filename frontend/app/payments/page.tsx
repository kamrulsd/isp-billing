'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PaymentList } from '@/lib/types';
import { paymentService } from '@/lib/api-services';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentList[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filter input states
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');
  const [collectedByFilter, setCollectedByFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  
  // Applied filters (what's actually being used for search)
  const [appliedFilters, setAppliedFilters] = useState({
    customer_name: '',
    customer_phone: '',
    collected_by: '',
    month: ''
  });

  // Initial load - only run once
  useEffect(() => {
    if (!initialLoadComplete) {
      setLoading(true);
      fetchData().finally(() => {
        setInitialLoadComplete(true);
        setLoading(false);
      });
    }
  }, [initialLoadComplete]);

  // Fetch data when filters or pagination changes
  useEffect(() => {
    if (initialLoadComplete) {
      fetchData();
    }
  }, [currentPage, pageSize, appliedFilters, initialLoadComplete]);

  const fetchData = async () => {
    try {
      // Use paginationLoading for page changes, full loading for initial load
      if (initialLoadComplete) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }
      
      // Build filters object from applied filters
      const filters: {
        customer_name?: string;
        customer_phone?: string;
        collected_by?: string;
        month?: string;
      } = {};
      if (appliedFilters.customer_name.trim()) filters.customer_name = appliedFilters.customer_name.trim();
      if (appliedFilters.customer_phone.trim()) filters.customer_phone = appliedFilters.customer_phone.trim();
      if (appliedFilters.collected_by.trim()) filters.collected_by = appliedFilters.collected_by.trim();
      if (appliedFilters.month && appliedFilters.month !== 'all') filters.month = appliedFilters.month;
      
      const response = await paymentService.getPayments(currentPage, pageSize, filters);
      setPayments(response.results);
      setTotalCount(response.count);
    } catch (error: unknown) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  };

  const handleDelete = async (uid: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete payment for "${customerName}"? This action cannot be undone.`)) {
      try {
        await paymentService.deletePayment(uid);
        fetchData(); // Refresh the list
      } catch (error: unknown) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(parseFloat(amount?.toString() || '0'));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'CASH': 'bg-green-100 text-green-800',
      'BKASH': 'bg-blue-100 text-blue-800',
      'NAGAD': 'bg-purple-100 text-purple-800',
      'BANK_TRANSFER': 'bg-indigo-100 text-indigo-800',
      'MOBILE_BANKING': 'bg-teal-100 text-teal-800',
      'ONLINE_PAYMENT': 'bg-orange-100 text-orange-800',
      'ROCKET': 'bg-pink-100 text-pink-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // Client-side filtering for status and method (since backend doesn't support them)
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'paid' && payment.paid) ||
      (statusFilter === 'pending' && !payment.paid);

    const matchesMethod = 
      methodFilter === 'all' || 
      payment.payment_method === methodFilter;

    return matchesStatus && matchesMethod;
  });

  // Calculate totals for filtered payments
  const totalAmount = filteredPayments.reduce((sum, payment) => {
    return sum + parseFloat(payment.bill_amount?.toString() || '0');
  }, 0);

  const paidAmount = filteredPayments
    .filter(payment => payment.paid)
    .reduce((sum, payment) => {
      return sum + parseFloat(payment.amount?.toString() || '0');
    }, 0);

  const pendingAmount = filteredPayments
    .filter(payment => !payment.paid)
    .reduce((sum, payment) => {
      return sum + parseFloat(payment.bill_amount?.toString() || '0');
    }, 0);

  const handleSearch = () => {
    setAppliedFilters({
      customer_name: customerNameFilter,
      customer_phone: customerPhoneFilter,
      collected_by: collectedByFilter,
      month: monthFilter
    });
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearFilters = () => {
    setCustomerNameFilter('');
    setCustomerPhoneFilter('');
    setCollectedByFilter('');
    setMonthFilter('all');
    setStatusFilter('all');
    setMethodFilter('all');
    setAppliedFilters({
      customer_name: '',
      customer_phone: '',
      collected_by: '',
      month: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Manage Payments</h1>
            </div>
            <Link
              href="/payments/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add New Payment
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
              {/* Customer Name Filter */}
              <div>
                <label htmlFor="customer-name-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  id="customer-name-filter"
                  type="text"
                  placeholder="Search by customer name..."
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Customer Phone Filter */}
              <div>
                <label htmlFor="customer-phone-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Phone
                </label>
                <input
                  id="customer-phone-filter"
                  type="text"
                  placeholder="Search by customer phone..."
                  value={customerPhoneFilter}
                  onChange={(e) => setCustomerPhoneFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Collected By Filter */}
              <div>
                <label htmlFor="collected-by-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Collected By
                </label>
                <input
                  id="collected-by-filter"
                  type="text"
                  placeholder="Search by collector name..."
                  value={collectedByFilter}
                  onChange={(e) => setCollectedByFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Month Filter */}
              <div>
                <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Month
                </label>
                <select
                  id="month-filter"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Months</option>
                  <option value="JANUARY">January</option>
                  <option value="FEBRUARY">February</option>
                  <option value="MARCH">March</option>
                  <option value="APRIL">April</option>
                  <option value="MAY">May</option>
                  <option value="JUNE">June</option>
                  <option value="JULY">July</option>
                  <option value="AUGUST">August</option>
                  <option value="SEPTEMBER">September</option>
                  <option value="OCTOBER">October</option>
                  <option value="NOVEMBER">November</option>
                  <option value="DECEMBER">December</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'paid' | 'pending')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label htmlFor="method-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="method-filter"
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                  <option value="ONLINE_PAYMENT">Online Payment</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
                >
                  Search
                </button>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{filteredPayments.length}</div>
                <div className="text-sm text-gray-500">Total Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                <div className="text-sm text-gray-500">Total Bill Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
                <div className="text-sm text-gray-500">Paid Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(pendingAmount)}</div>
                <div className="text-sm text-gray-500">Pending Amount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Loading Indicator */}
        {paginationLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
            <div className="flex items-center text-blue-700 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading page {currentPage}...
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.customer?.name}</div>
                        <div className="text-sm text-gray-500">{payment.customer?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.billing_month} {new Date().getFullYear()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodColor(payment.payment_method || 'OTHER')}`}>
                            {payment.payment_method?.replace('_', ' ')}
                          </span>
                        </div>
                        {/* {payment.transaction_id && (
                          <div className="text-xs text-gray-400">ID: {payment.transaction_id}</div>
                        )} */}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.bill_amount || '0')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount || '0')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.paid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_date ? formatDate(payment.payment_date) : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/payments/${payment.uid}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/payments/${payment.uid}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(payment.uid!, payment.customer?.name || 'Unknown')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPayments.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {customerNameFilter || customerPhoneFilter || collectedByFilter || monthFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating a new payment.'}
              </p>
              <div className="mt-6">
                <Link
                  href="/payments/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Payment
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Page Size and Pagination */}
        <div className="bg-white shadow rounded-lg mt-6">
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <label htmlFor="page-size" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-500">per page</span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <>
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-end">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> results
                    </p>
                  </div>
                  <div className="ml-4">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 