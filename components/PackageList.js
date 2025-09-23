'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PackageList({ organizationId }) {
  const [packages, setPackages] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch both packages and clients in parallel
      const [packagesResult, clientsResult] = await Promise.all([
        supabase
          .from('packages')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, name')
          .eq('organization_id', organizationId)
      ])

      if (packagesResult.error) throw packagesResult.error
      if (clientsResult.error) throw clientsResult.error

      setPackages(packagesResult.data || [])
      setClients(clientsResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('client_packages')
        .select('package_id, client_id')
        .eq('clients.organization_id', organizationId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching client packages:', error)
      return []
    }
  }

  const getAssignedClientsCount = (packageId) => {
    // This would need to be calculated from client_packages data
    // For now, return a placeholder
    return 0
  }

  const handleDelete = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting package:', error)
      alert('Error deleting package')
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading packages...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Package
          </button>
          <button
            onClick={() => setShowAssignmentForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Assign Package
          </button>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Packages ({packages.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Clients
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No packages yet. Add your first package!
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-sm text-gray-500">{pkg.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.duration_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${pkg.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getAssignedClientsCount(pkg.id)} clients
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setShowForm(pkg)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <PackageForm
          pkg={typeof showForm === 'object' ? showForm : null}
          organizationId={organizationId}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            fetchData()
          }}
        />
      )}

      {showAssignmentForm && (
        <PackageAssignmentForm
          packages={packages}
          clients={clients}
          organizationId={organizationId}
          onClose={() => setShowAssignmentForm(false)}
          onSave={() => {
            setShowAssignmentForm(false)
            // Could refresh some data here if needed
          }}
        />
      )}
    </div>
  )
}

function PackageForm({ pkg, organizationId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    duration_value: pkg?.duration_days ? Math.ceil(pkg.duration_days / 30) : 1,
    duration_unit: 'months', // days, weeks, months
    price: pkg?.price || 0
  })
  const [loading, setLoading] = useState(false)

  const convertToDays = (value, unit) => {
    switch (unit) {
      case 'days': return value
      case 'weeks': return value * 7
      case 'months': return value * 30
      default: return value
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const durationDays = convertToDays(
        parseInt(formData.duration_value),
        formData.duration_unit
      )

      const packageData = {
        name: formData.name,
        description: formData.description,
        duration_days: durationDays,
        price: parseFloat(formData.price)
      }

      if (pkg) {
        // Update
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', pkg.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('packages')
          .insert([{ ...packageData, organization_id: organizationId }])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error('Error saving package:', error)
      alert('Error saving package')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {pkg ? 'Edit Package' : 'Add New Package'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration *
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="duration_value"
                  required
                  min="1"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.duration_value}
                  onChange={handleInputChange}
                />
                <select
                  name="duration_unit"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.duration_unit}
                  onChange={handleInputChange}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total: {convertToDays(parseInt(formData.duration_value) || 0, formData.duration_unit)} days
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function PackageAssignmentForm({ packages, clients, organizationId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    client_id: '',
    package_id: '',
    start_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedPackage = packages.find(p => p.id === formData.package_id)
      if (!selectedPackage) throw new Error('Package not found')

      const startDate = new Date(formData.start_date)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + selectedPackage.duration_days)

      const { error } = await supabase
        .from('client_packages')
        .insert([{
          client_id: formData.client_id,
          package_id: formData.package_id,
          start_date: formData.start_date,
          end_date: endDate.toISOString().split('T')[0]
        }])

      if (error) throw error

      onSave()
    } catch (error) {
      console.error('Error assigning package:', error)
      alert('Error assigning package')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Assign Package to Client
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.package_id}
                onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
              >
                <option value="">Select Package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (${pkg.price} - {pkg.duration_days} days)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Package'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}