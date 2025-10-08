import { supabase } from './supabase'
import whatsappService from './whatsappService'

// Automated WhatsApp messaging service
export class WhatsAppAutomation {
  constructor() {
    this.isRunning = false
  }

  // Sleep utility function
  sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  // Process birthday messages
  async processBirthdayMessages() {
    console.log('Running birthday automation:', new Date().toISOString())

    const birthdayRows = (await supabase
      .from('clients')
      .select('id, name, phone, whatsapp_number')
      .not('date_of_birth', 'is', null)
      .filter('to_char(date_of_birth, \'MM-DD\')', 'eq', new Date().toISOString().slice(5, 10))
    ).data || []

    for (const c of birthdayRows) {
      const triggerDate = new Date().toISOString().slice(0, 10)

      // Check deduplication
      const alreadySent = await whatsappService.checkSentTrigger(c.id, 'birthday', triggerDate)
      if (alreadySent) continue

      try {
        const phoneNumber = c.whatsapp_number || c.phone
        if (!phoneNumber) continue

        await whatsappService.sendMessage(c.id, phoneNumber, 'template', 'birthday_1', [c.name, 'YourOrg'])
        await whatsappService.markTriggerSent(c.id, 'birthday', triggerDate)

        console.log(`Birthday message sent to ${c.name}`)
      } catch (err) {
        console.error('Birthday send failed', err)
      }

      await this.sleep(300)
    }
  }

  // Process plan expiry reminders
  async processExpiryReminders() {
    console.log('Running expiry reminders automation:', new Date().toISOString())

    const today = new Date()

    // Get clients with packages expiring in 3 days, on date, or 3 days after
    const expiryRows = (await supabase
      .from('client_packages')
      .select(`
        client_id,
        end_date,
        clients:client_id (id, name, phone, whatsapp_number, packages:package_id (name))
      `)
      .not('end_date', 'is', null)
      .in('status', ['active', 'expiring_soon'])
    ).data || []

    for (const row of expiryRows) {
      const client = row.clients
      const endDate = new Date(row.end_date)
      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      let templateName = ''
      let triggerType = ''

      if (diffDays === 3) {
        templateName = 'plan_expiry_3days'
        triggerType = 'expiry_3days'
      } else if (diffDays === 0) {
        templateName = 'plan_expiry_on'
        triggerType = 'expiry_on'
      } else if (diffDays === -3) {
        templateName = 'plan_expiry_3after'
        triggerType = 'expiry_3after'
      } else {
        continue
      }

      const triggerDate = new Date().toISOString().slice(0, 10)

      // Check deduplication
      const alreadySent = await whatsappService.checkSentTrigger(client.id, triggerType, triggerDate)
      if (alreadySent) continue

      try {
        const phoneNumber = client.whatsapp_number || client.phone
        if (!phoneNumber) continue

        const packageName = client.packages?.name || 'plan'
        const expiryDate = endDate.toISOString().slice(0, 10)
        const orgName = 'YourOrg' // This should come from organization settings

        await whatsappService.sendMessage(client.id, phoneNumber, 'template', templateName, [
          client.name, packageName, expiryDate, 'https://your-renewal-link.com'
        ])
        await whatsappService.markTriggerSent(client.id, triggerType, triggerDate)

        console.log(`Expiry reminder sent to ${client.name} (${diffDays} days)`)
      } catch (err) {
        console.error('Expiry reminder send failed', err)
      }

      await this.sleep(300)
    }
  }

  // Process scheduled messages
  async processScheduledMessages() {
    try {
      const now = new Date()

      // Get scheduled messages that are due
      const { data: scheduledMessages, error } = await supabase
        .from('whatsapp_scheduled_messages')
        .select('*')
        .eq('is_sent', false)
        .lte('scheduled_date', now.toISOString())

      if (error) throw error

      for (const scheduled of scheduledMessages || []) {
        try {
          // Get organization settings
          const settings = await whatsappService.getSettings(scheduled.organization_id)
          if (!settings?.is_enabled) continue

          // Send to all target clients
          const targetClients = scheduled.target_clients || []

          if (targetClients.length === 0) {
            console.log(`No target clients for scheduled message ${scheduled.id}`)
            continue
          }

          const results = await whatsappService.sendBulkMessages(
            scheduled.organization_id,
            targetClients,
            scheduled.message_text,
            'custom'
          )

          // Mark as sent
          await supabase
            .from('whatsapp_scheduled_messages')
            .update({
              is_sent: true,
              sent_at: now.toISOString()
            })
            .eq('id', scheduled.id)

          console.log(`Scheduled message "${scheduled.title}" sent to ${results.filter(r => r.success).length} clients`)
        } catch (error) {
          console.error(`Error processing scheduled message ${scheduled.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Error processing scheduled messages:', error)
    }
  }

  // Main automation runner
  async runAutomation() {
    if (this.isRunning) {
      console.log('WhatsApp automation already running')
      return
    }

    this.isRunning = true

    try {
      console.log('Starting WhatsApp automation...')

      // Run all automated tasks
      await this.processBirthdayMessages()
      await this.processExpiryReminders()
      await this.processScheduledMessages()

      console.log('WhatsApp automation completed')
    } catch (error) {
      console.error('Error in WhatsApp automation:', error)
    } finally {
      this.isRunning = false
    }
  }

  // Note: Cron job is handled separately in cron.js for server-side execution

  // Manual trigger for testing
  async triggerBirthdayMessages() {
    console.log('Manually triggering birthday messages...')
    await this.processBirthdayMessages()
  }

  async triggerExpiryReminders() {
    console.log('Manually triggering expiry reminders...')
    await this.processExpiryReminders()
  }

  async triggerScheduledMessages() {
    console.log('Manually triggering scheduled messages...')
    await this.processScheduledMessages()
  }
}

// Export singleton instance
export const whatsappAutomation = new WhatsAppAutomation()
export default whatsappAutomation