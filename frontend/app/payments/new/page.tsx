'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomerDetail, CustomerList, PaginatedResponse } from '@/lib/types';
import { customerService, paymentService } from '@/lib/api-services';

export default function PaymentCreatePage() {
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    amount: '',
    billing_month: 'JANUARY' as 'JANUARY' | 'FEBRUARY' | 'MARCH' | 'APRIL' | 'MAY' | 'JUNE' | 'JULY' | 'AUGUST' | 'SEPTEMBER' | 'OCTOBER' | 'NOVEMBER' | 'DECEMBER',
    payment_method: 'CASH' as 'BANK_TRANSFER' | 'BKASH' | 'CASH' | 'NAGAD' | 'MOBILE_BANKING' | 'ONLINE_PAYMENT' | 'ROCKET' | 'OTHER',
    paid: false,
    transaction_id: '',
    payment_date: '',
    note: ''
  });

  // Fetch customers from backend with search
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      let filters: any = {};
      if (searchName) filters.name = searchName;
      if (searchPhone) filters.phone = searchPhone;
      const response: PaginatedResponse<CustomerList> = await customerService.getCustomers(1, 20, filters);
      setCustomers(
        (response.results || []).map((customer) => ({
          ...customer,
          package: customer.package || { name: '', price: '0', speed_mbps: 0 },
        }))
      );
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
      alert('Could not load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchName, searchPhone]);

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerDetail) => {
    setSelectedCustomer(customer);
    if (customer.package && typeof customer.package.price === 'string') {
      setFormData((prev) => ({
        ...prev,
        amount: customer.package.price ? customer.package.price.toString() : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, amount: '' }));
    }
  };

  // Validate form
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const paymentData = {
        customer_id: selectedCustomer.id,
        amount: formData.amount,
        billing_month: formData.billing_month,
        payment_method: formData.payment_method,
        paid: formData.paid,
        transaction_id: formData.transaction_id || undefined,
        payment_date: formData.payment_date || undefined,
        note: formData.note || undefined,
      };
      await paymentService.createPayment(paymentData);
      router.push(`/customers/${selectedCustomer.uid}/payments`);
    } catch (error: unknown) {
      console.error('Error creating payment:', error);
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as any).response?.data
      ) {
        const serverErrors = (error as any).response.data as Record<string, string>;
        setErrors(serverErrors);
      } else {
        alert('Failed to create payment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
    }).format(parseFloat(amount?.toString() || '0'));
  };

  if (loading && !customers.length && !selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-xl">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Search Customer</h2>
          <div className="flex flex-col gap-4 mb-4">
            <input
              type="text"
              placeholder="Customer Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-gray-900"
            />
            <button
              onClick={fetchCustomers}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              type="button"
            >
              Search
            </button>
          </div>
          <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-600 rounded-full border-t-transparent"></div>
              </div>
            ) : customers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <li
                    key={customer.uid}
                    onClick={() => handleCustomerSelect(customer)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                        {customer.email && (
                          <p className="text-xs text-gray-400">{customer.email}</p>
                        )}
                      </div>
                      {customer.package && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(customer.package.price || 0)}
                          </p>
                          <p className="text-xs text-gray-500">{customer.package.name}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-gray-500">No customers found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // After customer is selected, show the payment form and sidebar (copied from customer/[uid]/payments/new)
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
              <h1 className="text-2xl font-bold text-gray-900">Add Payment</h1>
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
                      onChange={(e) => setFormData(prev => ({ ...prev, billing_month: e.target.value as any }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
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
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Change Customer
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Payment'}
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
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Customer Name</span>
                    <p className="mt-1 text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone Number</span>
                    <p className="mt-1 text-sm text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  {selectedCustomer.email && (
                    <div>
                      <span className="text-sm text-gray-500">Email</span>
                      <p className="mt-1 text-sm text-gray-900">{selectedCustomer.email}</p>
                    </div>
                  )}
                  <div className="pt-4">
                    <Link
                      href={`/customers/${selectedCustomer.uid}`}
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View Customer Details →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Package Information</h3>
              </div>
              <div className="px-6 py-4">
                {selectedCustomer.package ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Package Name</span>
                      <p className="mt-1 text-sm font-medium text-gray-900">{selectedCustomer.package.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Speed</span>
                      <p className="mt-1 text-sm text-gray-900">{selectedCustomer.package.speed_mbps} Mbps</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Monthly Price</span>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCurrency(selectedCustomer.package.price || '0')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No package assigned</p>
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