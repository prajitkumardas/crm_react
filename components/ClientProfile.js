'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getStatusColor, getStatusLabel } from '../lib/packageUtils'

export default function ClientProfile({ clientId, organizationId, onBack, onEdit }) {
  const [client, setClient] = useState(null)
  const [clientPackages, setClientPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchClientData()
  }, [clientId])

  const fetchClientData = async () => {
    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      // Fetch client packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('client_packages')
        .select(`
          *,
          packages:package_id (*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (packagesError) throw packagesError

      setClient(clientData)
      setClientPackages(packagesData || [])
    } catch (error) {
      console.error('Error fetching client data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientStatus = () => {
    if (clientPackages.length === 0) return 'no_package'

    const activePackage = clientPackages.find(cp => cp.status === 'active') ||
                         clientPackages.find(cp => cp.status === 'expiring_soon') ||
                         clientPackages[0]

    return activePackage.status
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error

      onBack()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error deleting client')
    }
  }

  const handleExportPDF = () => {
    // PDF export functionality would go here
    alert('PDF export functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Client not found</p>
        <button onClick={onBack} className="btn-secondary mt-4">Go Back</button>
      </div>
    )
  }

  const status = getClientStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </button>
      </div>

      {/* Client Header Strip */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-xl font-semibold text-text-inverse">
                  {client.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </span>
                  <span className="text-text-secondary">{client.email}</span>
                  <span className="text-text-secondary">{client.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => onEdit(client)}
                className="btn-secondary flex items-center"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleExportPDF}
                className="btn-secondary flex items-center"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger flex items-center"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-border-light">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'packages', label: 'Packages', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'attendance', label: 'Attendance', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'notes', label: 'Notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Active Package</h3>
                {clientPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientPackages
                      .filter(cp => cp.status === 'active' || cp.status === 'expiring_soon')
                      .map((cp) => (
                        <div key={cp.id} className="border border-border-light rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-text-primary">{cp.packages?.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cp.status)}`}>
                              {getStatusLabel(cp.status)}
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary space-y-1">
                            <p>Start: {new Date(cp.start_date).toLocaleDateString()}</p>
                            <p>End: {new Date(cp.end_date).toLocaleDateString()}</p>
                            <p>Price: ${cp.packages?.price}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-text-secondary">No active packages</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Reminders Log</h3>
                <div className="space-y-2">
                  {clientPackages
                    .filter(cp => cp.status === 'expiring_soon' || cp.status === 'expired')
                    .map((cp) => (
                      <div key={cp.id} className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {cp.packages?.name} - {cp.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            Expires: {new Date(cp.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs text-warning-600">Reminder sent</span>
                      </div>
                    ))}
                  {clientPackages.filter(cp => cp.status === 'expiring_soon' || cp.status === 'expired').length === 0 && (
                    <p className="text-text-secondary">No reminders sent</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Package History</h3>
              {clientPackages.length > 0 ? (
                <div className="space-y-3">
                  {clientPackages.map((cp) => (
                    <div key={cp.id} className="border border-border-light rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-text-primary">{cp.packages?.name}</h4>
                          <p className="text-sm text-text-secondary">
                            {new Date(cp.start_date).toLocaleDateString()} - {new Date(cp.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cp.status)}`}>
                          {getStatusLabel(cp.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-secondary">Duration</p>
                          <p className="font-medium">{cp.packages?.duration_days} days</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Price</p>
                          <p className="font-medium">${cp.packages?.price}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Status</p>
                          <p className="font-medium">{getStatusLabel(cp.status)}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Assigned</p>
                          <p className="font-medium">{new Date(cp.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary">No packages assigned yet</p>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Attendance Records</h3>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <p className="text-info-700">Attendance tracking feature coming soon!</p>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Client Notes</h3>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <p className="text-info-700">Notes feature coming soon!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}