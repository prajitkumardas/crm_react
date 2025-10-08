'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  exportClientsToExcel,
  exportPackagesToExcel,
  exportClientPackagesToExcel,
  exportClientsToCSV,
  exportClientReportToPDF,
  exportOrganizationReportToPDF
} from '../lib/exportUtils'

export default function ExportPanel({ organizationId, organization, dashboardStats }) {
  const [loading, setLoading] = useState(false)
  const [exportType, setExportType] = useState('')

  const handleExport = async (type) => {
    setLoading(true)
    setExportType(type)

    try {
      switch (type) {
        case 'clients-excel':
          const { data: clients } = await supabase
            .from('clients')
            .select(`
              *,
              client_id,
              name,
              gender,
              date_of_birth,
              phone,
              whatsapp_number,
              email,
              address,
              emergency_contact_name,
              emergency_contact_phone,
              created_at
            `)
            .eq('organization_id', organizationId)

          // Fetch client packages for package information
          const { data: clientsPackages } = await supabase
            .from('client_packages')
            .select(`
              *,
              clients:client_id (id, name),
              packages:package_id (id, name, category)
            `)
            .eq('clients.organization_id', organizationId)

          exportClientsToExcel(clients || [], clientsPackages || [])
          break

        case 'packages-excel':
          const { data: packages } = await supabase
            .from('packages')
            .select('*')
            .eq('organization_id', organizationId)
          exportPackagesToExcel(packages || [])
          break

        case 'client-packages-excel':
          const { data: clientPackages } = await supabase
            .from('client_packages')
            .select(`
              *,
              clients:client_id (name),
              packages:package_id (name, price)
            `)
            .eq('clients.organization_id', organizationId)
          exportClientPackagesToExcel(clientPackages || [])
          break

        case 'clients-csv':
          const { data: clientsCsv } = await supabase
            .from('clients')
            .select(`
              *,
              client_id,
              name,
              gender,
              date_of_birth,
              phone,
              whatsapp_number,
              email,
              address,
              emergency_contact_name,
              emergency_contact_phone,
              created_at
            `)
            .eq('organization_id', organizationId)
          exportClientsToCSV(clientsCsv || [])
          break

        case 'organization-pdf':
          exportOrganizationReportToPDF(organization, dashboardStats)
          break

        default:
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data')
    } finally {
      setLoading(false)
      setExportType('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
          <p className="text-gray-600 mt-1">Download your data in various formats</p>
        </div>
      </div>

      {/* Client Data Export */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Client Data Export</h3>
            <p className="text-sm text-gray-600">Export all client information and package assignments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExport('clients-excel')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-green-100 rounded-lg mb-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Excel</span>
            <span className="text-xs text-gray-500">.xlsx</span>
            {loading && exportType === 'clients-excel' && (
              <div className="mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
              </div>
            )}
          </button>

          <button
            onClick={() => handleExport('clients-csv')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-blue-100 rounded-lg mb-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">CSV</span>
            <span className="text-xs text-gray-500">.csv</span>
            {loading && exportType === 'clients-csv' && (
              <div className="mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              </div>
            )}
          </button>

          <button
            onClick={() => handleExport('client-packages-excel')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-purple-100 rounded-lg mb-2">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Package Data</span>
            <span className="text-xs text-gray-500">.xlsx</span>
            {loading && exportType === 'client-packages-excel' && (
              <div className="mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600"></div>
              </div>
            )}
          </button>

          <button
            onClick={() => handleExport('organization-pdf')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-red-100 rounded-lg mb-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">Summary Report</span>
            <span className="text-xs text-gray-500">.pdf</span>
            {loading && exportType === 'organization-pdf' && (
              <div className="mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Package Data Export */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Package Data Export</h3>
            <p className="text-sm text-gray-600">Export package definitions and pricing information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => handleExport('packages-excel')}
            disabled={loading}
            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <div className="p-2 bg-green-100 rounded-lg mb-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900">All Packages</span>
            <span className="text-xs text-gray-500">Excel</span>
            {loading && exportType === 'packages-excel' && (
              <div className="mt-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Single Client Export Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Single Client Export</h3>
            <p className="text-sm text-blue-700 mt-1">
              To export individual client reports, go to the client's profile page and click "Export PDF".
              This generates a detailed PDF report with the client's package history and information.
            </p>
          </div>
        </div>
      </div>

      {/* Export Guidelines */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">File Formats</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Excel (.xlsx)</strong>: Best for data analysis and manipulation</li>
              <li>• <strong>CSV</strong>: Compatible with most spreadsheet applications</li>
              <li>• <strong>PDF</strong>: Formatted reports for sharing and printing</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Included</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete client profile (name, gender, age, DOB)</li>
              <li>• Contact details (phone, WhatsApp, email, address)</li>
              <li>• Emergency contact information</li>
              <li>• Package assignments and status</li>
              <li>• Pricing and duration details</li>
              <li>• Organization summary statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}