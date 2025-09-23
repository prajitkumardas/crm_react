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
    fetchPackages()
    fetchClients()
  }, [organizationId])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', organizationId)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (packageId) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId)

      if (error) throw error
      fetchPackages()
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
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Packages ({packages.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Add Package
            </button>
            <button
              onClick={() => setShowAssignmentForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Assign Package
            </button>
          </div>
        </div>

        <ul className="divide-y divide-gray-200">
          {packages.length === 0 ? (
            <li className="px-4 py-4 text-center text-gray-500">
              No packages yet. Add your first package!
            </li>
          ) : (
            packages.map((pkg) => (
              <li key={pkg.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{pkg.name}</h4>
                    <p className="text-sm text-gray-500">{pkg.description}</p>
                    <p className="text-sm text-gray-500">
                      Duration: {pkg.duration_days} days | Price: ${pkg.price}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowForm(pkg)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {showForm && (
        <PackageForm
          pkg={typeof showForm === 'object' ? showForm : null}
          organizationId={organizationId}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            fetchPackages()
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
    duration_days: pkg?.duration_days || 30,
    price: pkg?.price || 0
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (pkg) {
        // Update
        const { error } = await supabase
          .from('packages')
          .update(formData)
          .eq('id', pkg.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('packages')
          .insert([{ ...formData, organization_id: organizationId }])

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
              <input
                type="text"
                placeholder="Package Name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <textarea
                placeholder="Description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Duration (days)"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Price"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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