import { supabase } from './supabase'
import whatsappService from './whatsappService'

class NotificationsService {
  // Get notifications for the current user/organization
  async getNotifications(organizationId, limit = 10) {
    try {
      const notifications = []

      // Get recent WhatsApp message failures
      const failedMessages = await this.getFailedMessages(organizationId, 3)
      notifications.push(...failedMessages)

      // Get upcoming birthdays (next 7 days)
      const upcomingBirthdays = await this.getUpcomingBirthdays(organizationId, 3)
      notifications.push(...upcomingBirthdays)

      // Get expiring packages (next 3 days)
      const expiringPackages = await this.getExpiringPackages(organizationId, 3)
      notifications.push(...expiringPackages)

      // Sort by date (most recent first) and limit
      return notifications
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit)

    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Get failed WhatsApp messages
  async getFailedMessages(organizationId, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select(`
          *,
          clients:client_id (name, phone)
        `)
        .eq('status', 'failed')
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(log => ({
        id: `failed-${log.id}`,
        type: 'error',
        title: 'WhatsApp Message Failed',
        message: `Failed to send message to ${log.clients?.name || log.recipient_name || 'client'}`,
        created_at: log.sent_at,
        action_url: '/settings/whatsapp/logs'
      }))
    } catch (error) {
      console.error('Error fetching failed messages:', error)
      return []
    }
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(organizationId, limit = 5) {
    try {
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, date_of_birth')
        .eq('organization_id', organizationId)
        .not('date_of_birth', 'is', null)
        .order('date_of_birth')

      if (error) throw error

      const upcomingBirthdays = data
        .map(client => {
          const birthDate = new Date(client.date_of_birth)
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())

          // If birthday has passed this year, check next year
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1)
          }

          return {
            ...client,
            next_birthday: thisYearBirthday,
            days_until: Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24))
          }
        })
        .filter(client => client.days_until <= 7)
        .sort((a, b) => a.days_until - b.days_until)
        .slice(0, limit)

      return upcomingBirthdays.map(client => ({
        id: `birthday-${client.id}`,
        type: 'info',
        title: 'Upcoming Birthday',
        message: `${client.name}'s birthday is in ${client.days_until} day${client.days_until !== 1 ? 's' : ''}`,
        created_at: new Date().toISOString(),
        action_url: `/clients/${client.id}`
      }))
    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error)
      return []
    }
  }

  // Get expiring packages
  async getExpiringPackages(organizationId, limit = 5) {
    try {
      const today = new Date()
      const next3Days = new Date()
      next3Days.setDate(today.getDate() + 3)

      const { data, error } = await supabase
        .from('client_packages')
        .select(`
          id,
          end_date,
          clients:client_id (id, name),
          packages:package_id (id, name)
        `)
        .eq('clients.organization_id', organizationId)
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', next3Days.toISOString().split('T')[0])
        .order('end_date')

      if (error) throw error

      return data.slice(0, limit).map(pkg => {
        const expiryDate = new Date(pkg.end_date)
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

        return {
          id: `expiry-${pkg.id}`,
          type: daysUntilExpiry <= 1 ? 'warning' : 'info',
          title: 'Package Expiring Soon',
          message: `${pkg.clients?.name}'s ${pkg.packages?.name} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
          created_at: new Date().toISOString(),
          action_url: `/clients/${pkg.clients?.id}`
        }
      })
    } catch (error) {
      console.error('Error fetching expiring packages:', error)
      return []
    }
  }

  // Get notification count
  async getNotificationCount(organizationId) {
    try {
      const notifications = await this.getNotifications(organizationId, 100)
      return notifications.length
    } catch (error) {
      console.error('Error getting notification count:', error)
      return 0
    }
  }

  // Mark notification as read (for future implementation)
  async markAsRead(notificationId) {
    // This would update a read status in a notifications table
    // For now, just return success
    return true
  }
}

export default new NotificationsService()