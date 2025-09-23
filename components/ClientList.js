'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getStatusColor, getStatusLabel } from '../lib/packageUtils'

export default function ClientList({ organizationId, onClientSelect }) {
  const [clients, setClients] = useState([])
  const [packages, setPackages] = useState([])
  const [clientPackages, setClientPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [organizationId])

  const fetchData = async () => {
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')

      if (clientsError) throw clientsError

      // Fetch packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', organizationId)

      if (packagesError) throw packagesError

      // Fetch client packages with status
      const { data: clientPackagesData, error: cpError } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients:client_id (id, name),
          packages:package_id (id, name)
        `)
        .eq('clients.organization_id', organizationId)

      if (cpError) throw cpError

      setClients(clientsData || [])
      setPackages(packagesData || [])
      setClientPackages(clientPackagesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get client packages and status
  const getClientInfo = (clientId) => {
    const clientCPs = clientPackages.filter(cp => cp.client_id === clientId)
    if (clientCPs.length === 0) return { packages: [], status: 'No Package', expiryDate: null }

    const activePackage = clientCPs.find(cp => cp.status === 'active') ||
                         clientCPs.find(cp => cp.status === 'expiring_soon') ||
                         clientCPs[0]

    const packageNames = clientCPs.map(cp => cp.packages?.name).filter(Boolean).join(', ')
    return {
      packages: packageNames,
      status: activePackage.status,
      expiryDate: activePackage.end_date
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm)

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true

    const clientInfo = getClientInfo(client.id)
    if (statusFilter === 'no_package') return clientInfo.status === 'No Package'
    return clientInfo.status === statusFilter
  })

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error deleting client')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'expiring_soon', label: 'Expiring Soon' },
              { value: 'expired', label: 'Expired' },
              { value: 'no_package', label: 'No Package' }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  statusFilter === filter.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Clients ({filteredClients.length})
          </h3>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          {filteredClients.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'No clients found matching your criteria.' : 'No clients yet. Add your first client!'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const clientInfo = getClientInfo(client.id)
                return (
                  <div key={client.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientInfo.status)}`}>
                        {getStatusLabel(clientInfo.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <span>{client.phone || 'No phone'}</span>
                      <span>{clientInfo.packages || 'No Package'}</span>
                    </div>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => onViewClient?.(client)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setShowForm(client)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package(s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No clients found matching your criteria.' : 'No clients yet. Add your first client!'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientInfo = getClientInfo(client.id)
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clientInfo.packages || 'No Package'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientInfo.status)}`}>
                          {getStatusLabel(clientInfo.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clientInfo.expiryDate ? new Date(clientInfo.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onViewClient?.(client)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setShowForm(client)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ClientForm
          client={typeof showForm === 'object' ? showForm : null}
          organizationId={organizationId}
          packages={packages}
          onClose={() => setShowForm(false)}
          onSave={() => {
            setShowForm(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function ClientForm({ client, organizationId, packages, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    age: client?.age || '',
    gender: client?.gender || '',
    mobileNumber: client?.mobileNumber || '',
    email: client?.email || '',
    address: client?.address || '',
    emergencyContactName: client?.emergencyContactName || '',
    emergencyNumber: client?.emergencyNumber || '',
    packageAssigned: client?.packageAssigned || '',
    personalTrainer: client?.personalTrainer || false,
    startDate: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Personal Information
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.age) newErrors.age = 'Age is required'
    else if (formData.age < 10 || formData.age > 80) newErrors.age = 'Age must be between 10 and 80'
    if (!formData.gender) newErrors.gender = 'Gender is required'

    // Contact Information
    if (!formData.mobileNumber) newErrors.mobileNumber = 'Mobile number is required'
    else if (!/^\d{10}$/.test(formData.mobileNumber)) newErrors.mobileNumber = 'Mobile number must be 10 digits'
    if (!formData.address.trim()) newErrors.address = 'Address is required'

    // Emergency Contact
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required'
    if (!formData.emergencyNumber) newErrors.emergencyNumber = 'Emergency number is required'
    else if (!/^\d{10}$/.test(formData.emergencyNumber)) newErrors.emergencyNumber = 'Emergency number must be 10 digits'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`

      if (client) {
        // Update client - for now, just update basic fields
        const { error } = await supabase
          .from('clients')
          .update({
            name: fullName,
            email: formData.email,
            phone: formData.mobileNumber,
            address: formData.address
          })
          .eq('id', client.id)

        if (error) throw error
      } else {
        // Create client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            name: fullName,
            email: formData.email,
            phone: formData.mobileNumber,
            address: formData.address,
            organization_id: organizationId
          }])
          .select()
          .single()

        if (clientError) throw clientError

        // Assign package if selected
        if (formData.packageAssigned && newClient) {
          const selectedPackage = packages.find(p => p.id === formData.packageAssigned)
          if (selectedPackage) {
            const startDate = new Date(formData.startDate)
            const endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + selectedPackage.duration_days)

            const { error: packageError } = await supabase
              .from('client_packages')
              .insert([{
                client_id: newClient.id,
                package_id: formData.packageAssigned,
                start_date: formData.startDate,
                end_date: endDate.toISOString().split('T')[0]
              }])

            if (packageError) throw packageError
          }
        }
      }

      onSave()
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Error saving client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">Add New Client</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.firstName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="mt-1 text-sm text-danger-600">{errors.firstName}</p>}
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="mt-1 text-sm text-danger-600">{errors.lastName}</p>}
              </div>
              <div>
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  className={`form-input ${errors.age ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter age (10-80)"
                />
                {errors.age && <p className="mt-1 text-sm text-danger-600">{errors.age}</p>}
              </div>
              <div>
                <label className="form-label">Gender *</label>
                <select
                  className={`form-input ${errors.gender ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-danger-600">{errors.gender}</p>}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.mobileNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                />
                {errors.mobileNumber && <p className="mt-1 text-sm text-danger-600">{errors.mobileNumber}</p>}
              </div>
              <div>
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="form-label">Address *</label>
                <textarea
                  rows="3"
                  className={`form-input ${errors.address ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
                {errors.address && <p className="mt-1 text-sm text-danger-600">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Emergency Contact Name *</label>
                <input
                  type="text"
                  className={`form-input ${errors.emergencyContactName ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
                {errors.emergencyContactName && <p className="mt-1 text-sm text-danger-600">{errors.emergencyContactName}</p>}
              </div>
              <div>
                <label className="form-label">Emergency Number *</label>
                <input
                  type="tel"
                  className={`form-input ${errors.emergencyNumber ? 'border-danger-500 focus:border-danger-500' : ''}`}
                  value={formData.emergencyNumber}
                  onChange={(e) => handleInputChange('emergencyNumber', e.target.value)}
                  placeholder="Enter 10-digit emergency number"
                  maxLength="10"
                />
                {errors.emergencyNumber && <p className="mt-1 text-sm text-danger-600">{errors.emergencyNumber}</p>}
              </div>
            </div>
          </div>

          {/* Package Assignment */}
          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">Package Assignment</h3>
            <div className="space-y-4">
              <div>
                <label className="form-label">Package Assigned</label>
                <select
                  className="form-input"
                  value={formData.packageAssigned}
                  onChange={(e) => handleInputChange('packageAssigned', e.target.value)}
                >
                  <option value="">Select a package</option>
                  {packages && packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ${pkg.price} ({pkg.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>

              {formData.packageAssigned && (
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="personalTrainer"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border-light rounded"
                  checked={formData.personalTrainer}
                  onChange={(e) => handleInputChange('personalTrainer', e.target.checked)}
                />
                <label htmlFor="personalTrainer" className="ml-2 text-sm text-text-primary">
                  Would you like to take a Personal Trainer?
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border-light">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Adding Client...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}