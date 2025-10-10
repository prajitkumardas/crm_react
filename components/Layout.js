"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { LanguageProvider, useTranslation } from "../lib/languageContext";
import notificationsService from "../lib/notificationsService";
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
  Globe,
  Calendar,
  Filter,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

const navigation = [
  // Core Features
  {
    nameKey: "dashboard",
    href: "dashboard",
    icon: LayoutDashboard,
    section: "core",
  },
  { nameKey: "clients", href: "clients", icon: Users, section: "core" },
  { nameKey: "plans", href: "plans", icon: Package, section: "core" },
  { nameKey: "attendance", href: "attendance", icon: Clock, section: "core" },
  // Secondary Features
  {
    nameKey: "analytics",
    href: "analytics",
    icon: BarChart3,
    section: "secondary",
  },
  {
    nameKey: "settings",
    href: "settings",
    icon: Settings,
    section: "secondary",
  },
  { nameKey: "help", href: "help", icon: HelpCircle, section: "secondary" },
];

const Layout = memo(function Layout({
  children,
  profile,
  onSignOut,
  activeTab,
  onTabChange,
  navigating = false,
}) {
  return (
    <LanguageProvider>
      <LayoutContent
        children={children}
        profile={profile}
        onSignOut={onSignOut}
        activeTab={activeTab}
        onTabChange={onTabChange}
        navigating={navigating}
      />
    </LanguageProvider>
  );
});

export default Layout;

