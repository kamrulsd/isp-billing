'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PackageDetail } from '@/lib/types';
import { packageService } from '@/lib/api-services';

export default function EditPackagePage() {
  const [packageData, setPackageData] = useState<PackageDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    speed_mbps: '',
    price: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  useEffect(() => {
    fetchPackage();
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const data = await packageService.getPackage(uid);
      setPackageData(data);
      setFormData({
        name: data.name || '',
        speed_mbps: data.speed_mbps?.toString() || '',
        price: data.price || '',
        description: data.description || ''
      });
    } catch (error) {
      console.error('Error fetching package:', error);
      alert('Failed to load package. Please try again.');
      router.push('/packages');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      newErrors.name = 'Package name is required';
    }

    if (!formData.speed_mbps.trim()) {
      newErrors.speed_mbps = 'Speed is required';
    } else if (isNaN(Number(formData.speed_mbps)) || Number(formData.speed_mbps) <= 0) {
      newErrors.speed_mbps = 'Speed must be a positive number';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await packageService.updatePackage(uid, {
        name: formData.name.trim(),
        speed_mbps: parseInt(formData.speed_mbps),
        price: formData.price,
        description: formData.description.trim() || undefined
      });
      
      router.push('/packages');
    } catch (error: unknown) {
      console.error('Error updating package:', error);
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
        const serverErrors = error.response.data as Record<string, string>;
        setErrors(serverErrors);
      } else {
        alert('Failed to update package. Please try again.');
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

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Package not found</h2>
          <Link href="/packages" className="text-indigo-600 hover:text-indigo-500">
            Back to Packages
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
              <Link href="/packages" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back to Packages
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Package Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Package Name *
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
                  placeholder="e.g., Basic Plan, Premium Plan"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Speed */}
              <div>
                <label htmlFor="speed_mbps" className="block text-sm font-medium text-gray-700">
                  Speed (Mbps) *
                </label>
                <input
                  type="number"
                  id="speed_mbps"
                  name="speed_mbps"
                  value={formData.speed_mbps}
                  onChange={handleChange}
                  min="1"
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                    errors.speed_mbps 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-1`}
                  placeholder="e.g., 50, 100, 500"
                />
                {errors.speed_mbps && (
                  <p className="mt-1 text-sm text-red-600">{errors.speed_mbps}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Monthly Price (BDT) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">৳</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    className={`block w-full pl-7 border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                      errors.price 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } focus:outline-none focus:ring-1`}
                    placeholder="0.00"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm text-gray-900 bg-white ${
                    errors.description 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-1`}
                  placeholder="Describe the package features, benefits, or any special notes..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Package Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Package Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Package ID:</span>
                    <span className="ml-2 font-medium text-gray-900">#{packageData.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {packageData.created_at ? new Date(packageData.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {packageData.updated_at ? new Date(packageData.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Preview */}
              {formData.name && formData.speed_mbps && formData.price && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Package Preview</h3>
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{formData.name}</h4>
                      <div className="text-3xl font-bold text-indigo-600 mb-2">
                                                 ৳{parseFloat(formData.price || '0').toFixed(2)}
                         <span className="text-lg font-normal text-gray-500">/month</span>
                      </div>
                      <p className="text-gray-600">{formData.speed_mbps} Mbps</p>
                      {formData.description && (
                        <p className="text-sm text-gray-500 mt-2">{formData.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/packages"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 