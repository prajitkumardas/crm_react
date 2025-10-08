'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import whatsappService from '../lib/whatsappService'
import whatsappAutomation from '../lib/whatsappAutomation'
import { Settings, MessageSquare, BarChart3, Key, Save, TestTube, Play, Pause, Edit3, Eye, EyeOff } from 'lucide-react'

export default function WhatsAppSettings({ organizationId }) {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    is_enabled: false,
    provider: 'twilio',
    api_key: '',
    api_secret: '',
    account_sid: '',
    phone_number: '',
    business_account_id: '',
    access_token: '',
    message_header: 'Smart Client Manager',
    message_footer: 'Thank you!'
  })
  const [templates, setTemplates] = useState([])
  const [messageLogs, setMessageLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    template_type: '',
    name: '',
    message_text: ''
  })
  const [filters, setFilters] = useState({
    messageType: null,
    status: null,
    dateRange: '7'
  })
  const [runningAutomation, setRunningAutomation] = useState(false)

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'templates', name: 'Templates', icon: MessageSquare },
    { id: 'api', name: 'API Settings', icon: Key },
    { id: 'logs', name: 'Message Logs', icon: BarChart3 }
  ]

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [settingsData, templatesData, logsData] = await Promise.all([
        whatsappService.getSettings(organizationId),
        whatsappService.getTemplates(organizationId),
        whatsappService.getMessageLogs(organizationId, { limit: 50 })
      ])

      if (settingsData) {
        setSettings(settingsData)
      }
      setTemplates(templatesData)
      setMessageLogs(logsData)
    } catch (error) {
      console.error('Error loading WhatsApp settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered logs based on current filters
  const filteredLogs = useMemo(() => {
    let filtered = [...messageLogs]

    if (filters.messageType) {
      filtered = filtered.filter(log => log.message_type === filters.messageType)
    }

    if (filters.status) {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    if (filters.dateRange) {
      const days = parseInt(filters.dateRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      filtered = filtered.filter(log => new Date(log.sent_at) >= cutoffDate)
    }

    return filtered
  }, [messageLogs, filters])

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      await whatsappService.updateSettings(organizationId, settings)
      // Reload data to get updated settings
      const updatedSettings = await whatsappService.getSettings(organizationId)
      if (updatedSettings) {
        setSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      // Ask for a test recipient phone number
      const testRecipient = prompt('Enter a phone number to send test message to (include country code, e.g., +1234567890):')
      if (!testRecipient) {
        setTestResult({
          success: false,
          message: 'Test cancelled - no recipient phone number provided'
        })
        return
      }

      // Try to send a test message to the provided phone number
      const result = await whatsappService.sendMessage(
        organizationId,
        testRecipient,
        'Test message from Smart Client Manager - WhatsApp automation is working!',
        'test'
      )

      setTestResult({
        success: result.success,
        message: result.success ? `Test message sent successfully to ${testRecipient}!` : `Failed: ${result.error}`
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await whatsappService.updateTemplate(editingTemplate.id, templateForm)
      }
      setEditingTemplate(null)
      setTemplateForm({ template_type: '', name: '', message_text: '' })
      await loadData()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const handleRunAutomation = async () => {
    try {
      setRunningAutomation(true)
      const response = await fetch('/api/whatsapp/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Automation completed successfully!')
        await loadData() // Refresh logs
      } else {
        alert(`Automation failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error running automation:', error)
      alert('Failed to run automation')
    } finally {
      setRunningAutomation(false)
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      template_type: template.template_type,
      name: template.name,
      message_text: template.message_text
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-green-600'
      case 'delivered': return 'text-blue-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getMessageTypeLabel = (type) => {
    const labels = {
      birthday: 'Birthday',
      expiry_reminder: 'Expiry Reminder',
      bulk: 'Bulk Message',
      custom: 'Custom',
      test: 'Test Message'
    }
    return labels[type] || type
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Automation Settings</h1>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            settings.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {settings.is_enabled ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Enabled
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                Disabled
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'general' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_enabled"
                    checked={settings.is_enabled}
                    onChange={(e) => setSettings({...settings, is_enabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_enabled" className="ml-2 text-sm text-gray-900">
                    Enable WhatsApp Automation
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Header
                  </label>
                  <input
                    type="text"
                    value={settings.message_header}
                    onChange={(e) => setSettings({...settings, message_header: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Message header text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Footer
                  </label>
                  <input
                    type="text"
                    value={settings.message_footer}
                    onChange={(e) => setSettings({...settings, message_footer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Message footer text"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRunAutomation}
                  disabled={runningAutomation || !settings.is_enabled}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center"
                >
                  {runningAutomation ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Automation Now
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600">
                  Manually trigger birthday and expiry reminders
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Provider
                  </label>
                  <select
                    value={settings.provider}
                    onChange={(e) => setSettings({...settings, provider: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="whatsapp_business">WhatsApp Business API</option>
                  </select>
                </div>

                {settings.provider === 'twilio' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account SID
                      </label>
                      <input
                        type="text"
                        value={settings.account_sid}
                        onChange={(e) => setSettings({...settings, account_sid: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auth Token
                      </label>
                      <input
                        type="password"
                        value={settings.api_secret}
                        onChange={(e) => setSettings({...settings, api_secret: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your Twilio Auth Token"
                      />
                    </div>
                  </>
                )}

                {settings.provider === 'whatsapp_business' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Account ID
                      </label>
                      <input
                        type="text"
                        value={settings.business_account_id}
                        onChange={(e) => setSettings({...settings, business_account_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your WhatsApp Business Account ID"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={settings.access_token}
                        onChange={(e) => setSettings({...settings, access_token: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your WhatsApp Access Token"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Phone Number
                  </label>
                  <input
                    type="text"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Phone number used to send WhatsApp messages
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleTestConnection}
                disabled={testing || !settings.phone_number}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center"
              >
                {testing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Message Templates</h3>
              <button
                onClick={() => setEditingTemplate({})}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Add Template
              </button>
            </div>

            {/* Template List */}
            <div className="space-y-4">
              {templates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                      <p className="text-xs text-gray-500 capitalize">{template.template_type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                    {template.message_text}
                  </p>
                </div>
              ))}
            </div>

            {/* Template Editor Modal */}
            {(editingTemplate !== null) && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={() => setEditingTemplate(null)}></div>
                <div className="flex min-h-screen items-center justify-center p-4">
                  <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingTemplate.id ? 'Edit Template' : 'Add Template'}
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Type
                          </label>
                          <select
                            value={templateForm.template_type}
                            onChange={(e) => setTemplateForm({...templateForm, template_type: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select type</option>
                            <option value="birthday">Birthday</option>
                            <option value="expiry_3_days_before">Expiry 3 Days Before</option>
                            <option value="expiry_on_date">Expiry On Date</option>
                            <option value="expiry_3_days_after">Expiry 3 Days After</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name
                          </label>
                          <input
                            type="text"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Template name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message Text
                          </label>
                          <textarea
                            rows={6}
                            value={templateForm.message_text}
                            onChange={(e) => setTemplateForm({...templateForm, message_text: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Enter your message template..."
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Use placeholders like {'{name}'}, {'{plan_name}'}, {'{expiry_date}'} etc.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                        >
                          Save Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Message Logs & Analytics</h3>
              <button
                onClick={() => loadData()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Refresh
              </button>
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{messageLogs.length}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-green-600">
                  {messageLogs.filter(log => log.status === 'sent').length}
                </div>
                <div className="text-sm text-gray-600">Sent Successfully</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-red-600">
                  {messageLogs.filter(log => log.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-purple-600">
                  {messageLogs.filter(log => log.message_type === 'bulk').length}
                </div>
                <div className="text-sm text-gray-600">Bulk Messages</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Type
                  </label>
                  <select
                    value={filters.messageType || ''}
                    onChange={(e) => setFilters({...filters, messageType: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="birthday">Birthday</option>
                    <option value="expiry_reminder">Expiry Reminder</option>
                    <option value="bulk">Bulk Message</option>
                    <option value="custom">Custom</option>
                    <option value="test">Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({...filters, status: e.target.value || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange || '7'}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message Logs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.clients?.name || log.recipient_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getMessageTypeLabel(log.message_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' :
                            log.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {log.message_content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No messages found matching your filters
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}