'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Package,
  Clock,
  BarChart3,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown
} from 'lucide-react'

const navigation = [
  // Core Features
  { name: 'Dashboard', href: 'dashboard', icon: LayoutDashboard, section: 'core' },
  { name: 'Clients', href: 'clients', icon: Users, section: 'core' },
  { name: 'Packages', href: 'packages', icon: Package, section: 'core' },
  { name: 'Attendance', href: 'attendance', icon: Clock, section: 'core' },
  // Secondary Features
  { name: 'Analytics', href: 'analytics', icon: BarChart3, section: 'secondary' },
  { name: 'Settings', href: 'settings', icon: Settings, section: 'secondary' },
]

export default function Layout({ children, profile, onSignOut, activeTab, onTabChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}


      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col h-full bg-bg-card shadow-strong border-r border-border-light">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border-light">
            <img
              src="/logo.png"
              alt="Smart Client Manager Logo"
              className="h-8 object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            <div className="space-y-1">
              {/* Core Features */}
              <div className="mb-6">
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  Core
                </h3>
                {navigation.filter(item => item.section === 'core').map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onTabChange(item.href)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.href
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      activeTab === item.href ? 'text-primary-600' : 'text-secondary-500'
                    }`} />
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border-light my-6"></div>

              {/* Secondary Features */}
              <div>
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  Tools
                </h3>
                {navigation.filter(item => item.section === 'secondary').map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onTabChange(item.href)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.href
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      activeTab === item.href ? 'text-primary-600' : 'text-secondary-500'
                    }`} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 bg-bg-card shadow-strong transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex flex-col h-full border-r border-border-light">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border-light">
            <img
              src="/logo.png"
              alt="Smart Client Manager Logo"
              className="h-8 object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            <div className="space-y-1">
              {/* Core Features */}
              <div className="mb-6">
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  Core
                </h3>
                {navigation.filter(item => item.section === 'core').map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      onTabChange(item.href)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.href
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      activeTab === item.href ? 'text-primary-600' : 'text-secondary-500'
                    }`} />
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border-light my-6"></div>

              {/* Secondary Features */}
              <div>
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  Tools
                </h3>
                {navigation.filter(item => item.section === 'secondary').map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      onTabChange(item.href)
                      setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === item.href
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      activeTab === item.href ? 'text-primary-600' : 'text-secondary-500'
                    }`} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-border-light">
            <button
              onClick={onSignOut}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        {/* Top header */}
        <header className="bg-bg-card shadow-soft border-b border-border-light">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Center - Workspace Selector (only on desktop) */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors cursor-pointer">
                <Building2 className="h-5 w-5 text-secondary-500" />
                <span className="text-sm font-medium text-text-primary">
                  {profile?.organizations?.name || 'Workspace'}
                </span>
                <ChevronDown className="h-4 w-4 text-secondary-400" />
              </div>

              {/* Right side - Search, Notifications, and User Profile Menu */}
              <div className="flex items-center space-x-2">
                {/* Search Button */}
                <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-colors">
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications Button */}
                <button className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-all duration-200 relative group">
                  <Bell className="h-5 w-5" />
                  {/* Notification Badge with Animation */}
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 rounded-full flex items-center justify-center animate-pulse border-2 border-bg-card">
                    <span className="text-xs font-bold text-text-inverse">3</span>
                  </span>
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-secondary-900 text-text-inverse text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Notifications
                  </div>
                </button>

                {/* User Profile Menu */}
                <div className="relative">
                  <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-text-inverse">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden sm:block">
                      {profile?.full_name || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-secondary-400" />
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-bg-card rounded-xl shadow-medium py-1 z-10 hidden border border-border-light">
                    <div className="px-4 py-2 border-b border-border-light">
                      <p className="text-sm font-medium text-text-primary">{profile?.full_name}</p>
                      <p className="text-xs text-text-secondary">{profile?.email}</p>
                    </div>
                    <button
                      onClick={onSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-secondary-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-bg-secondary py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-card border-t border-border-light shadow-strong">
        <div className="flex items-center justify-around px-2 py-2">
          {navigation.slice(0, 5).map((item) => (
            <button
              key={item.name}
              onClick={() => onTabChange(item.href)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === item.href
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
            >
              <item.icon className={`h-5 w-5 ${
                activeTab === item.href ? 'text-primary-600' : 'text-secondary-500'
              }`} />
              <span className={`text-xs mt-1 ${
                activeTab === item.href ? 'text-primary-700 font-medium' : 'text-secondary-600'
              }`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding for mobile navigation */}
      <div className="lg:hidden h-16"></div>
    </div>
  )
}