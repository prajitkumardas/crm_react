"use client";

import { useState, useEffect } from "react";
import { LanguageProvider, useTranslation } from "../lib/languageContext";
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
  { nameKey: "help", href: "help", icon: Settings, section: "secondary" },
];

export default function Layout({
  children,
  profile,
  onSignOut,
  activeTab,
  onTabChange,
}) {
  return (
    <LanguageProvider>
      <LayoutContent
        children={children}
        profile={profile}
        onSignOut={onSignOut}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </LanguageProvider>
  );
}

function LayoutContent({
  children,
  profile,
  onSignOut,
  activeTab,
  onTabChange,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const { t, language, changeLanguage } = useTranslation();

  const currentOrganization = profile?.organizations;

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
    <div className="min-h-screen bg-bg-secondary flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-secondary-900 bg-opacity-50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
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
                      onClick={() => onTabChange(item.href)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.href
                          ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                          : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary-600"
                            : "text-secondary-500"
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
                      onClick={() => onTabChange(item.href)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === item.href
                          ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                          : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary-600"
                            : "text-secondary-500"
                        }`}
                      />
                      {t(item.nameKey)}
                    </button>
                  ))}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-bg-card shadow-strong transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex flex-col h-full border-r border-border-light">
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
                          ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                          : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary-600"
                            : "text-secondary-500"
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
                          ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                          : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          activeTab === item.href
                            ? "text-primary-600"
                            : "text-secondary-500"
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
                    <div className="absolute right-0 mt-2 w-32 bg-bg-card rounded-xl shadow-medium py-1 z-10 border border-border-light">
                      <button
                        onClick={() => {
                          changeLanguage("en");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-secondary-50 transition-colors ${
                          language === "en"
                            ? "bg-primary-50 text-primary-700"
                            : "text-text-primary"
                        }`}
                      >
                        {t("english")}
                      </button>
                      <button
                        onClick={() => {
                          changeLanguage("hi");
                          setLanguageDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-secondary-50 transition-colors ${
                          language === "hi"
                            ? "bg-primary-50 text-primary-700"
                            : "text-text-primary"
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
                    onClick={() => setNotificationsDropdownOpen(!notificationsDropdownOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-all duration-200 relative"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification Badge with Animation */}
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-danger-500 rounded-full flex items-center justify-center animate-pulse border-2 border-bg-card">
                      <span className="text-xs font-bold text-text-inverse">
                        3
                      </span>
                    </span>
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-bg-card rounded-xl shadow-medium py-2 z-10 border border-border-light">
                      <div className="px-4 py-2 border-b border-border-light">
                        <h3 className="text-sm font-medium text-text-primary">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {/* Sample Notifications */}
                        <div className="px-4 py-3 border-b border-border-light hover:bg-secondary-50 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-danger-500 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary font-medium">New client registered</p>
                              <p className="text-xs text-text-secondary">John Doe joined your gym membership</p>
                              <p className="text-xs text-text-secondary mt-1">2 minutes ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 border-b border-border-light hover:bg-secondary-50 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-warning-500 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary font-medium">Package expiring soon</p>
                              <p className="text-xs text-text-secondary">Sarah's premium package expires in 3 days</p>
                              <p className="text-xs text-text-secondary mt-1">1 hour ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="px-4 py-3 hover:bg-secondary-50 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-success-500 rounded-full mt-2"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary font-medium">Payment received</p>
                              <p className="text-xs text-text-secondary">Monthly subscription payment from Mike Johnson</p>
                              <p className="text-xs text-text-secondary mt-1">3 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-border-light">
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          View all notifications
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
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-text-inverse">
                        {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text-primary hidden sm:block">
                      {profile?.full_name || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-secondary-400" />
                  </button>
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-48 bg-bg-card rounded-xl shadow-medium py-1 z-10 border border-border-light ${profileDropdownOpen ? 'block' : 'hidden'}`}>
                    <div className="px-4 py-2 border-b border-border-light">
                      <p className="text-sm font-medium text-text-primary">
                        {profile?.full_name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {profile?.email}
                      </p>
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
              key={item.nameKey}
              onClick={() => onTabChange(item.href)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === item.href
                  ? "bg-primary-100 text-primary-700"
                  : "text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${
                  activeTab === item.href
                    ? "text-primary-600"
                    : "text-secondary-500"
                }`}
              />
              <span
                className={`text-xs mt-1 ${
                  activeTab === item.href
                    ? "text-primary-700 font-medium"
                    : "text-secondary-600"
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
}
