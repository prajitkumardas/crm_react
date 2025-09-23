'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getPackagesNeedingReminders, formatReminderMessage, REMINDER_TYPES } from '../lib/packageUtils'

export default function RemindersPanel({ organizationId }) {
  const [reminders, setReminders] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReminders()
  }, [organizationId])

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('client_packages')
        .select(`
          *,
          clients:client_id (id, name, email, phone),
          packages:package_id (id, name, price, duration_days)
        `)
        .eq('clients.organization_id', organizationId)

      if (error) throw error

      const reminderData = getPackagesNeedingReminders(data || [])
      setReminders(reminderData)
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReminderTitle = (type) => {
    switch (type) {
      case REMINDER_TYPES.THREE_DAYS_BEFORE:
        return 'Expiring in 3 Days'
      case REMINDER_TYPES.ON_EXPIRY:
        return 'Expiring Today'
      case REMINDER_TYPES.THREE_DAYS_AFTER:
        return 'Expired 3 Days Ago'
      default:
        return 'Reminders'
    }
  }

  const getReminderColor = (type) => {
    switch (type) {
      case REMINDER_TYPES.THREE_DAYS_BEFORE:
        return 'border-yellow-200 bg-yellow-50'
      case REMINDER_TYPES.ON_EXPIRY:
        return 'border-red-200 bg-red-50'
      case REMINDER_TYPES.THREE_DAYS_AFTER:
        return 'border-red-300 bg-red-100'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading reminders...</div>
  }

  const hasReminders = Object.values(reminders).some(arr => arr.length > 0)

  if (!hasReminders) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reminders</h3>
        <p className="text-gray-500 text-center py-4">No urgent reminders at this time.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Reminders</h3>

      <div className="space-y-4">
        {Object.entries(reminders).map(([type, packages]) => {
          if (packages.length === 0) return null

          return (
            <div key={type} className={`border-l-4 p-4 rounded-r-lg ${getReminderColor(type)}`}>
              <h4 className="font-medium text-gray-900 mb-2">
                {getReminderTitle(type)} ({packages.length})
              </h4>

              <div className="space-y-2">
                {packages.map((cp) => (
                  <div key={cp.id} className="text-sm text-gray-700">
                    <p className="font-medium">{cp.clients?.name}</p>
                    <p>{cp.packages?.name} - Expires: {new Date(cp.end_date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatReminderMessage(cp, type)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}