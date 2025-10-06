'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getStatusColor, getStatusLabel } from '../lib/packageUtils'
import { exportClientsToExcel } from '../lib/exportUtils'
import ClientForm from './ClientForm'
import ConfirmationDialog from './ConfirmationDialog'

export default function ClientList({ organizationId, onClientSelect }) {
  const [clients, setClients] = useState([])
  const [packages, setPackages] = useState([])
  const [clientPackages, setClientPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)

  // Advanced filter states
  const [showFilters, setShowFilters] = useState(false)
  const [packageCategory, setPackageCategory] = useState('')
  const [packageType, setPackageType] = useState('')
  const [clientStatuses, setClientStatuses] = useState([])
  const [joinStatus, setJoinStatus] = useState('')
  const [gender, setGender] = useState('')
  const [ageGroup, setAgeGroup] = useState('')

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // Close menu and filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.menu-container')) {
        setOpenMenuId(null)
      }
      if (showFilters && !event.target.closest('.filters-container')) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId, showFilters])

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
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (packagesError) throw packagesError

      // Fetch client packages with status
      const { data: clientPackagesData, error: cpError } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients:client_id (id, name),
          packages:package_id (id, name, category)
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
    if (clientCPs.length === 0) return {
      packages: 'No Package',
      packageName: 'No Package',
      packageType: '-',
      status: 'No Package',
      expiryDate: null
    }

    const activePackage = clientCPs.find(cp => cp.status === 'active') ||
                          clientCPs.find(cp => cp.status === 'expiring_soon') ||
                          clientCPs[0]

    // Group packages by category and show specific assigned durations
    const categoryGroups = {}
    clientCPs.forEach(cp => {
      if (cp.packages?.category && cp.packages.category.includes(' - ')) {
        // Package has category in "Category - Duration" format
        const [category, duration] = cp.packages.category.split(' - ')
        if (category && duration) {
          if (!categoryGroups[category]) {
            categoryGroups[category] = []
          }
          if (!categoryGroups[category].includes(duration)) {
            categoryGroups[category].push(duration)
          }
        }
      } else if (cp.packages?.duration_days) {
        // Package doesn't have proper category, treat as uncategorized
        const category = 'Uncategorized'
        const duration = cp.packages.duration_days <= 31 ? 'Monthly' :
                        cp.packages.duration_days <= 93 ? 'Quarterly' :
                        cp.packages.duration_days <= 186 ? 'Half Yearly' : 'Yearly'

        if (!categoryGroups[category]) {
          categoryGroups[category] = []
        }
        if (!categoryGroups[category].includes(duration)) {
          categoryGroups[category].push(duration)
        }
      }
    })

    // Get primary package info for separate columns
    let category = 'No Package'
    let planName = '-'

    if (clientCPs.length > 0) {
      const activePackage = clientCPs.find(cp => cp.status === 'active') ||
                           clientCPs.find(cp => cp.status === 'expiring_soon') ||
                           clientCPs[0]

      if (activePackage?.packages?.category) {
        if (activePackage.packages.category.includes(' - ')) {
          // Parse category from "Category - Type" format
          const [pkgCategory, pkgType] = activePackage.packages.category.split(' - ')
          category = pkgCategory
          planName = activePackage.packages.name || pkgType
        } else {
          // Use category as is
          category = activePackage.packages.category
          planName = activePackage.packages.name
        }
      } else if (activePackage?.packages?.name) {
        // Fallback: use package name if no category
        category = 'Uncategorized'
        planName = activePackage.packages.name
      }
    }

    // Format display for combined packages column (for mobile)
    let formattedPackages = ''
    if (Object.keys(categoryGroups).length > 0) {
      formattedPackages = Object.entries(categoryGroups).map(([category, durations]) => {
        return `${category}\n${durations.join(', ')}`
      }).join('\n\n')
    } else {
      // Fallback: show package names if no categories
      formattedPackages = clientCPs.map(cp => cp.packages?.name).filter(Boolean).join(', ')
    }

    return {
      packages: formattedPackages || 'No Package',
      packageName: category,
      packageType: planName,
      status: activePackage.status,
      expiryDate: activePackage.end_date
    }
  }

  // Get unique package categories
  const getPackageCategories = () => {
    const categories = new Set()
    packages.forEach(pkg => {
      if (pkg.category) {
        if (pkg.category.includes(' - ')) {
          const [category] = pkg.category.split(' - ')
          categories.add(category.trim())
        } else {
          categories.add(pkg.category.trim())
        }
      }
    })
    return Array.from(categories).sort()
  }

  // Get package types for selected category
  const getPackageTypesForCategory = (category) => {
    if (!category) return []
    const types = new Set()
    packages.forEach(pkg => {
      if (pkg.category) {
        if (pkg.category.includes(' - ')) {
          const [pkgCategory, pkgType] = pkg.category.split(' - ')
          if (pkgCategory.trim() === category) {
            types.add(pkgType.trim())
          }
        } else if (pkg.category.trim() === category) {
          // For packages without " - " format, use duration-based type
          const duration = pkg.duration_days
          const type = duration <= 31 ? 'Monthly' :
                      duration <= 93 ? 'Quarterly' :
                      duration <= 186 ? 'Half Yearly' : 'Yearly'
          types.add(type)
        }
      }
    })
    return Array.from(types).sort()
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Get age group
  const getAgeGroup = (age) => {
    if (age === null) return null
    if (age >= 18 && age <= 25) return '18–25'
    if (age >= 26 && age <= 35) return '26–35'
    if (age >= 36 && age <= 45) return '36–45'
    return '46+'
  }

  // Check if client joined recently (last 1-7 days)
  const isRecentlyJoined = (createdAt) => {
    if (!createdAt) return false
    const joinDate = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - joinDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays >= 1 && diffDays <= 7
  }

  // Clear all filters
  const clearAllFilters = () => {
    setPackageCategory('')
    setPackageType('')
    setClientStatuses([])
    setJoinStatus('')
    setGender('')
    setAgeGroup('')
  }

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.phone?.includes(searchTerm)

    if (!matchesSearch) return false

    const clientInfo = getClientInfo(client.id)

    // Package Category filter
    if (packageCategory) {
      if (clientInfo.packageName !== packageCategory) return false
    }

    // Package Type filter
    if (packageType) {
      // If a category is selected, only check packages within that category
      const relevantPackages = packageCategory
        ? clientPackages.filter(cp => {
            if (cp.packages?.category?.includes(' - ')) {
              const [cat] = cp.packages.category.split(' - ')
              return cat?.trim() === packageCategory
            } else {
              return cp.packages?.category?.trim() === packageCategory
            }
          })
        : clientPackages.filter(cp => cp.client_id === client.id)

      const clientPackageTypes = relevantPackages
        .map(cp => {
          if (cp.packages?.category?.includes(' - ')) {
            const [, type] = cp.packages.category.split(' - ')
            return type?.trim()
          } else {
            const duration = cp.packages?.duration_days
            return duration <= 31 ? 'Monthly' :
                   duration <= 93 ? 'Quarterly' :
                   duration <= 186 ? 'Half Yearly' : 'Yearly'
          }
        })
        .filter(Boolean)

      if (!clientPackageTypes.includes(packageType)) return false
    }

    // Client Status filter (multi-select)
    if (clientStatuses.length > 0) {
      const currentStatus = clientInfo.status === 'No Package' ? 'no_package' : clientInfo.status
      if (!clientStatuses.includes(currentStatus)) return false
    }

    // Join Status filter
    if (joinStatus === 'recently_joined') {
      if (!isRecentlyJoined(client.created_at)) return false
    }

    // Gender filter
    if (gender) {
      if (client.gender !== gender) return false
    }

    // Age Group filter
    if (ageGroup) {
      const age = calculateAge(client.date_of_birth)
      const clientAgeGroup = getAgeGroup(age)
      if (clientAgeGroup !== ageGroup) return false
    }

    return true
  })

  const handleDelete = (client) => {
    setClientToDelete(client)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!clientToDelete) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id)

      if (error) throw error
      fetchData()
      setShowDeleteDialog(false)
      setClientToDelete(null)
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Error deleting client')
    }
  }

  const cancelDelete = () => {
    setShowDeleteDialog(false)
    setClientToDelete(null)
  }

  const handleExport = () => {
    try {
      exportClientsToExcel(filteredClients)
    } catch (error) {
      console.error('Error exporting clients:', error)
      alert('Error exporting data')
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
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Data
          </button>
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
          <div className="flex gap-2 relative filters-container">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                showFilters
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(packageCategory || packageType || clientStatuses.length > 0 || joinStatus || gender || ageGroup) && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">
                  {[packageCategory, packageType, ...clientStatuses, joinStatus, gender, ageGroup].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Package Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Category</label>
                    <select
                      value={packageCategory}
                      onChange={(e) => {
                        setPackageCategory(e.target.value)
                        setPackageType('') // Reset package type when category changes
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {getPackageCategories().map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Package Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                    <select
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value)}
                      disabled={!packageCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{packageCategory ? 'All Types' : 'Select category first'}</option>
                      {packageCategory && getPackageTypesForCategory(packageCategory).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Client Status (Multi-select) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Status</label>
                    <div className="space-y-2">
                      {[
                        { value: 'active', label: 'Active' },
                        { value: 'expiring_soon', label: 'Expiring Soon' },
                        { value: 'expired', label: 'Expired' },
                        { value: 'no_package', label: 'No Package' }
                      ].map(status => (
                        <label key={status.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={clientStatuses.includes(status.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setClientStatuses([...clientStatuses, status.value])
                              } else {
                                setClientStatuses(clientStatuses.filter(s => s !== status.value))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Join Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Join Status</label>
                    <select
                      value={joinStatus}
                      onChange={(e) => setJoinStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All</option>
                      <option value="recently_joined">Recently Joined (1-7 days)</option>
                    </select>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <div className="space-y-2">
                      {[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' }
                      ].map(genderOption => (
                        <label key={genderOption.value} className="flex items-center">
                          <input
                            type="radio"
                            name="gender"
                            value={genderOption.value}
                            checked={gender === genderOption.value}
                            onChange={(e) => setGender(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{genderOption.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Ages</option>
                      <option value="18–25">18–25</option>
                      <option value="26–35">26–35</option>
                      <option value="36–45">36–45</option>
                      <option value="46+">46+</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
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
              {searchTerm || packageCategory || packageType || clientStatuses.length > 0 || joinStatus || gender || ageGroup ? 'No clients found matching your criteria.' : 'No clients yet. Add your first client!'}
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
                          <div className="text-sm text-gray-500">{client.client_id || 'No ID'}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientInfo.status)}`}>
                        {getStatusLabel(clientInfo.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-start justify-between text-sm text-gray-600">
                      <span>{client.phone || 'No phone'}</span>
                      <div className="text-right text-xs">
                        {clientInfo.packages === 'No Package' ? (
                          <div className="text-gray-500">No Package</div>
                        ) : (
                          <div>
                            {clientInfo.packages.split('\n\n').map((categoryBlock, index) => {
                              const lines = categoryBlock.split('\n')
                              const category = lines[0]
                              const durations = lines.slice(1).join(', ')
                              return (
                                <div key={index} className="mb-1 last:mb-0">
                                  <div className="font-medium text-gray-900">{category} {durations}</div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => onClientSelect?.(client)}
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
                  Client ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan Name
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
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    {searchTerm || packageCategory || packageType || clientStatuses.length > 0 || joinStatus || gender || ageGroup ? 'No clients found matching your criteria.' : 'No clients yet. Add your first client!'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientInfo = getClientInfo(client.id)
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.client_id || 'N/A'}
                      </td>
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
                        {clientInfo.packageName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clientInfo.packageType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientInfo.status)}`}>
                          {getStatusLabel(clientInfo.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clientInfo.expiryDate ? new Date(clientInfo.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative menu-container">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        {openMenuId === client.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onClientSelect?.(client)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setShowForm(client)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(client.id)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
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

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Client"
        message={`Are you sure you want to delete "${clientToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
