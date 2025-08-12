'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { CustomerDetail, PackageList } from '@/lib/types';
import { customerService, packageService } from '@/lib/api-services';

export default function EditCustomerPage() {
  const [customerData, setCustomerData] = useState<CustomerDetail | null>(null);
  const [packages, setPackages] = useState<PackageList[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    nid: '',
    package_id: '',
    ip_address: '',
    mac_address: '',
    username: '',
    password: '',
    connection_type: 'DHCP' as 'DHCP' | 'STATIC' | 'PPPoE',
    credentials: '',
    is_active: true,
    is_free: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setPackagesLoading(true);
      
      const [customerResponse, packagesResponse] = await Promise.all([
        customerService.getCustomer(uid),
        packageService.getPackages(1, 100)
      ]);
      
      setCustomerData(customerResponse);
      setPackages(packagesResponse.results);
      
      // Set form data
      setFormData({
        name: customerResponse.name || '',
        email: customerResponse.email || '',
        phone: customerResponse.phone || '',
        address: customerResponse.address || '',
        nid: customerResponse.nid || '',
        package_id: customerResponse.package?.id?.toString() || '',
        ip_address: customerResponse.ip_address || '',
        mac_address: customerResponse.mac_address || '',
        username: customerResponse.username || '',
        password: customerResponse.password || '',
        connection_type: customerResponse.connection_type || 'DHCP',
        credentials: customerResponse.credentials ? JSON.stringify(customerResponse.credentials, null, 2) : '',
        is_active: customerResponse.is_active ?? true,
        is_free: customerResponse.is_free ?? false
      });
    } catch {
      console.error('Error fetching data');
      alert('Failed to load customer data. Please try again.');
      router.push('/customers');
    } finally {
      setLoading(false);
      setPackagesLoading(false);
    }
  }, [uid, router]);

  useEffect(() => {
    fetchData();
    }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    // Phone validation - only validate if phone is provided
    if (formData.phone.trim() && formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.package_id) {
      newErrors.package_id = 'Please select a package';
    }

    if (formData.connection_type === 'STATIC' && !formData.ip_address) {
      newErrors.ip_address = 'IP address is required for STATIC connection';
    }

    if (!formData.username) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    // Validate JSON credentials if provided
    if (formData.credentials.trim()) {
      try {
        JSON.parse(formData.credentials);
      } catch {
        newErrors.credentials = 'Please enter valid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, starting update...');
    setSaving(true);
    
    try {
      console.log('Calling updateCustomer API...');
      await customerService.updateCustomer(uid, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        nid: formData.nid.trim() || undefined,
        package_id: parseInt(formData.package_id),
        ip_address: formData.ip_address.trim() || undefined,
        mac_address: formData.mac_address.trim() || undefined,
        username: formData.username.trim(),
        password: formData.password.trim(),
        connection_type: formData.connection_type,
        credentials: formData.credentials ? JSON.parse(formData.credentials) : undefined,
        is_active: formData.is_active,
        is_free: formData.is_free
      });
      
      console.log('Customer updated successfully, redirecting to:', `/customers/${uid}`);
      // Show success message and redirect to customer detail page
      setSuccess(true);
      
      // Redirect using window.location for more reliable navigation
      setTimeout(() => {
        console.log('Redirecting to customer detail page...');
        window.location.href = `/customers/${uid}`;
      }, 100);
      
    } catch (error: unknown) {
      console.error('Error updating customer:', error);
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const serverErrors = error.response.data as Record<string, string>;
        setErrors(serverErrors);
      } else {
        alert('Failed to update customer. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!customerData) {
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Customer updated successfully! Redirecting to customer details...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6" style={{ pointerEvents: success ? 'none' : 'auto', opacity: success ? 0.6 : 1 }}>
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="Enter customer's full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.phone 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="e.g., 01712345678 (optional)"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="customer@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* NID */}
                  <div>
                    <label htmlFor="nid" className="block text-sm font-medium text-gray-700">
                      National ID
                    </label>
                    <input
                      type="text"
                      id="nid"
                      name="nid"
                      value={formData.nid}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.nid 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="National ID number"
                    />
                    {errors.nid && (
                      <p className="mt-1 text-sm text-red-600">{errors.nid}</p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                      errors.address 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:outline-none focus:ring-1`}
                    placeholder="Enter customer's address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>

              {/* Package Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Package Selection</h3>
                <div>
                  <label htmlFor="package_id" className="block text-sm font-medium text-gray-700">
                    Internet Package *
                  </label>
                  <select
                    id="package_id"
                    name="package_id"
                    value={formData.package_id}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                      errors.package_id 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:outline-none focus:ring-1`}
                    disabled={packagesLoading}
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.uid} value={pkg.id}>
                        {pkg.name} - {pkg.speed_mbps} Mbps - ৳{pkg.price}/month
                      </option>
                    ))}
                  </select>
                  {errors.package_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.package_id}</p>
                  )}
                </div>
              </div>

              {/* Connection Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Connection Type */}
                  <div>
                    <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700">
                      Connection Type *
                    </label>
                    <select
                      id="connection_type"
                      name="connection_type"
                      value={formData.connection_type}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="DHCP">DHCP</option>
                      <option value="STATIC">Static IP</option>
                      <option value="PPPoE">PPPoE</option>
                    </select>
                  </div>

                  {/* IP Address */}
                  <div>
                    <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700">
                      IP Address {formData.connection_type === 'STATIC' && '*'}
                    </label>
                    <input
                      type="text"
                      id="ip_address"
                      name="ip_address"
                      value={formData.ip_address}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.ip_address 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="e.g., 192.168.1.100"
                    />
                    {errors.ip_address && (
                      <p className="mt-1 text-sm text-red-600">{errors.ip_address}</p>
                    )}
                  </div>

                  {/* MAC Address */}
                  <div>
                    <label htmlFor="mac_address" className="block text-sm font-medium text-gray-700">
                      MAC Address
                    </label>
                    <input
                      type="text"
                      id="mac_address"
                      name="mac_address"
                      value={formData.mac_address}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.mac_address 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="e.g., 00:11:22:33:44:55"
                    />
                    {errors.mac_address && (
                      <p className="mt-1 text-sm text-red-600">{errors.mac_address}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.username 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="Enter username"
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      } focus:outline-none focus:ring-1`}
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                </div>

                {/* Credentials */}
                <div className="mt-6">
                  <label htmlFor="credentials" className="block text-sm font-medium text-gray-700">
                    Additional Credentials (JSON)
                  </label>
                  <textarea
                    id="credentials"
                    name="credentials"
                    rows={4}
                    value={formData.credentials}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                      errors.credentials 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:outline-none focus:ring-1`}
                    placeholder='{"key": "value", "additional_info": "data"}'
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter additional credentials in JSON format (optional)
                  </p>
                  {errors.credentials && (
                    <p className="mt-1 text-sm text-red-600">{errors.credentials}</p>
                  )}
                </div>
              </div>

              {/* Customer Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Status</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {/* Account Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Account Status</h4>
                      <p className="text-sm text-gray-500">Enable or disable this customer&apos;s account</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {formData.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Free Service Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Free Service</h4>
                      <p className="text-sm text-gray-500">Mark this customer as receiving free service (no billing)</p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="is_free"
                          checked={formData.is_free}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_free: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {formData.is_free ? 'Free Service' : 'Paid Service'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Customer ID:</span>
                    <span className="ml-2 font-medium text-gray-900">#{customerData.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Connection Start:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {customerData.connection_start_date ? new Date(customerData.connection_start_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/customers"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || packagesLoading || success}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {success ? 'Updated Successfully!' : (saving ? 'Saving...' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
