'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CustomerDetail, PaymentList } from '@/lib/types';
import { customerService } from '@/lib/api-services';

export default function CustomerDetailPage() {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [payments, setPayments] = useState<PaymentList[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [allPayments, setAllPayments] = useState<PaymentList[]>([]);
  const [allPaymentsLoading, setAllPaymentsLoading] = useState(true);

  const params = useParams();
  const uid = params.uid as string;

  const fetchCustomerData = useCallback(async () => {
    try {
      setLoading(true);
      setPaymentsLoading(true);
      setAllPaymentsLoading(true);
      
      const [customerData, paymentsData, allPaymentsData] = await Promise.all([
        customerService.getCustomer(uid),
        customerService.getCustomerPayments(uid, 1, 10),
        customerService.getCustomerPayments(uid, 1, 1000) // Get all payments for totals
      ]);
      
      setCustomer(customerData);
      setPayments(paymentsData.results);
      setAllPayments(allPaymentsData.results);
    } catch (error: unknown) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
      setPaymentsLoading(false);
      setAllPaymentsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // Refresh data when page becomes visible (e.g., when navigating back from edit page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCustomerData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchCustomerData]);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(parseFloat(amount?.toString() || '0'));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate totals for all customer payments
  const totalAmount = allPayments.reduce((sum, payment) => {
    return sum + parseFloat(payment.bill_amount?.toString() || '0');
  }, 0);

  const paidAmount = allPayments
    .filter(payment => payment.paid)
    .reduce((sum, payment) => {
      return sum + parseFloat(payment.amount?.toString() || '0');
    }, 0);

  const pendingAmount = allPayments
    .filter(payment => !payment.paid)
    .reduce((sum, payment) => {
      return sum + parseFloat(payment.bill_amount?.toString() || '0');
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Customer not found</h2>
          <Link href="/customers" className="text-indigo-600 hover:text-indigo-500">
            Back to Customers
          </Link>
        </div>
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
              <Link href="/customers" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back to Customers
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/customers/${uid}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit Customer
              </Link>
              <Link
                href={`/customers/${uid}/payments/new`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Payment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email Address</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">National ID</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.nid || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Package Information</h2>
              </div>
              <div className="px-6 py-4">
                {customer.package ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Package Name</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.package.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Speed</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.package.speed_mbps} Mbps</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Monthly Price</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(customer.package.price || '0')}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No package assigned</p>
                )}
              </div>
            </div>

            {/* Connection Details */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Connection Details</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Connection Type</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.connection_type || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">IP Address</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.ip_address || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">MAC Address</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.mac_address || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{customer.username || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Recent Payments</h2>
                  <Link
                    href={`/customers/${uid}/payments`}
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="px-6 py-4">
                {paymentsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {payment.billing_month} {new Date().getFullYear()}
                              </p>
                              <p className="text-sm text-gray-500">{payment.payment_method}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                Bill: {formatCurrency(payment.bill_amount || '0')}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                Paid: {formatCurrency(payment.amount || '0')}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                payment.paid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.paid ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No payments found</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Status */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    customer.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Service Type</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    customer.is_free 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {customer.is_free ? 'Free Service' : 'Paid Service'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Connection Start</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {customer.connection_start_date ? formatDate(customer.connection_start_date) : 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Totals */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Summary</h3>
              </div>
              <div className="px-6 py-4">
                {allPaymentsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Payments</span>
                      <span className="text-sm font-medium text-gray-900">{allPayments.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Bill Amount</span>
                      <span className="text-sm font-medium text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Paid Amount</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Pending Amount</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(pendingAmount)}</span>
                    </div>
                    {pendingAmount > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          ⚠️ This customer has outstanding payments of {formatCurrency(pendingAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer ID & Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Customer ID</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">#{customer.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">UID</span>
                  <p className="mt-1 text-sm font-mono text-gray-900">{customer.uid}</p>
                </div>
                {customer.user && (
                  <div>
                    <span className="text-sm text-gray-500">User Account</span>
                    <p className="mt-1 text-sm text-gray-900">
                      {customer.user.first_name} {customer.user.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{customer.user.kind}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <Link
                  href={`/customers/${uid}/edit`}
                  className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Edit Customer
                </Link>
                <Link
                  href={`/customers/${uid}/payments/new`}
                  className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Add Payment
                </Link>
                <Link
                  href={`/customers/${uid}/payments`}
                  className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  View All Payments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
