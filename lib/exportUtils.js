import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Export clients data to Excel
 * @param {Array} clients - Array of client objects
 * @param {Array} clientPackages - Array of client package objects (optional)
 * @param {string} filename - Output filename
 */
export function exportClientsToExcel(clients, clientPackages = [], filename = 'clients.xlsx') {
  const data = clients.map(client => {
    // Get client package information
    let packageCategory = 'No Package'
    let packageName = '-'
    let packageStatus = 'No Package'
    let expiryDate = null

    if (clientPackages.length > 0) {
      const clientCPs = clientPackages.filter(cp => cp.client_id === client.id)
      if (clientCPs.length > 0) {
        const activePackage = clientCPs.find(cp => cp.status === 'active') ||
                             clientCPs.find(cp => cp.status === 'expiring_soon') ||
                             clientCPs[0]

        if (activePackage?.packages?.category) {
          if (activePackage.packages.category.includes(' - ')) {
            // Parse category from "Category - Type" format
            const [pkgCategory, pkgType] = activePackage.packages.category.split(' - ')
            packageCategory = pkgCategory
            packageName = activePackage.packages.name || pkgType
          } else {
            // Use category as is
            packageCategory = activePackage.packages.category
            packageName = activePackage.packages.name
          }
        } else if (activePackage?.packages?.name) {
          // Fallback: use package name if no category
          packageCategory = 'Uncategorized'
          packageName = activePackage.packages.name
        }

        packageStatus = activePackage.status
        expiryDate = activePackage.end_date
      }
    }

    return {
      'Client ID': client.client_id || 'N/A',
      'Name': client.name,
      'Gender': client.gender || '',
      'Date of Birth': client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : '',
      'Age': client.date_of_birth ? Math.floor((new Date() - new Date(client.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : '',
      'Phone': client.phone || '',
      'WhatsApp Number': client.whatsapp_number || '',
      'Email': client.email || '',
      'Address': client.address || '',
      'Emergency Contact Name': client.emergency_contact_name || '',
      'Emergency Contact Phone': client.emergency_contact_phone || '',
      'Package Category': packageCategory,
      'Package Name': packageName,
      'Package Status': packageStatus,
      'Package Expiry Date': expiryDate ? new Date(expiryDate).toLocaleDateString() : '-',
      'Created Date': new Date(client.created_at).toLocaleDateString()
    }
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clients')
  XLSX.writeFile(wb, filename)
}

/**
 * Export packages data to Excel
 * @param {Array} packages - Array of package objects
 * @param {string} filename - Output filename
 */
export function exportPackagesToExcel(packages, filename = 'packages.xlsx') {
  const data = packages.map(pkg => ({
    'Name': pkg.name,
    'Description': pkg.description || '',
    'Duration (Days)': pkg.duration_days,
    'Price': `₹${pkg.price}`,
    'Created Date': new Date(pkg.created_at).toLocaleDateString()
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Packages')
  XLSX.writeFile(wb, filename)
}

/**
 * Export client packages data to Excel
 * @param {Array} clientPackages - Array of client_package objects with related data
 * @param {string} filename - Output filename
 */
export function exportClientPackagesToExcel(clientPackages, filename = 'client-packages.xlsx') {
  const data = clientPackages.map(cp => ({
    'Client Name': cp.clients?.name || '',
    'Package Name': cp.packages?.name || '',
    'Start Date': new Date(cp.start_date).toLocaleDateString(),
    'End Date': new Date(cp.end_date).toLocaleDateString(),
    'Status': cp.status,
    'Price': cp.packages ? `₹${cp.packages.price}` : '',
    'Assigned Date': new Date(cp.created_at).toLocaleDateString()
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Client Packages')
  XLSX.writeFile(wb, filename)
}

/**
 * Export clients data to CSV
 * @param {Array} clients - Array of client objects
 * @param {string} filename - Output filename
 */
export function exportClientsToCSV(clients, filename = 'clients.csv') {
  const headers = ['Client ID', 'Name', 'Gender', 'Date of Birth', 'Age', 'Phone', 'WhatsApp Number', 'Email', 'Address', 'Emergency Contact Name', 'Emergency Contact Phone', 'Created Date']
  const data = clients.map(client => [
    client.client_id || 'N/A',
    client.name,
    client.gender || '',
    client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : '',
    client.date_of_birth ? Math.floor((new Date() - new Date(client.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : '',
    client.phone || '',
    client.whatsapp_number || '',
    client.email || '',
    client.address || '',
    client.emergency_contact_name || '',
    client.emergency_contact_phone || '',
    new Date(client.created_at).toLocaleDateString()
  ])

  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export single client report as PDF
 * @param {Object} client - Client object
 * @param {Array} clientPackages - Array of client's packages
 * @param {string} filename - Output filename
 */
export function exportClientReportToPDF(client, clientPackages, filename = 'client-report.pdf') {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text('Client Report', 20, 30)

  // Client Information
  doc.setFontSize(14)
  doc.text('Client Information', 20, 50)

  doc.setFontSize(12)
  let yPos = 65
  doc.text(`Client ID: ${client.client_id || 'N/A'}`, 20, yPos)
  doc.text(`Name: ${client.name}`, 20, yPos += 10)
  doc.text(`Gender: ${client.gender || 'N/A'}`, 20, yPos += 10)
  doc.text(`Date of Birth: ${client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'N/A'}`, 20, yPos += 10)

  if (client.date_of_birth) {
    const age = Math.floor((new Date() - new Date(client.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    doc.text(`Age: ${age} years`, 20, yPos += 10)
  }

  doc.text(`Phone: ${client.phone || 'N/A'}`, 20, yPos += 10)
  doc.text(`WhatsApp: ${client.whatsapp_number || 'N/A'}`, 20, yPos += 10)
  doc.text(`Email: ${client.email || 'N/A'}`, 20, yPos += 10)
  doc.text(`Address: ${client.address || 'N/A'}`, 20, yPos += 20)

  // Emergency Contact Section
  doc.setFontSize(14)
  doc.text('Emergency Contact', 20, yPos += 15)
  doc.setFontSize(12)
  doc.text(`Name: ${client.emergency_contact_name || 'N/A'}`, 20, yPos += 15)
  doc.text(`Phone: ${client.emergency_contact_phone || 'N/A'}`, 20, yPos += 10)
  doc.text(`Created: ${new Date(client.created_at).toLocaleDateString()}`, 20, yPos += 10)

  // Packages Table
  if (clientPackages.length > 0) {
    doc.text('Package History', 20, 145)

    const tableData = clientPackages.map(cp => [
      cp.packages?.name || 'N/A',
      new Date(cp.start_date).toLocaleDateString(),
      new Date(cp.end_date).toLocaleDateString(),
      cp.status,
      cp.packages ? `₹${cp.packages.price}` : 'N/A'
    ])

    doc.autoTable({
      startY: 155,
      head: [['Package', 'Start Date', 'End Date', 'Status', 'Price']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    })
  }

  doc.save(filename)
}

/**
 * Export organization summary report as PDF
 * @param {Object} organization - Organization object
 * @param {Object} stats - Dashboard statistics
 * @param {string} filename - Output filename
 */
export function exportOrganizationReportToPDF(organization, stats, filename = 'organization-report.pdf') {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(20)
  doc.text(`${organization.name} - Summary Report`, 20, 30)

  // Statistics
  doc.setFontSize(14)
  doc.text('Organization Statistics', 20, 50)

  doc.setFontSize(12)
  doc.text(`Total Clients: ${stats.totalClients}`, 20, 65)
  doc.text(`Expiring Soon: ${stats.expiringSoon}`, 20, 75)
  doc.text(`Expired: ${stats.expired}`, 20, 85)
  doc.text(`New This Month: ${stats.newThisMonth}`, 20, 95)
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 20, 105)

  doc.save(filename)
}