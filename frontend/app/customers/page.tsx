'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CustomerList, PackageList } from '@/lib/types';
import { customerService, packageService } from '@/lib/api-services';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerList[]>([]);
  const [packages, setPackages] = useState<PackageList[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [statusToggleLoading, setStatusToggleLoading] = useState<Record<string, boolean>>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [freeServiceFilter, setFreeServiceFilter] = useState<'all' | 'free' | 'paid'>('all');
  
  // Applied filters (what's actually being used for search)
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    phone: '',
    username: '',
    package_id: 'all' as string | number,
    is_active: 'all' as string | boolean,
    is_free: 'all' as string | boolean
  });

  // Initial load - only run once
  useEffect(() => {
    if (!initialLoadComplete) {
      setLoading(true);
      packageService.getPackages(1, 100)
        .then((pkgRes) => {
          setPackages(pkgRes.results || []);
        })
        .finally(() => {
          fetchData().finally(() => {
            setInitialLoadComplete(true);
            setLoading(false);
          });
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
        name?: string;
        phone?: string;
        username?: string;
        package_id?: number;
        is_active?: boolean;
        is_free?: boolean;
      } = {};
      if (appliedFilters.name.trim()) filters.name = appliedFilters.name.trim();
      if (appliedFilters.phone.trim()) filters.phone = appliedFilters.phone.trim();
      if (appliedFilters.username.trim()) filters.username = appliedFilters.username.trim();
      if (appliedFilters.package_id !== 'all') filters.package_id = parseInt(appliedFilters.package_id as string);
      if (appliedFilters.is_active !== 'all') filters.is_active = appliedFilters.is_active === 'active';
      if (appliedFilters.is_free !== 'all') filters.is_free = appliedFilters.is_free === 'free';
      
      const customersData = await customerService.getCustomers(currentPage, pageSize, filters);
      
      setCustomers(customersData.results);
      setTotalCount(customersData.count);
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) {
      try {
        await customerService.deleteCustomer(uid);
        fetchData(); // Refresh the list
      } catch (error: unknown) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. It may have associated payments or other dependencies.');
      }
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(parseFloat(amount?.toString() || '0'));
  };

  const handleSearch = () => {
    setAppliedFilters({
      name: nameFilter,
      phone: phoneFilter,
      username: usernameFilter,
      package_id: packageFilter,
      is_active: statusFilter,
      is_free: freeServiceFilter
    });
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setPhoneFilter('');
    setUsernameFilter('');
    setPackageFilter('all');
    setStatusFilter('all');
    setFreeServiceFilter('all');
    setAppliedFilters({
      name: '',
      phone: '',
      username: '',
      package_id: 'all',
      is_active: 'all',
      is_free: 'all'
    });
    setCurrentPage(1);
  };

  const handleGenerateBills = async () => {
    const month = prompt('Enter month for billing (e.g., JANUARY, FEBRUARY) or leave empty for current month:');
    if (month === null) return; // User cancelled
    
    try {
      await customerService.generateBills(month || undefined);
      alert('Bills generated successfully!');
      fetchData(); // Refresh the list to show new payments
    } catch (error) {
      console.error('Error generating bills:', error);
      alert('Failed to generate bills. Please try again.');
    }
  };

  const handleToggleStatus = async (username: string, currentStatus: boolean) => {
    if (!username) {
      alert('Username is required to toggle status');
      return;
    }

    const action = currentStatus ? 'disable' : 'enable';
    const confirmMessage = `Are you sure you want to ${action} customer "${username}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Set loading state for this specific customer
    setStatusToggleLoading(prev => ({ ...prev, [username]: true }));

    try {
      await customerService.toggleCustomerStatus(username, !currentStatus);
      alert(`Customer ${action}d successfully!`);
      fetchData(); // Refresh the list to show updated status
    } catch (error) {
      console.error('Error toggling customer status:', error);
      alert(`Failed to ${action} customer. Please try again.`);
    } finally {
      // Clear loading state for this customer
      setStatusToggleLoading(prev => ({ ...prev, [username]: false }));
    }
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
              <h1 className="text-2xl font-bold text-gray-900">Manage Customers</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateBills}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Generate Bills
              </button>
              <Link
                href="/customers/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add New Customer
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4">
              {/* Name Filter */}
              <div>
                <label htmlFor="name-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="name-filter"
                  type="text"
                  placeholder="Search by name..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Phone Filter */}
              <div>
                <label htmlFor="phone-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="phone-filter"
                  type="text"
                  placeholder="Search by phone..."
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Username Filter */}
              <div>
                <label htmlFor="username-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username-filter"
                  type="text"
                  placeholder="Search by username..."
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Package Filter */}
              <div>
                <label htmlFor="package-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Package
                </label>
                <select
                  id="package-filter"
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Packages</option>
                  {packages.map((pkg) => (
                    <option key={pkg.uid} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
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
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Free Service Filter */}
              <div>
                <label htmlFor="free-service-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  id="free-service-filter"
                  value={freeServiceFilter}
                  onChange={(e) => setFreeServiceFilter(e.target.value as 'all' | 'free' | 'paid')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="free">Free Service</option>
                  <option value="paid">Paid Service</option>
                </select>
              </div>

              {/* Page Size Selector */}
              <div>
                <label htmlFor="page-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Page Size
                </label>
                <select
                  id="page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
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

        {/* Customers Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Pagination Loading Indicator */}
          {paginationLoading && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
              <div className="flex items-center text-blue-700 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading page {currentPage}...
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 truncate">Name</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 truncate">Contact</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 truncate">Address</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 truncate">Status</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 truncate">Actions</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 truncate">Package</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 truncate">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-gray-50">
                    {/* Name (clickable) */}
                    <td className="px-2 py-4 whitespace-nowrap w-32 truncate">
                      <div className="truncate">
                        <Link href={`/customers/${customer.uid}`} className="text-sm font-medium text-indigo-600 hover:underline truncate">
                          {customer.name}
                        </Link>
                        <div className="text-sm text-gray-500 truncate">ID: #{customer.id}</div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-2 py-4 whitespace-nowrap w-32 truncate">
                      <div className="truncate">
                        <div className="text-sm text-gray-900 truncate">{customer.phone}</div>
                        {/* {customer.email && (
                          <div className="text-sm text-gray-500 truncate">{customer.email}</div>
                        )} */}
                      </div>
                    </td>
                    {/* Address */}
                    <td className="px-2 py-4 whitespace-nowrap w-40 truncate">
                      <div className="truncate">
                        <div className="text-sm text-gray-900 truncate">{customer.address || 'N/A'}</div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-2 py-4 whitespace-nowrap w-32 truncate">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (customer.is_active ?? false)
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(customer.is_active ?? false) ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleToggleStatus(customer.username!, customer.is_active ?? false)}
                          disabled={!customer.username || statusToggleLoading[customer.username!]}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            (customer.is_active ?? false)
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          title={customer.username ? `Click to ${(customer.is_active ?? false) ? 'disable' : 'enable'} customer` : 'Username required to toggle status'}
                        >
                          {statusToggleLoading[customer.username!] ? (
                            <span className="inline-flex items-center">
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </span>
                          ) : (
                            (customer.is_active ?? false) ? 'Disable' : 'Enable'
                          )}
                        </button>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium w-28 truncate">
                      <div className="flex space-x-2">
                        <Link
                          href={`/customers/${customer.uid}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(customer.uid!, customer.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                    {/* Package */}
                    <td className="px-2 py-4 whitespace-nowrap w-32 truncate">
                      <div className="truncate">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {customer.package?.name || 'N/A'}
                        </div>
                        {customer.package && (
                          <div className="text-sm text-gray-500 truncate">
                            {customer.package.speed_mbps} Mbps - {formatCurrency(customer.package.price || '0')}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Service Type */}
                    <td className="px-2 py-4 whitespace-nowrap w-20 truncate">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (customer.is_free ?? false)
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {(customer.is_free ?? false) ? 'Free' : 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {customers.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {nameFilter || phoneFilter || packageFilter !== 'all' || statusFilter !== 'all' || freeServiceFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating a new customer.'}
              </p>
              <div className="mt-6">
                <Link
                  href="/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Customer
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white shadow rounded-lg mt-6">
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                    <span className="text-gray-500 ml-2">({pageSize} per page)</span>
                  </p>
                </div>
                <div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}