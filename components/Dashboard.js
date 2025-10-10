'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../lib/languageContext'
import { TrendingUp, TrendingDown, Edit, Bell, User, Calendar, Plus, ChevronDown } from 'lucide-react'
import ClientForm from './ClientForm'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#3A7AFE', '#10B981', '#FFA84C', '#EF4444']

export default function Dashboard({ organizationId }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [showClientForm, setShowClientForm] = useState(false)
  const [packages, setPackages] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 365) // Default to last 365 days to show more data
    return {
      start: startDate,
      end: endDate
    }
  })
  const [appliedDateRange, setAppliedDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 365) // Default to last 365 days to show more data
    return {
      start: startDate,
      end: endDate
    }
  }) // Applied date range for data fetching
  const [packageFilters, setPackageFilters] = useState({
    category: ''
  })
  const [recentlyJoinedFilter, setRecentlyJoinedFilter] = useState('today') // 'today', 'thisWeek', 'thisMonth'
  const [availableCategories, setAvailableCategories] = useState([])
  const [availableTypes, setAvailableTypes] = useState([])
  const [clientPackages, setClientPackages] = useState([]) // Store client packages separately
  const [clients, setClients] = useState([]) // Store clients separately
  const [dashboardData, setDashboardData] = useState({
    newJoined: { value: 0, growth: 0 },
    activeClients: { value: 0, growth: 0 },
    revenue: { value: 0, growth: 0 },
    renewed: { value: 0, growth: 0 },
    totalClients: 0,
    clientGrowth: 0,
    expiredPlans: [],
    recentlyJoined: [],
    todaysAttendance: [],
    packageDistribution: [],
    weeklyData: []
  })

  // Function to fetch data (defined outside useEffect for reuse)
  const fetchData = async () => {
    try {
      await fetchDashboardData()
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    let fetching = false

    // Reset loading state on mount
    setLoading(true)

    const doFetchData = async () => {
      if (fetching || !mounted) return
      fetching = true
      try {
        await fetchData()
      } finally {
        if (mounted) {
          fetching = false
        }
      }
    }

    doFetchData()

    // Set up real-time subscriptions with cleanup check
    const clientsSubscription = supabase
      .channel(`clients_changes_${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients',
        filter: `organization_id=eq.${organizationId}`
      }, () => {
        if (mounted && !fetching) {
          doFetchData()
        }
      })
      .subscribe()

    const packagesSubscription = supabase
      .channel(`packages_changes_${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'packages',
        filter: `organization_id=eq.${organizationId}`
      }, () => {
        if (mounted && !fetching) {
          doFetchData()
        }
      })
      .subscribe()

    const clientPackagesSubscription = supabase
      .channel(`client_packages_changes_${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_packages'
      }, () => {
        if (mounted && !fetching) {
          doFetchData()
        }
      })
      .subscribe()

    const checkinsSubscription = supabase
      .channel(`checkins_changes_${organizationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkins'
      }, () => {
        if (mounted && !fetching) {
          doFetchData()
        }
      })
      .subscribe()

    // Cleanup function
    return () => {
      mounted = false
      clientsSubscription.unsubscribe()
      packagesSubscription.unsubscribe()
      clientPackagesSubscription.unsubscribe()
      checkinsSubscription.unsubscribe()
    }
  }, [organizationId, appliedDateRange])

  // Separate effect for package distribution updates when filter changes
  useEffect(() => {
    if (clientPackages.length > 0) {
      updatePackageDistribution()
    }
  }, [packageFilters.category, clientPackages, appliedDateRange])

  // Separate effect for recently joined filter updates
  useEffect(() => {
    // Recalculate recently joined data when filter changes
    if (clients.length > 0) {
      updateRecentlyJoinedData()
    }
  }, [recentlyJoinedFilter, clients])

  // Reset loading state when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && loading) {
        // Component became visible again, reset loading if stuck
        setLoading(true)
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading])

  // Function to update recently joined data based on current filter
  const updateRecentlyJoinedData = () => {
    let filteredClients = clients?.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    ) || []

    const now = new Date()
    if (recentlyJoinedFilter === 'today') {
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      filteredClients = filteredClients.filter(client => new Date(client.created_at) >= today)
    } else if (recentlyJoinedFilter === 'thisWeek') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      filteredClients = filteredClients.filter(client => new Date(client.created_at) >= weekAgo)
    } else if (recentlyJoinedFilter === 'thisMonth') {
      const monthAgo = new Date(now)
      monthAgo.setDate(now.getDate() - 30)
      filteredClients = filteredClients.filter(client => new Date(client.created_at) >= monthAgo)
    }

    const recentlyJoined = filteredClients.slice(0, 10).map(client => ({
      id: client.id,
      clientId: client.client_id || 'N/A',
      name: client.name,
      plan: clientPackages?.find(cp => cp.client_id === client.id)?.packages?.name || 'No Plan',
      joinDate: new Date(client.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      initials: client.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }))

    // Update only the recently joined data in dashboard data
    setDashboardData(prev => ({
      ...prev,
      recentlyJoined
    }))
  }

  // Function to update package distribution based on current filters
  const updatePackageDistribution = (packages = clientPackages) => {
    const packageStats = {}

    packages.forEach(cp => {
      if (!cp.packages) return

      // Filter by date range - only include packages that started within the selected period
      const packageStartDate = new Date(cp.start_date)
      if (packageStartDate < appliedDateRange.start || packageStartDate > appliedDateRange.end) return

      let packageCategory = ''
      let packageType = ''

      if (cp.packages.category && cp.packages.category.includes(' - ')) {
        const [cat, type] = cp.packages.category.split(' - ')
        packageCategory = cat.trim()
        packageType = type.trim()
      } else if (cp.packages.category) {
        packageCategory = cp.packages.category.trim()
        // Fallback to duration-based type
        const duration = cp.packages.duration_days
        if (duration <= 31) packageType = 'Monthly'
        else if (duration <= 93) packageType = 'Quarterly'
        else if (duration <= 186) packageType = 'Half-yearly'
        else packageType = 'Annually'
      }

      // If a category is selected, show package types within that category
      // If no category is selected, show distribution by categories
      if (packageFilters.category) {
        // Show package types for the selected category
        if (packageCategory === packageFilters.category) {
          const distributionKey = packageType || 'Other'
          packageStats[distributionKey] = (packageStats[distributionKey] || 0) + 1
        }
      } else {
        // Show distribution by categories
        const distributionKey = packageCategory || 'Uncategorized'
        packageStats[distributionKey] = (packageStats[distributionKey] || 0) + 1
      }
    })

    const packageDistribution = Object.entries(packageStats).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }))

    // Update only the package distribution in dashboard data
    setDashboardData(prev => ({
      ...prev,
      packageDistribution
    }))
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch clients within date range
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', appliedDateRange.start.toISOString())
        .lte('created_at', appliedDateRange.end.toISOString())

      if (clientsError) throw clientsError
      setClients(clients || []) // Store clients separately

      // Fetch all clients for total count (not filtered by date)
      const { data: allClients, error: allClientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)

      if (allClientsError) throw allClientsError

      // Fetch packages for the client form
      const { data: packagesData, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (pkgError) throw pkgError
      setPackages(packagesData || [])

      // Extract available categories and types from packages
      const categories = new Set()
      const types = new Set()

      packagesData?.forEach(pkg => {
        if (pkg.category) {
          if (pkg.category.includes(' - ')) {
            const [cat] = pkg.category.split(' - ')
            categories.add(cat.trim())
          } else {
            categories.add(pkg.category.trim())
          }
        }

        // Extract type from duration or category
        if (pkg.category && pkg.category.includes(' - ')) {
          const [, type] = pkg.category.split(' - ')
          types.add(type.trim())
        } else {
          // Fallback to duration-based types
          const duration = pkg.duration_days
          if (duration <= 31) types.add('Monthly')
          else if (duration <= 93) types.add('Quarterly')
          else if (duration <= 186) types.add('Half-yearly')
          else types.add('Annually')
        }
      })

      setAvailableCategories(Array.from(categories).sort())
      setAvailableTypes(Array.from(types).sort())

      // Fetch client packages with package details - filter by organization through client relationship
      const { data: clientPackagesData, error: packagesError } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients (id, name, email, organization_id),
          packages:package_id (id, name, price, duration_days, category)
        `)

      if (packagesError) throw packagesError

      // Filter client packages by organization in code to make it more robust
      const clientPackages = clientPackagesData?.filter(cp => cp.clients?.organization_id === organizationId) || []
      setClientPackages(clientPackages) // Store client packages separately

      // Fetch checkins within date range
      const { data: allCheckins, error: checkinsError } = await supabase
        .from('checkins')
        .select(`
          *,
          clients (id, name, organization_id)
        `)
        .gte('check_in_time', appliedDateRange.start.toISOString().split('T')[0])
        .lte('check_in_time', appliedDateRange.end.toISOString().split('T')[0] + 'T23:59:59')

      // Filter checkins by organization in code
      const filteredCheckins = (allCheckins?.filter(checkin =>
        checkin.clients?.organization_id === organizationId
      ) || []).map(checkin => ({
        id: checkin.id,
        client: checkin.clients?.name || 'Unknown',
        plan: 'Package', // Simplified, could be enhanced later
        time: new Date(checkin.check_in_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }))

      if (checkinsError) {
        console.warn('Checkins fetch error (non-critical):', checkinsError.message)
      }

      // Calculate metrics
      const totalClients = allClients?.length || 0

      // New clients in selected date range
      const newInRange = clients?.length || 0

      // Calculate growth by comparing with previous period of same length
      const rangeDays = Math.ceil((appliedDateRange.end - appliedDateRange.start) / (1000 * 60 * 60 * 24))
      const previousStart = new Date(appliedDateRange.start)
      previousStart.setDate(previousStart.getDate() - rangeDays)
      const previousEnd = new Date(appliedDateRange.start)
      previousEnd.setDate(previousEnd.getDate() - 1)

      const { data: previousClients } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString())

      const previousPeriodCount = previousClients?.length || 0
      const newJoinedGrowth = previousPeriodCount > 0 ?
        ((newInRange - previousPeriodCount) / previousPeriodCount * 100) : 0

      // Active clients (clients with active packages in the selected period)
      const activeClients = clientPackages?.filter(cp =>
        cp.status === 'active' &&
        new Date(cp.start_date) <= appliedDateRange.end &&
        (cp.end_date === null || new Date(cp.end_date) >= appliedDateRange.start)
      ).length || 0

      // Revenue calculation (sum of package prices for active packages in the period)
      const revenue = clientPackages?.filter(cp =>
        cp.status === 'active' &&
        new Date(cp.start_date) <= appliedDateRange.end &&
        (cp.end_date === null || new Date(cp.end_date) >= appliedDateRange.start)
      ).reduce((sum, cp) => sum + (cp.packages?.price || 0), 0) || 0

      // Renewed (packages renewed in the selected period)
      const renewedInPeriod = clientPackages?.filter(cp =>
        cp.status === 'active' &&
        new Date(cp.updated_at) >= appliedDateRange.start &&
        new Date(cp.updated_at) <= appliedDateRange.end
      ).length || 0

      // Calculate renewed growth by comparing with previous period
      const { data: previousPackages } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients!inner (id, name, email, organization_id)
        `)
        .eq('clients.organization_id', organizationId)
        .gte('updated_at', previousStart.toISOString())
        .lte('updated_at', previousEnd.toISOString())
        .eq('status', 'active')

      const previousRenewedCount = previousPackages?.length || 0
      const renewedGrowth = previousRenewedCount > 0 ?
        ((renewedInPeriod - previousRenewedCount) / previousRenewedCount * 100) : 0

      // Expired plans in the selected period
      const expiredPlans = clientPackages?.filter(cp =>
        cp.status === 'expired' &&
        new Date(cp.end_date) >= dateRange.start &&
        new Date(cp.end_date) <= dateRange.end
      ).slice(0, 5).map(cp => ({
        id: cp.id,
        client: cp.clients?.name || 'Unknown',
        clientId: `#${cp.clients?.id || 'N/A'}`,
        plan: cp.packages?.name || 'Unknown Plan'
      })) || []

      // Recently joined data will be calculated separately when clients are loaded

      // Attendance in the selected period
      const todaysAttendance = filteredCheckins?.slice(0, 5) || []

      // Package distribution will be calculated separately when data is loaded

      // Weekly data - calculate based on selected date range
      const weeklyData = []
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(appliedDateRange.start)
        dayStart.setDate(dayStart.getDate() + i)
        const dayEnd = new Date(dayStart)
        dayEnd.setHours(23, 59, 59, 999)

        const dayClients = clients?.filter(client =>
          new Date(client.created_at).toDateString() === dayStart.toDateString()
        ).length || 0

        weeklyData.push({
          day: daysOfWeek[dayStart.getDay()],
          clients: dayClients
        })
      }

      const dashboardData = {
        newJoined: { value: newInRange, growth: newJoinedGrowth },
        activeClients: { value: activeClients, growth: 8.2 }, // Could calculate real growth
        revenue: { value: revenue, growth: renewedGrowth }, // Using renewed growth as revenue growth
        renewed: { value: renewedInPeriod, growth: renewedGrowth },
        totalClients,
        clientGrowth: 20, // Mock
        expiredPlans,
        recentlyJoined: [], // Will be updated separately
        todaysAttendance,
        packageDistribution: [], // Will be updated separately
        weeklyData
      }

      console.log('Dashboard data calculated for range:', appliedDateRange)
      setDashboardData(dashboardData)

      // Calculate package distribution and recently joined data after data is loaded
      updatePackageDistribution(clientPackages || [])
      updateRecentlyJoinedData()

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`
  }

  const GrowthIndicator = ({ growth }) => {
    const isPositive = growth >= 0
    return (
      <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(growth)}%
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('welcomeBack')}, Prajit
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboardOverview')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                {dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–{dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <ChevronDown className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Add Client Button */}
            <button
              onClick={() => setShowClientForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addClient')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <GrowthIndicator growth={dashboardData.newJoined.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{dashboardData.newJoined.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('newJoined')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <GrowthIndicator growth={dashboardData.activeClients.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{dashboardData.activeClients.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('activeClients')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <GrowthIndicator growth={dashboardData.revenue.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(dashboardData.revenue.value)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('revenue')}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <GrowthIndicator growth={dashboardData.renewed.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{dashboardData.renewed.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('renewed')}</p>
          </div>
        </div>
      </div>

      {/* Top Row - Package Distribution, Recently Joined, Today's Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Package Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {packageFilters.category ? 'Package Types' : t('packageDistribution')}
              </h3>
              <select
                value={packageFilters.category}
                onChange={(e) => setPackageFilters(prev => ({ ...prev, category: e.target.value }))}
                className="form-input text-sm w-auto"
              >
                <option value="">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-l">
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={dashboardData.packageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {dashboardData.packageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} clients`, name]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recently Joined */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recentlyJoined')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {dashboardData.recentlyJoined.length} client{dashboardData.recentlyJoined.length !== 1 ? 's' : ''}
                </p>
              </div>
              <select
                value={recentlyJoinedFilter}
                onChange={(e) => setRecentlyJoinedFilter(e.target.value)}
                className="form-input text-sm w-auto"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-m">
                {dashboardData.recentlyJoined.length > 0 ? (
                  dashboardData.recentlyJoined.map((client) => (
                    <div key={client.id} className="flex items-center space-x-m p-m rounded-medium hover:bg-bg-light dark:hover:bg-bg-dark transition-colors">
                      <div className="h-xxl w-xxl rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-small flex-shrink-0">
                        <span className="text-body font-semibold text-text-inverse">{client.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-body font-semibold text-text-primary dark:text-text-primary-dark">{client.name}</p>
                            <div className="mt-xs">
                              <span className="status-info">
                                {client.clientId}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-body text-text-secondary dark:text-text-secondary">{client.plan.replace(' - ', ' ')}</p>
                            <p className="text-caption text-text-muted dark:text-text-muted mt-xs">{client.joinDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-m">
                    <p className="text-body text-text-secondary dark:text-text-secondary">No clients joined in the selected period</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('todaysAttendance')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{dashboardData.todaysAttendance.length} (+20 {t('fromYesterday')})</p>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{t('seeAll')}</a>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {dashboardData.todaysAttendance.slice(0, 3).map((attendance) => (
                    <tr key={attendance.id} className="table-row-hover">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{attendance.client}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{attendance.plan}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{attendance.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Plan Expired and Total Clients Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Expired */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('planExpired')}</h3>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">{t('seeAll')}</a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.expiredPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.client} {plan.clientId}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{plan.plan}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-icon text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="btn-icon text-gray-400 hover:text-orange-600 dark:text-gray-500 dark:hover:text-orange-400">
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Clients Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('totalClient')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{dashboardData.totalClients} (+{dashboardData.clientGrowth} {t('increased')})</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Weekly</span>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">Toggle</button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dashboardData.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clients" fill="#3A7AFE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Date Range</h2>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value)
                    newStart.setHours(0, 0, 0, 0) // Set to start of day
                    setDateRange(prev => ({
                      ...prev,
                      start: newStart
                    }))
                  }}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value)
                    newEnd.setHours(23, 59, 59, 999) // Set to end of day
                    setDateRange(prev => ({
                      ...prev,
                      end: newEnd
                    }))
                  }}
                  className="form-input"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    // Reset to last 365 days
                    const endDate = new Date()
                    const startDate = new Date()
                    startDate.setDate(endDate.getDate() - 365)
                    const newRange = { start: startDate, end: endDate }
                    setDateRange(newRange)
                    setAppliedDateRange(newRange)
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Last 365 Days
                </button>
                <button
                  onClick={() => {
                    // Reset to this month
                    const now = new Date()
                    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    const newRange = { start: startDate, end: endDate }
                    setDateRange(newRange)
                    setAppliedDateRange(newRange)
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  This Month
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDatePicker(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setAppliedDateRange(dateRange)
                  setShowDatePicker(false)
                }}
                className="btn-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Form Modal */}
      {showClientForm && (
        <ClientForm
          client={null}
          organizationId={organizationId}
          packages={packages}
          onClose={() => setShowClientForm(false)}
          onSave={() => {
            setShowClientForm(false)
            fetchDashboardData() // Refresh dashboard data after adding client
          }}
        />
      )}
    </div>
  )
}