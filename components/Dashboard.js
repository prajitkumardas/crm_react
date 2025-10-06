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

const COLORS = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444']

export default function Dashboard({ organizationId }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [showClientForm, setShowClientForm] = useState(false)
  const [packages, setPackages] = useState([])
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

  useEffect(() => {
    fetchDashboardData()

    // Set up real-time subscriptions
    const clientsSubscription = supabase
      .channel('clients_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'clients',
        filter: `organization_id=eq.${organizationId}`
      }, () => {
        fetchDashboardData()
      })
      .subscribe()

    const packagesSubscription = supabase
      .channel('packages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'packages',
        filter: `organization_id=eq.${organizationId}`
      }, () => {
        fetchDashboardData()
      })
      .subscribe()

    const clientPackagesSubscription = supabase
      .channel('client_packages_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_packages'
      }, () => {
        fetchDashboardData()
      })
      .subscribe()

    const checkinsSubscription = supabase
      .channel('checkins_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'checkins'
      }, () => {
        fetchDashboardData()
      })
      .subscribe()

    // Cleanup subscriptions
    return () => {
      clientsSubscription.unsubscribe()
      packagesSubscription.unsubscribe()
      clientPackagesSubscription.unsubscribe()
      checkinsSubscription.unsubscribe()
    }
  }, [organizationId])

  const fetchDashboardData = async () => {
    try {
      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)

      if (clientsError) throw clientsError

      // Fetch packages for the client form
      const { data: packagesData, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', organizationId)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (pkgError) throw pkgError
      setPackages(packagesData || [])

      // Fetch client packages with package details - filter by organization through client relationship
      const { data: clientPackages, error: packagesError } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients!inner (id, name, email, organization_id),
          packages:package_id (id, name, price, duration_days)
        `)
        .eq('clients.organization_id', organizationId)

      if (packagesError) throw packagesError

      // Fetch today's checkins - simplified query
      const today = new Date().toISOString().split('T')[0]
      const { data: allCheckins, error: checkinsError } = await supabase
        .from('checkins')
        .select(`
          *,
          clients (id, name, organization_id)
        `)
        .gte('check_in_time', today)

      // Filter checkins by organization in code
      const todaysCheckins = (allCheckins?.filter(checkin =>
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
      const totalClients = clients?.length || 0

      // New clients this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const newThisMonth = clients?.filter(client =>
        new Date(client.created_at) >= thisMonth
      ).length || 0

      // Last month for growth calculation
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      lastMonth.setDate(1)
      const lastMonthClients = clients?.filter(client =>
        new Date(client.created_at) >= lastMonth && new Date(client.created_at) < thisMonth
      ).length || 0

      const newJoinedGrowth = lastMonthClients > 0 ?
        ((newThisMonth - lastMonthClients) / lastMonthClients * 100) : 0

      // Active clients (clients with active packages)
      const activeClients = clientPackages?.filter(cp =>
        cp.status === 'active'
      ).length || 0

      // Revenue calculation (sum of package prices for active packages)
      const revenue = clientPackages?.filter(cp =>
        cp.status === 'active'
      ).reduce((sum, cp) => sum + (cp.packages?.price || 0), 0) || 0

      // Renewed (packages renewed this month)
      const renewedThisMonth = clientPackages?.filter(cp =>
        cp.status === 'active' &&
        new Date(cp.updated_at).getMonth() === new Date().getMonth() &&
        new Date(cp.updated_at).getFullYear() === new Date().getFullYear()
      ).length || 0

      // Expired plans
      const expiredPlans = clientPackages?.filter(cp =>
        cp.status === 'expired'
      ).slice(0, 5).map(cp => ({
        id: cp.id,
        client: cp.clients?.name || 'Unknown',
        clientId: `#${cp.clients?.id || 'N/A'}`,
        plan: cp.packages?.name || 'Unknown Plan'
      })) || []

      // Recently joined clients
      const recentlyJoined = clients?.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 3).map(client => ({
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
      })) || []

      // Today's attendance
      const todaysAttendance = todaysCheckins?.map(checkin => ({
        id: checkin.id,
        client: checkin.clients?.name || 'Unknown',
        plan: checkin.client_packages?.packages?.name || 'Unknown',
        time: new Date(checkin.check_in_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      })) || []

      // Package distribution
      const packageStats = {}
      clientPackages?.forEach(cp => {
        const duration = cp.packages?.duration_days
        let category = 'Other'
        if (duration <= 31) category = 'Monthly'
        else if (duration <= 93) category = 'Quarterly'
        else if (duration <= 186) category = 'Half-yearly'
        else category = 'Annually'

        packageStats[category] = (packageStats[category] || 0) + 1
      })

      const packageDistribution = Object.entries(packageStats).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))

      // Weekly data (mock for now - would need daily aggregation)
      const weeklyData = [
        { day: 'Sun', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Mon', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Tue', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Wed', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Thu', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Fri', clients: Math.floor(Math.random() * 20) + 40 },
        { day: 'Sat', clients: Math.floor(Math.random() * 20) + 40 }
      ]

      const dashboardData = {
        newJoined: { value: newThisMonth, growth: newJoinedGrowth },
        activeClients: { value: activeClients, growth: 8.2 }, // Mock growth
        revenue: { value: revenue, growth: 15.3 }, // Mock growth
        renewed: { value: renewedThisMonth, growth: -2.1 }, // Mock growth
        totalClients,
        clientGrowth: 20, // Mock
        expiredPlans,
        recentlyJoined,
        todaysAttendance,
        packageDistribution,
        weeklyData
      }

      console.log('Dashboard data calculated:', dashboardData)
      setDashboardData(dashboardData)

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
      <div className={`flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
          <p className="mt-4 text-gray-600">Loading...</p>
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('welcomeBack')}, Prajit
            </h1>
            <p className="text-text-secondary">
              {t('dashboardOverview')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <button className="flex items-center space-x-2 px-4 py-2 border border-border-light rounded-lg hover:bg-secondary-50 transition-colors">
              <Calendar className="h-4 w-4 text-secondary-600" />
              <span className="text-sm text-text-primary">Oct 18–Nov 18</span>
              <ChevronDown className="h-3 w-3 text-secondary-400" />
            </button>

            {/* Add Client Button */}
            <button
              onClick={() => setShowClientForm(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-text-inverse rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addClient')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-soft border border-border-light p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-50">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <GrowthIndicator growth={dashboardData.newJoined.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{dashboardData.newJoined.value}</p>
            <p className="text-sm text-gray-600 font-medium">{t('newJoined')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-border-light p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <GrowthIndicator growth={dashboardData.activeClients.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{dashboardData.activeClients.value}</p>
            <p className="text-sm text-gray-600 font-medium">{t('activeClients')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-border-light p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-50">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <GrowthIndicator growth={dashboardData.revenue.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(dashboardData.revenue.value)}</p>
            <p className="text-sm text-gray-600 font-medium">{t('revenue')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-border-light p-6 hover:shadow-medium transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-50">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <GrowthIndicator growth={dashboardData.renewed.growth} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{dashboardData.renewed.value}</p>
            <p className="text-sm text-gray-600 font-medium">{t('renewed')}</p>
          </div>
        </div>
      </div>

      {/* Top Row - Package Distribution, Recently Joined, Today's Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Package Distribution */}
        <div className="bg-white rounded-xl shadow-soft border border-border-light">
          <div className="p-6 border-b border-border-light">
            <h3 className="text-lg font-semibold text-gray-900">{t('packageDistribution')}</h3>
            <div className="flex space-x-4 mt-2">
              <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                <option>Gym</option>
              </select>
              <select className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dashboardData.packageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardData.packageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recently Joined */}
        <div className="bg-white rounded-xl shadow-soft border border-border-light">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('recentlyJoined')}</h3>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('seeAll')}</a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.recentlyJoined.map((client) => (
                <div key={client.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{client.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {client.clientId}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{client.plan.replace(' - ', ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">{client.joinDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl shadow-soft border border-border-light">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('todaysAttendance')}</h3>
                <p className="text-sm text-gray-600">{dashboardData.todaysAttendance.length} (+20 {t('fromYesterday')})</p>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('seeAll')}</a>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Plan</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.todaysAttendance.slice(0, 3).map((attendance) => (
                    <tr key={attendance.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-900">{attendance.client}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{attendance.plan}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{attendance.time}</td>
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
        <div className="bg-white rounded-xl shadow-soft border border-border-light">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('planExpired')}</h3>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">{t('seeAll')}</a>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.expiredPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{plan.client} {plan.clientId}</p>
                    <p className="text-sm text-gray-600">{plan.plan}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total Clients Chart */}
        <div className="bg-white rounded-xl shadow-soft border border-border-light">
          <div className="p-6 border-b border-border-light">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('totalClient')}</h3>
                <p className="text-sm text-gray-600">{dashboardData.totalClients} (+{dashboardData.clientGrowth} {t('increased')})</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Weekly</span>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg">Toggle</button>
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
                <Bar dataKey="clients" fill="#5B6CFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

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