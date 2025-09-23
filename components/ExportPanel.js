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
            .select('*')
            .eq('organization_id', organizationId)
          exportClientsToExcel(clients || [])
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
            .select('*')
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
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Excel Exports</h4>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('clients-excel')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading && exportType === 'clients-excel' ? 'Exporting...' : 'Export Clients (.xlsx)'}
            </button>
            <button
              onClick={() => handleExport('packages-excel')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading && exportType === 'packages-excel' ? 'Exporting...' : 'Export Packages (.xlsx)'}
            </button>
            <button
              onClick={() => handleExport('client-packages-excel')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading && exportType === 'client-packages-excel' ? 'Exporting...' : 'Export Client Packages (.xlsx)'}
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Other Formats</h4>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('clients-csv')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading && exportType === 'clients-csv' ? 'Exporting...' : 'Export Clients (.csv)'}
            </button>
            <button
              onClick={() => handleExport('organization-pdf')}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading && exportType === 'organization-pdf' ? 'Exporting...' : 'Organization Report (.pdf)'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>• Excel files include detailed data with proper formatting</p>
        <p>• CSV files are compatible with most spreadsheet applications</p>
        <p>• PDF reports provide formatted summaries and statistics</p>
      </div>
    </div>
  )
}