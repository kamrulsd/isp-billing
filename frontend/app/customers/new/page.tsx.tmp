'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { customerService, packageService } from '@/lib/api-services';
import { PackageList } from '@/lib/types';

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  package_uid: string;
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageList[]>([]);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CustomerForm>();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await packageService.getPackages(1, 100);
        setPackages(response.results);
      } catch (err) {
        setError('Failed to load packages');
      }
    };
    fetchPackages();
  }, []);

  const onSubmit = async (data: CustomerForm) => {
    try {
      await customerService.createCustomer(data);
      router.push('/customers');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600">
            <h3 className="text-xl font-semibold text-white">New Customer Registration</h3>
            <p className="mt-1 text-sm text-indigo-100">
              Add a new customer to your ISP system
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="mt-2 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder-gray-400"
                  placeholder="Enter customer's full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...register('phone', { required: 'Phone number is required' })}
                  className="mt-2 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder-gray-400"
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-2 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder-gray-400"
                  placeholder="Enter email address (optional)"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Address Field */}
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-900">
                  Installation Address
                </label>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  rows={3}
                  className="mt-2 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm placeholder-gray-400"
                  placeholder="Enter complete installation address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.address.message}</p>
                )}
              </div>

              {/* Package Selection */}
              <div>
                <label htmlFor="package_uid" className="block text-sm font-semibold text-gray-900">
                  Internet Package
                </label>
                <select
                  {...register('package_uid', { required: 'Please select a package' })}
                  className="mt-2 block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                >
                  <option value="">Select a package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.uid} value={pkg.uid}>
                      {pkg.name} - {pkg.speed_mbps}Mbps (৳{pkg.price})
                    </option>
                  ))}
                </select>
                {errors.package_uid && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.package_uid.message}</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Creating Customer...</span>
                    </div>
                  ) : (
                    'Create Customer'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
