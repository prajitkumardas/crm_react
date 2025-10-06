'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

export default function Analytics({ organizationId }) {
  const [analyticsData, setAnalyticsData] = useState({
    clients: [],
    packages: [],
    clientPackages: [],
    loading: true
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [organizationId])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all required data
      const [clientsRes, packagesRes, clientPackagesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('organization_id', organizationId),
        supabase
          .from('packages')
          .select('*')
          .eq('organization_id', organizationId),
        supabase
          .from('client_packages')
          .select(`
            *,
            clients:client_id (name),
            packages:package_id (name, price)
          `)
          .eq('clients.organization_id', organizationId)
      ])

      setAnalyticsData({
        clients: clientsRes.data || [],
        packages: packagesRes.data || [],
        clientPackages: clientPackagesRes.data || [],
        loading: false
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setAnalyticsData(prev => ({ ...prev, loading: false }))
    }
  }

  // Process data for different charts
  const getClientGrowthData = () => {
    const monthlyData = {}
    analyticsData.clients.forEach(client => {
      const month = new Date(client.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
      monthlyData[month] = (monthlyData[month] || 0) + 1
    })

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      clients: count
    })).slice(-6) // Last 6 months
  }

  const getPackageDistributionData = () => {
    const packageCount = {}
    analyticsData.clientPackages.forEach(cp => {
      const packageName = cp.packages?.name || 'Unknown'
      packageCount[packageName] = (packageCount[packageName] || 0) + 1
    })

    return Object.entries(packageCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / analyticsData.clientPackages.length) * 100).toFixed(1)
    }))
  }

  const getRevenueData = () => {
    const monthlyRevenue = {}
    analyticsData.clientPackages.forEach(cp => {
      const month = new Date(cp.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })
      const revenue = cp.packages?.price || 0
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + revenue
    })

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100
    })).slice(-6)
  }

  const getStatusDistributionData = () => {
    const statusCount = {
      active: 0,
      expired: 0,
      expiring_soon: 0,
      upcoming: 0
    }

    analyticsData.clientPackages.forEach(cp => {
      statusCount[cp.status] = (statusCount[cp.status] || 0) + 1
    })

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: status === 'active' ? '#10B981' :
             status === 'expired' ? '#EF4444' :
             status === 'expiring_soon' ? '#F59E0B' : '#6B7280'
    }))
  }

  const COLORS = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (analyticsData.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Analytics Dashboard</h1>
        <div className="text-sm text-text-secondary">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-text-secondary truncate">
                  Total Clients
                </dt>
                <dd className="text-2xl font-semibold text-text-primary">
                  {analyticsData.clients.length}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-text-secondary truncate">
                  Active Packages
                </dt>
                <dd className="text-2xl font-semibold text-text-primary">
                  {analyticsData.clientPackages.filter(cp => cp.status === 'active').length}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-text-secondary truncate">
                  Total Revenue
                </dt>
                <dd className="text-2xl font-semibold text-text-primary">
                  ₹{analyticsData.clientPackages.reduce((sum, cp) => sum + (cp.packages?.price || 0), 0).toFixed(2)}
                </dd>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-text-secondary truncate">
                  Expiring Soon
                </dt>
                <dd className="text-2xl font-semibold text-text-primary">
                  {analyticsData.clientPackages.filter(cp => cp.status === 'expiring_soon').length}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Growth Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Client Growth</h3>
            <p className="text-sm text-text-secondary">New clients over the last 6 months</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getClientGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clients"
                  stroke="#5B6CFF"
                  fill="#5B6CFF"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Distribution Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Package Distribution</h3>
            <p className="text-sm text-text-secondary">Most popular packages</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPackageDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPackageDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Revenue Trends</h3>
            <p className="text-sm text-text-secondary">Monthly revenue from packages</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getRevenueData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Package Status Distribution</h3>
            <p className="text-sm text-text-secondary">Current status of all packages</p>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusDistributionData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getStatusDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {analyticsData.packages.length}
            </div>
            <div className="text-sm text-text-secondary">Total Packages Created</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {Math.round((analyticsData.clientPackages.filter(cp => cp.status === 'active').length / Math.max(analyticsData.clientPackages.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-text-secondary">Active Package Rate</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-warning-600 mb-2">
              {analyticsData.clientPackages.filter(cp => cp.status === 'expired').length}
            </div>
            <div className="text-sm text-text-secondary">Expired Packages</div>
          </div>
        </div>
      </div>
    </div>
  )
}