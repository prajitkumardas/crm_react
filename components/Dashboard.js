'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDashboardStats, getStatusColor, getStatusLabel } from '../lib/packageUtils'
import { UserPlus, FileText, Users, AlertTriangle, TrendingUp, CheckCircle, Mail } from 'lucide-react'

export default function Dashboard({ organizationId }) {
  const [stats, setStats] = useState({
    totalClients: 0,
    expired: 0,
    newThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [clientsData, setClientsData] = useState([])
  const [clientPackagesData, setClientPackagesData] = useState([])

  const getClientInfo = (clientId) => {
    const clientPackages = clientPackagesData.filter(cp => cp.client_id === clientId)
    if (clientPackages.length === 0) return { status: 'no_package' }

    const activePackage = clientPackages.find(cp => cp.status === 'active') ||
                         clientPackages.find(cp => cp.status === 'expiring_soon') ||
                         clientPackages[0]

    return { status: activePackage.status }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [organizationId])

  const fetchDashboardData = async () => {
    try {
      // Fetch clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)

      // Fetch client packages
      const { data: clientPackagesData } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients:client_id (name, email),
          packages:package_id (name)
        `)
        .eq('clients.organization_id', organizationId)

      // Store data for component use
      setClientsData(clientsData || [])
      setClientPackagesData(clientPackagesData || [])

      // Calculate stats
      const dashboardStats = getDashboardStats(clientPackagesData || [], clientsData || [])
      setStats(dashboardStats)

      // Generate recent activity based on real data
      const activity = []

      // Add recent client additions
      if (clientsData) {
        clientsData.slice(0, 2).forEach(client => {
          activity.push({
            id: `client-${client.id}`,
            type: 'client_added',
            message: `${client.name} joined`,
            time: new Date(client.created_at).toLocaleDateString()
          })
        })
      }

      // Add recent package assignments
      if (clientPackagesData) {
        clientPackagesData.slice(0, 2).forEach(cp => {
          activity.push({
            id: `package-${cp.id}`,
            type: 'package_assigned',
            message: `${cp.packages?.name} assigned to ${cp.clients?.name}`,
            time: new Date(cp.created_at).toLocaleDateString()
          })
        })
      }

      // If no real activity, add mock data
      if (activity.length === 0) {
        activity.push(
          {
            id: 1,
            type: 'client_added',
            message: 'Welcome to Smart Client Manager!',
            time: 'Just now'
          }
        )
      }

      setRecentActivity(activity)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Compact Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Today's Overview</h1>
          <p className="text-text-secondary">Monitor your client management metrics</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex items-center">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </button>
          <button className="btn-secondary flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards - Color Coded */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="card border-l-4 border-info-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Total Clients</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.totalClients}</p>
              </div>
              <div className="p-3 rounded-xl bg-info-100">
                <Users className="h-6 w-6 text-info-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-warning-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Expiring Soon</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.expiringSoon}</p>
              </div>
              <div className="p-3 rounded-xl bg-warning-100">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-danger-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Expired</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.expired}</p>
              </div>
              <div className="p-3 rounded-xl bg-danger-100">
                <AlertTriangle className="h-6 w-6 text-danger-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-success-500">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">New This Month</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{stats.newThisMonth}</p>
              </div>
              <div className="p-3 rounded-xl bg-success-100">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Components Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Recent Clients</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {clientsData?.slice(0, 5).map((client) => {
                const clientInfo = getClientInfo(client.id)
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-sm font-medium text-text-inverse">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{client.name}</p>
                        <p className="text-xs text-text-secondary">{client.email || 'No email'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientInfo.status)}`}>
                      {getStatusLabel(clientInfo.status)}
                    </span>
                  </div>
                )
              })}
              {(!clientsData || clientsData.length === 0) && (
                <p className="text-text-secondary text-center py-4">No clients yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Packages Timeline */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-text-primary">Expiring Soon</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {clientPackagesData
                ?.filter(cp => cp.status === 'expiring_soon')
                .slice(0, 5)
                .map((cp) => (
                  <div key={cp.id} className="flex items-center justify-between p-3 rounded-lg bg-warning-50 border border-warning-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-warning-100 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-warning-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{cp.clients?.name}</p>
                        <p className="text-xs text-text-secondary">{cp.packages?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(cp.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-warning-600">Expires soon</p>
                    </div>
                  </div>
                ))}
              {(!clientPackagesData || clientPackagesData.filter(cp => cp.status === 'expiring_soon').length === 0) && (
                <p className="text-text-secondary text-center py-4">No packages expiring soon</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`p-2 rounded-xl ${
                  activity.type === 'package_assigned' ? 'bg-primary-100' :
                  activity.type === 'client_added' ? 'bg-success-100' :
                  activity.type === 'reminder_sent' ? 'bg-warning-100' : 'bg-info-100'
                }`}>
                  {activity.type === 'package_assigned' ? <CheckCircle className="h-5 w-5 text-primary-600" /> :
                   activity.type === 'client_added' ? <UserPlus className="h-5 w-5 text-success-600" /> :
                   activity.type === 'reminder_sent' ? <Mail className="h-5 w-5 text-warning-600" /> :
                   <CheckCircle className="h-5 w-5 text-info-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{activity.message}</p>
                  <p className="text-xs text-text-secondary">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}