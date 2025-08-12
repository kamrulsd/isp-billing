'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PaymentDetail } from '@/lib/types';
import { paymentService } from '@/lib/api-services';

export default function PaymentEditPage() {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const [formData, setFormData] = useState({
    amount: '',
    billing_month: 'JANUARY' as 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER',
    payment_method: 'CASH' as 'BANK_TRANSFER' | 'BKASH' | 'CASH' | 'NAGAD' | 'MOBILE_BANKING' | 'ONLINE_PAYMENT' | 'ROCKET' | 'OTHER',
    paid: false,
    transaction_id: '',
    payment_date: '',
    note: ''
  });

  useEffect(() => {
    fetchPaymentData();
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const paymentData = await paymentService.getPayment(uid);
      setPayment(paymentData);
      
      // Pre-fill form data
      setFormData({
        amount: paymentData.amount || '',
        billing_month: paymentData.billing_month || 'JANUARY',
        payment_method: paymentData.payment_method || 'CASH',
        paid: paymentData.paid || false,
        transaction_id: paymentData.transaction_id || '',
        payment_date: paymentData.payment_date ? paymentData.payment_date.split('T')[0] : '',
        note: paymentData.note || ''
      });
    } catch (error: unknown) {
      console.error('Error fetching payment data:', error);
      alert('Failed to load payment data. Please try again.');
      router.push('/payments');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0';
    }

    if (!formData.billing_month) {
      newErrors.billing_month = 'Billing month is required';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    if (formData.transaction_id && formData.transaction_id.length > 100) {
      newErrors.transaction_id = 'Transaction ID must be less than 100 characters';
    }

    if (formData.note && formData.note.length > 500) {
      newErrors.note = 'Note must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const updateData = {
        amount: formData.amount,
        billing_month: formData.billing_month,
        payment_method: formData.payment_method,
        paid: formData.paid,
        transaction_id: formData.transaction_id || undefined,
        payment_date: formData.payment_date || undefined,
        note: formData.note || undefined
      };

      await paymentService.updatePayment(uid, updateData);
      router.push(`/payments/${uid}`);
    } catch (error: unknown) {
      console.error('Error updating payment:', error);
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const serverErrors = error.response.data as Record<string, string>;
        setErrors(serverErrors);
      } else {
        alert('Failed to update payment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(parseFloat(amount?.toString() || '0'));
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
              <Link href={`/payments/${uid}`} className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back to Payment Details
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Payment</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
                </div>
                <div className="px-6 py-4 space-y-6">
                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Amount (BDT)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.amount ? 'border-red-500' : ''
                      }`}
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                    )}
                  </div>

                  {/* Billing Month */}
                  <div>
                    <label htmlFor="billing_month" className="block text-sm font-medium text-gray-700">
                      Billing Month
                    </label>
                    <select
                      id="billing_month"
                      name="billing_month"
                      value={formData.billing_month}
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_month: e.target.value as 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER' }))}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.billing_month ? 'border-red-500' : ''
                      }`}
                    >
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
                    {errors.billing_month && (
                      <p className="mt-1 text-sm text-red-600">{errors.billing_month}</p>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                      Payment Method
                    </label>
                    <select
                      id="payment_method"
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'BANK_TRANSFER' | 'BKASH' | 'CASH' | 'NAGAD' | 'MOBILE_BANKING' | 'ONLINE_PAYMENT' | 'ROCKET' | 'OTHER' }))}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.payment_method ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="CASH">Cash</option>
                      <option value="BKASH">bKash</option>
                      <option value="NAGAD">Nagad</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MOBILE_BANKING">Mobile Banking</option>
                      <option value="ONLINE_PAYMENT">Online Payment</option>
                      <option value="ROCKET">Rocket</option>
                      <option value="OTHER">Other</option>
                    </select>
                    {errors.payment_method && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_method}</p>
                    )}
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="paid"
                        checked={formData.paid}
                        onChange={(e) => setFormData(prev => ({ ...prev, paid: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Payment Completed</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
                </div>
                <div className="px-6 py-4 space-y-6">
                  {/* Transaction ID */}
                  <div>
                    <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="transaction_id"
                      name="transaction_id"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.transaction_id ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter transaction ID"
                    />
                    {errors.transaction_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.transaction_id}</p>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
                      Payment Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="payment_date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      rows={3}
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className={`mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        errors.note ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter any additional notes..."
                    />
                    {errors.note && (
                      <p className="mt-1 text-sm text-red-600">{errors.note}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Link
                  href={`/payments/${uid}`}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating...' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
              </div>
              <div className="px-6 py-4">
                {payment.customer ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Customer Name</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{payment.customer.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phone Number</span>
                      <p className="mt-1 text-sm text-gray-900">{payment.customer.phone}</p>
                    </div>
                    {payment.customer.email && (
                      <div>
                        <span className="text-sm text-gray-500">Email</span>
                        <p className="mt-1 text-sm text-gray-900">{payment.customer.email}</p>
                      </div>
                    )}
                    <div className="pt-4">
                      <Link
                        href={`/customers/${payment.customer.uid}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        View Customer Details →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Customer information not available</p>
                )}
              </div>
            </div>

            {/* Payment Preview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Preview</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Amount</span>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {formatCurrency(formData.amount || '0')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.paid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Billing Month</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {formData.billing_month} {new Date().getFullYear()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <p className="mt-1 text-sm text-gray-900">
                    {formData.payment_method?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 