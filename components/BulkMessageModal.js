'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { X, Send, Users, CheckCircle, AlertCircle, Clock, UserCheck, UserX, MessageSquare } from 'lucide-react'

export default function BulkMessageModal({ isOpen, onClose, organizationId, preselectedClients = [] }) {
  const [clients, setClients] = useState([])
  const [selectedClients, setSelectedClients] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Memoize preselectedClients to prevent infinite re-renders
  const memoizedPreselectedClients = useMemo(() => preselectedClients || [], [preselectedClients?.join(',')])

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, whatsapp_number, email')
        .eq('organization_id', organizationId)
        .order('name')

      if (error) throw error

      // Only show clients with phone or WhatsApp numbers
      const validClients = data?.filter(client =>
        (client.phone && client.phone.trim()) || (client.whatsapp_number && client.whatsapp_number.trim())
      ) || []

      setClients(validClients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchTemplates()
      setSelectedClients(memoizedPreselectedClients)
      setResults(null)
      setSelectedTemplate('')
      setSearchTerm('')
    }
  }, [isOpen, memoizedPreselectedClients, fetchClients, fetchTemplates])

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm) ||
    client.whatsapp_number?.includes(searchTerm)
  )

  const handleSelectAll = () => {
    const allSelected = selectedClients.length === filteredClients.length && filteredClients.length > 0
    if (allSelected) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredClients.map(client => client.id))
    }
  }

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const handleSend = async () => {
    if (!selectedTemplate || selectedClients.length === 0) return

    try {
      setSending(true)
      setResults(null)

      const response = await fetch('/api/sendMarketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: selectedTemplate
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send messages')
      }

      setResults(data.results)

      // Close modal after successful send
      setTimeout(() => {
        onClose()
      }, 3000)

    } catch (error) {
      console.error('Error sending bulk messages:', error)
      setResults([{
        success: false,
        error: error.message || 'Failed to send messages. Please check your Chatwoot settings.'
      }])
    } finally {
      setSending(false)
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Send Bulk WhatsApp Messages</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!results ? (
              <div className="space-y-6">
                {/* Selection Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">Send WhatsApp Message</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {clients.length} clients available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Select Recipients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => setSelectedClients(clients.map(c => c.id))}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Select All ({clients.length})
                    </button>
                    <button
                      onClick={() => setSelectedClients([])}
                      className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Clear All
                    </button>
                    <div className="px-4 py-3 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedClients.length} selected
                      </span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Client List */}
                  <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <div className="py-8 text-center text-gray-500">
                        No clients found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredClients.map(client => (
                          <div key={client.id} className="flex items-center p-3 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => handleClientToggle(client.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-xs text-gray-500">
                                {client.phone && `📞 ${client.phone}`}
                                {client.phone && client.whatsapp_number && ' • '}
                                {client.whatsapp_number && `💬 ${client.whatsapp_number}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Message Template</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose Template
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a template...</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.name}>
                            {template.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <MessageSquare className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <strong>Preview:</strong>
                            <div className="mt-2 p-2 bg-white rounded border text-gray-700 whitespace-pre-wrap">
                              {templates.find(t => t.name === selectedTemplate)?.content || ''}
                            </div>
                            <div className="mt-2 text-xs text-blue-600">
                              Available variables: {'{name}'}, {'{plan_name}'}, {'{plan_expiry}'}, etc.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Results */
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sending Results</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {result.clientName || `Client ${result.clientId}`}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600">{result.error}</div>
                        )}
                      </div>
                      <div className={`text-sm font-medium ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.success ? 'Sent' : 'Failed'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!results && (
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedTemplate || selectedClients.length === 0 || sending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
              >
                {sending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedClients.length} Recipients
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}