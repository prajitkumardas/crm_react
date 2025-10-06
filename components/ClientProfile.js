'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getStatusColor, getStatusLabel } from '../lib/packageUtils'
import { exportClientReportToPDF } from '../lib/exportUtils'

export default function ClientProfile({ clientId, organizationId, onClose }) {
  const [client, setClient] = useState(null)
  const [clientPackages, setClientPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')

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


  const handleExportPDF = () => {
    exportClientReportToPDF(client, clientPackages, `${client.name.replace(/\s+/g, '_')}-report.pdf`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-light">
          <h2 className="text-xl font-semibold text-text-primary">Client Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client Header - Two Column Layout */}
          <div className="bg-white rounded-lg shadow-sm border border-border-light p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Photo, Name, Client ID */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-semibold text-text-inverse">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
                  <div className="mt-2">
                    <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                      ID: {client.client_id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={handleExportPDF}
                  className="bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-50 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center h-12 whitespace-nowrap cursor-pointer"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-border-light">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'details', label: 'Client Details', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { id: 'plan', label: 'Plan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { id: 'attendance', label: 'Attendance', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
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
              {/* Client Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">First Name</label>
                          <p className="text-text-primary font-medium">{client.name?.split(' ')[0] || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Last Name</label>
                          <p className="text-text-primary font-medium">{client.name?.split(' ').slice(1).join(' ') || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Age</label>
                          <p className="text-text-primary font-medium">
                            {client.date_of_birth ? Math.max(10, Math.min(80, new Date().getFullYear() - new Date(client.date_of_birth).getFullYear())) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Gender</label>
                          <p className="text-text-primary font-medium">{client.gender ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1) : 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Date of Birth</label>
                          <p className="text-text-primary font-medium">
                            {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Client ID</label>
                          <p className="text-text-primary font-medium">{client.client_id || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Status</label>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Member Since</label>
                          <p className="text-text-primary font-medium">
                            {new Date(client.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Mobile Number</label>
                          <p className="text-text-primary font-medium">{client.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Email ID</label>
                          <p className="text-text-primary font-medium">{client.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Address</label>
                          <p className="text-text-primary font-medium">{client.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Emergency Contact Name</label>
                          <p className="text-text-primary font-medium">{client.emergency_contact_name || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary">Emergency Number</label>
                          <p className="text-text-primary font-medium">{client.emergency_contact_phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Plan Tab */}
              {activeTab === 'plan' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Active Package</h3>
                    {clientPackages.length > 0 ? (
                      <div className="space-y-4">
                        {clientPackages
                          .filter(cp => cp.status === 'active' || cp.status === 'expiring_soon')
                          .map((cp) => {
                            const getPlanType = (durationDays) => {
                              if (durationDays <= 31) return 'Monthly';
                              if (durationDays <= 93) return 'Quarterly';
                              if (durationDays <= 186) return 'Half-yearly';
                              return 'Yearly';
                            };

                            return (
                              <div key={cp.id} className="border border-border-light rounded-lg p-6 bg-white">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="text-xl font-bold text-text-primary mb-2">{cp.packages?.name}</h4>
                                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(cp.status)}`}>
                                      {getStatusLabel(cp.status)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-primary-600">₹{cp.packages?.price}</p>
                                    <p className="text-sm text-text-secondary">per {getPlanType(cp.packages?.duration_days).toLowerCase()}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Category</p>
                                    <p className="text-sm font-semibold text-text-primary mt-1">{cp.packages?.category || 'Uncategorized'}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Plan Type</p>
                                    <p className="text-sm font-semibold text-text-primary mt-1">{getPlanType(cp.packages?.duration_days)}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Assign Date</p>
                                    <p className="text-sm font-semibold text-text-primary mt-1">{new Date(cp.start_date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Expiry Date</p>
                                    <p className="text-sm font-semibold text-text-primary mt-1">{new Date(cp.end_date).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">Duration: {cp.packages?.duration_days} days</span>
                                    <span className="text-text-secondary">Assigned: {new Date(cp.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-text-secondary">No active packages</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Package History</h3>
                    {clientPackages.length > 0 ? (
                      <div className="space-y-4">
                        {clientPackages.map((cp) => {
                          const getPlanType = (durationDays) => {
                            if (durationDays <= 31) return 'Monthly';
                            if (durationDays <= 93) return 'Quarterly';
                            if (durationDays <= 186) return 'Half-yearly';
                            return 'Yearly';
                          };

                          return (
                            <div key={cp.id} className="border border-border-light rounded-lg p-6 bg-white">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="text-lg font-bold text-text-primary mb-2">{cp.packages?.name}</h4>
                                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(cp.status)}`}>
                                    {getStatusLabel(cp.status)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-primary-600">₹{cp.packages?.price}</p>
                                  <p className="text-sm text-text-secondary">per {getPlanType(cp.packages?.duration_days).toLowerCase()}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Category</p>
                                  <p className="text-sm font-semibold text-text-primary mt-1">{cp.packages?.category || 'Uncategorized'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Plan Type</p>
                                  <p className="text-sm font-semibold text-text-primary mt-1">{getPlanType(cp.packages?.duration_days)}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Assign Date</p>
                                  <p className="text-sm font-semibold text-text-primary mt-1">{new Date(cp.start_date).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Expiry Date</p>
                                  <p className="text-sm font-semibold text-text-primary mt-1">{new Date(cp.end_date).toLocaleDateString()}</p>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-text-secondary">Duration: {cp.packages?.duration_days} days</span>
                                  <span className="text-text-secondary">Assigned: {new Date(cp.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-text-secondary">No packages assigned yet</p>
                      </div>
                    )}
                  </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}