const LayoutContent = memo(function LayoutContent({
  children,
  profile,
  onSignOut,
  activeTab,
  onTabChange,
  navigating = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { t, language, changeLanguage } = useTranslation();

  const currentOrganization = profile?.organizations;

  // Memoized fetchNotifications function
  const fetchNotifications = useCallback(async () => {
    if (!profile?.organization_id) return;

    try {
      const [notifs, count] = await Promise.all([
        notificationsService.getNotifications(profile.organization_id),
        notificationsService.getNotificationCount(profile.organization_id)
      ]);
      setNotifications(notifs);
      setNotificationCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [profile?.organization_id]);

  // Fetch notifications only when organization_id changes
  useEffect(() => {
    if (profile?.organization_id) {
      fetchNotifications();
    }
  }, [profile?.organization_id, fetchNotifications]);

  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownOpen && !event.target.closest('.language-dropdown')) {
        setLanguageDropdownOpen(false)
      }
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false)
      }
      if (notificationsDropdownOpen && !event.target.closest('.notifications-dropdown')) {
        setNotificationsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [languageDropdownOpen, profileDropdownOpen, notificationsDropdownOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-200 ease-in-out ${
        sidebarCollapsed ? 'lg:w-18' : 'lg:w-60'
      }`}>
        <div className="flex flex-col h-full bg-white shadow-soft border-r border-gray-200">
          {/* Branding Header */}
          <div className="flex flex-col items-center px-4 py-6 border-b border-gray-200">
            {/* Logo */}
            <div className={`flex items-center justify-center ${sidebarCollapsed ? 'w-10 h-10' : 'w-full'}`}>
              {sidebarCollapsed ? (
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-lg">Prajit</span>
                </div>
              )}
            </div>

            {/* Gym Name - Only show when expanded */}
            {!sidebarCollapsed && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 font-medium">Pluto's Gym</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            <div className="space-y-6">
              {/* Core Features */}
              <div>
                {!sidebarCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Core
                  </h3>
                )}
                <div className="space-y-1">
                  {navigation
                    .filter((item) => item.section === "core")
                    .map((item) => (
                      <div key={item.nameKey} className="relative group">
                        <button
                          onClick={() => onTabChange(item.href)}
                          className={`w-full flex items-center ${
                            sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'
                          } text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === item.href
                              ? "bg-blue-50 text-primary border-l-4 border-primary"
                              : "text-gray-600 hover:bg-blue-50 hover:text-primary"
                          }`}
                          title={sidebarCollapsed ? t(item.nameKey) : undefined}
                        >
                          <item.icon
                            className={`${
                              sidebarCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'
                            } flex-shrink-0 ${
                              activeTab === item.href
                                ? "text-primary"
                                : "text-gray-400 group-hover:text-primary"
                            }`}
                          />
                          {!sidebarCollapsed && (
                            <span className={`transition-opacity duration-200 ${
                              activeTab === item.href ? 'text-primary' : 'text-gray-600 group-hover:text-primary'
                            }`}>
                              {t(item.nameKey)}
                            </span>
                          )}
                        </button>

                        {/* Tooltip for collapsed state */}
                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                            {t(item.nameKey)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Secondary Features */}
              <div>
                {!sidebarCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Tools
                  </h3>
                )}
                <div className="space-y-1">
                  {navigation
                    .filter((item) => item.section === "secondary")
                    .map((item) => (
                      <div key={item.nameKey} className="relative group">
                        <button
                          onClick={() => onTabChange(item.href)}
                          className={`w-full flex items-center ${
                            sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'
                          } text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === item.href
                              ? "bg-blue-50 text-primary border-l-4 border-primary"
                              : "text-gray-600 hover:bg-blue-50 hover:text-primary"
                          }`}
                          title={sidebarCollapsed ? t(item.nameKey) : undefined}
                        >
                          <item.icon
                            className={`${
                              sidebarCollapsed ? 'h-6 w-6' : 'mr-3 h-5 w-5'
                            } flex-shrink-0 ${
                              activeTab === item.href
                                ? "text-primary"
                                : "text-gray-400 group-hover:text-primary"
                            }`}
                          />
                          {!sidebarCollapsed && (
                            <span className={`transition-opacity duration-200 ${
                              activeTab === item.href ? 'text-primary' : 'text-gray-600 group-hover:text-primary'
                            }`}>
                              {t(item.nameKey)}
                            </span>
                          )}
                        </button>

                        {/* Tooltip for collapsed state */}
                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                            {t(item.nameKey)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Collapse Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  sidebarCollapsed ? 'rotate-90' : '-rotate-90'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-gray-800 shadow-strong transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border-light">
            <img
              src="/logo.png"
              alt="Smart Client Manager Logo"
              className="h-8 object-contain"
            />
          </div>

          {/* Organization Name */}
          <div className="px-6 py-3 border-b border-border-light">
            <div className="flex items-center px-3 py-2 text-sm font-medium text-secondary-600">
              <Building2 className="mr-2 h-4 w-4" />
              <span className="truncate">{currentOrganization?.name || 'Organization'}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6">
            <div className="space-y-1">
              {/* Core Features */}
              <div className="mb-6">
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  {t("core")}
                </h3>
                {navigation
                  .filter((item) => item.section === "core")
                  .map((item) => (
                    <button
                      key={item.nameKey}
                      onClick={() => {
                        onTabChange(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.href
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 border-r-4 border-primary"
                          : "text-text-secondary hover:bg-bg-light hover:text-text-primary dark:text-text-secondary dark:hover:bg-bg-dark dark:hover:text-text-primary"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary"
                            : "text-text-muted"
                        }`}
                      />
                      {t(item.nameKey)}
                    </button>
                  ))}
              </div>

              {/* Divider */}
              <div className="border-t border-border-light my-6"></div>

              {/* Secondary Features */}
              <div>
                <h3 className="px-4 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                  {t("tools")}
                </h3>
                {navigation
                  .filter((item) => item.section === "secondary")
                  .map((item) => (
                    <button
                      key={item.nameKey}
                      onClick={() => {
                        onTabChange(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.href
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 border-r-4 border-primary"
                          : "text-text-secondary hover:bg-bg-light hover:text-text-primary dark:text-text-secondary dark:hover:bg-bg-dark dark:hover:text-text-primary"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary"
                            : "text-text-muted"
                        }`}
                      />
                      {t(item.nameKey)}
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
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-60'
      }`}>
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-soft border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Center - Search Bar */}
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search something..."
                    className="w-full pl-10 pr-4 py-2 border border-border-light rounded-lg bg-bg-secondary text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Right side - Controls */}
              <div className="flex items-center space-x-3">
                {/* Language Selector */}
                <div className="relative hidden sm:block language-dropdown">
                  <button
                    onClick={() =>
                      setLanguageDropdownOpen(!languageDropdownOpen)
                    }
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-secondary-50 transition-colors"
                  >
                    <Globe className="h-4 w-4 text-secondary-600" />
                    <span className="text-sm text-text-primary">
                      {language.toUpperCase()}
                    </span>
                    <ChevronDown className="h-3 w-3 text-secondary-400" />
                  </button>

                  {/* Language Dropdown */}
                  {languageDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-medium py-1 z-10 border border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          changeLanguage("en");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          language === "en"
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {t("english")}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage("hi");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          language === "hi"
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {t("hindi")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Search Button */}
                <button className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-colors">
                  <Search className="h-5 w-5" />
                </button>

                {/* Notifications Button */}
                <div className="relative notifications-dropdown">
                  <button
                    onClick={() => {
                      setNotificationsDropdownOpen(!notificationsDropdownOpen);
                      if (!notificationsDropdownOpen) {
                        fetchNotifications(); // Refresh notifications when opening
                      }
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-all duration-200 relative"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification Badge with Animation */}
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 rounded-full flex items-center justify-center animate-pulse border-2 border-bg-card">
                        <span className="text-xs font-bold text-text-inverse">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-medium py-2 z-10 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                            <p className="text-sm">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer last:border-b-0"
                              onClick={() => {
                                if (notification.action_url) {
                                  // Handle navigation based on the action_url
                                  if (notification.action_url.startsWith('/clients/')) {
                                    onTabChange('clients');
                                  } else if (notification.action_url.includes('/settings')) {
                                    onTabChange('settings');
                                  }
                                }
                                setNotificationsDropdownOpen(false);
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.type === 'error' ? 'bg-red-500' :
                                    notification.type === 'warning' ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white font-medium">{notification.title}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{notification.message}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {new Date(notification.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            onTabChange('settings');
                            setNotificationsDropdownOpen(false);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View WhatsApp logs
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Menu */}
                <div className="relative profile-dropdown">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                      <span className="text-sm font-medium text-white">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden sm:block">
                      {profile?.full_name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-secondary-400" />
                  </button>
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-medium py-1 z-10 border border-gray-200 dark:border-gray-700 ${profileDropdownOpen ? 'block' : 'hidden'}`}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {profile?.email}
                      </p>
                    </div>
                    <button
                      onClick={onSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Navigation Loading Overlay */}
        {navigating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Navigating...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-strong">
        <div className="flex items-center justify-around px-2 py-2">
          {navigation.slice(0, 5).map((item) => (
            <button
              key={item.nameKey}
              onClick={() => onTabChange(item.href)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === item.href
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-light dark:text-text-secondary dark:hover:text-text-primary dark:hover:bg-bg-dark"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${
                  activeTab === item.href
                    ? "text-primary"
                    : "text-text-muted"
                }`}
              />
              <span
                className={`text-xs mt-1 ${
                  activeTab === item.href
                    ? "text-primary font-medium"
                    : "text-text-secondary"
                }`}
              >
                {t(item.nameKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding for mobile navigation */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
});
