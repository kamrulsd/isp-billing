'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentDetail } from '@/lib/types';
import { paymentService } from '@/lib/api-services';

export default function PaymentDetailPage() {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  useEffect(() => {
    fetchPaymentData();
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const paymentData = await paymentService.getPayment(uid);
      setPayment(paymentData);
    } catch (error: unknown) {
      console.error('Error fetching payment data:', error);
      alert('Failed to load payment data. Please try again.');
      router.push('/payments');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Payment not found</h2>
          <Link href="/payments" className="text-indigo-600 hover:text-indigo-500">
            Back to Payments
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
              <Link href="/payments" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back to Payments
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/payments/${uid}/edit`}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit Payment
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Amount</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(payment.amount || '0')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`mt-1 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      payment.paid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Billing Month</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {payment.billing_month} {new Date().getFullYear()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                    <span className={`mt-1 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentMethodColor(payment.payment_method || 'OTHER')}`}>
                      {payment.payment_method?.replace('_', ' ')}
                    </span>
                  </div>
                  {payment.transaction_id && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                      <p className="mt-1 text-sm font-mono text-gray-900">{payment.transaction_id}</p>
                    </div>
                  )}
                  {payment.payment_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(payment.payment_date)}</p>
                    </div>
                  )}
                </div>
                {payment.note && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-500">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{payment.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
              </div>
              <div className="px-6 py-4">
                {payment.customer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Customer Name</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.customer.phone}</p>
                    </div>
                    {payment.customer.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{payment.customer.email}</p>
                      </div>
                    )}
                    {payment.customer.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Address</label>
                        <p className="mt-1 text-sm text-gray-900">{payment.customer.address}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer information not available</p>
                )}
              </div>
            </div>

            {/* Entry Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Entry Information</h2>
              </div>
              <div className="px-6 py-4">
                {payment.entry_by ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Entered By</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {payment.entry_by.first_name} {payment.entry_by.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{payment.entry_by.phone}</p>
                    </div>
                    {payment.entry_by.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{payment.entry_by.email}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Entry information not available</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment ID & Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Payment ID</span>
                  <p className="mt-1 text-sm font-medium text-gray-900">#{payment.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">UID</span>
                  <p className="mt-1 text-sm font-mono text-gray-900">{payment.uid}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {payment.created_at ? formatDate(payment.created_at) : 'Not available'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {payment.updated_at ? formatDate(payment.updated_at) : 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                <Link
                  href={`/payments/${uid}/edit`}
                  className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Edit Payment
                </Link>
                {payment.customer && (
                  <Link
                    href={`/customers/${payment.customer.uid}`}
                    className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    View Customer
                  </Link>
                )}
                <Link
                  href="/payments"
                  className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Back to Payments
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 