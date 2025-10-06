'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ConfirmationDialog from './ConfirmationDialog'

export default function PackageList({ organizationId }) {
  const [packages, setPackages] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState(null)

  useEffect(() => {
    fetchPackages()
  }, [organizationId])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (pkg) => {
    setPackageToDelete(pkg)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!packageToDelete) return

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageToDelete.id)

      if (error) throw error
      fetchPackages()
      setShowDeleteDialog(false)
      setPackageToDelete(null)
    } catch (error) {
      console.error('Error deleting package:', error)
      alert('Error deleting package')
    }
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
    setPackageToDelete(null)
  }

  // Group packages by category
  const groupedPackages = packages.reduce((acc, pkg) => {
    const category = pkg.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(pkg)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Plan
        </button>
      </div>

      {/* Plans Display */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            All Plans ({packages.length})
          </h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading plans...</p>
            </div>
          ) : Object.keys(groupedPackages).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No plans created yet.</p>
              <p className="text-sm mt-1">Click "Create Plan" to add your first plan.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPackages).map(([category, categoryPackages]) => (
                <div key={category}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span>
                    {category}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-7">
                    {categoryPackages.map((pkg) => (
                      <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-semibold text-gray-900">{pkg.name}</h5>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(pkg)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Price:</span>
                            <span className="font-semibold text-green-600">₹{pkg.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>{pkg.duration_days} days</span>
                          </div>
                          {pkg.description && (
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="mt-1 text-xs">{pkg.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showForm || editingPackage) && (
        <PackageForm
          pkg={editingPackage}
          organizationId={organizationId}
          onClose={() => {
            setShowForm(false)
            setEditingPackage(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingPackage(null)
            fetchPackages()
          }}
        />
      )}

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Package"
        message={`Are you sure you want to delete "${packageToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

function PackageForm({ pkg, organizationId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: pkg?.category || '',
    name: pkg?.name || '',
    description: pkg?.description || '',
    duration_days: pkg?.duration_days || 30,
    price: pkg?.price || 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.category.trim()) {
        alert('Category is required')
        return
      }
      if (!formData.name.trim()) {
        alert('Plan name is required')
        return
      }
      if (!formData.duration_days || formData.duration_days <= 0) {
        alert('Duration must be greater than 0')
        return
      }
      if (!formData.price || formData.price <= 0) {
        alert('Price must be greater than 0')
        return
      }

      const packageData = {
        category: formData.category.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration_days: parseInt(formData.duration_days),
        price: parseFloat(formData.price)
      }

      console.log('Saving package:', packageData)

      if (pkg) {
        // Update
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', pkg.id)

        if (error) {
          console.error('Update error:', error)
          throw error
        }
      } else {
        // Create
        const { error } = await supabase
          .from('packages')
          .insert([{ ...packageData, organization_id: organizationId }])

        if (error) {
          console.error('Insert error:', error)
          throw error
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving package:', error)
      alert(`Error saving package: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {pkg ? 'Edit Plan' : 'Create New Plan'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Gym, Yoga, Personal Training"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Monthly, Quarterly, 3 Months"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (Days) *
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.duration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || '' }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || '' }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="2"
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              {loading ? 'Saving...' : (pkg ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
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
                    {pkg.name} (₹{pkg.price} - {pkg.duration_days} days)
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