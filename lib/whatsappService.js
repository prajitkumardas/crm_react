import { supabase } from './supabase'

const GRAPH_BASE = `https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_VERSION}`
const PHONE_ID = process.env.PHONE_NUMBER_ID
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

// WhatsApp service for handling messaging operations
export class WhatsAppService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
  }

  // Get WhatsApp settings for an organization
  async getSettings(organizationId) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error)
      return null
    }
  }

  // Update WhatsApp settings
  async updateSettings(organizationId, settings) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          organization_id: organizationId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error)
      throw error
    }
  }

  // Get message templates
  async getTemplates(organizationId) {
    try {
      let { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .order('template_type')

      if (error) throw error

      // If no templates exist, create default ones
      if (!data || data.length === 0) {
        const defaultTemplates = [
          {
            organization_id: organizationId,
            template_type: 'birthday',
            name: 'Birthday Greeting',
            message_text: 'Happy Birthday {name}! 🎉\n\nWishing you a fantastic day filled with joy and good health. Enjoy your special day!\n\nBest regards,\n{organization_name}',
            is_active: true
          },
          {
            organization_id: organizationId,
            template_type: 'expiry_3_days_before',
            name: 'Plan Expiry Reminder (3 days)',
            message_text: 'Hi {name},\n\nThis is a friendly reminder that your {plan_name} plan will expire in 3 days (on {expiry_date}).\n\nPlease renew your membership to continue enjoying our services.\n\nContact us if you need any assistance.',
            is_active: true
          },
          {
            organization_id: organizationId,
            template_type: 'expiry_on_date',
            name: 'Plan Expiry Today',
            message_text: 'Hi {name},\n\nYour {plan_name} plan expires today. Please renew your membership to avoid any interruption in services.\n\nVisit us or contact our support team for renewal assistance.',
            is_active: true
          },
          {
            organization_id: organizationId,
            template_type: 'expiry_3_days_after',
            name: 'Plan Expired Follow-up',
            message_text: 'Hi {name},\n\nWe noticed your {plan_name} plan has expired 3 days ago. We miss having you with us!\n\nPlease renew your membership to regain access to all our facilities and services.\n\nWe\'re here to help with your renewal process.',
            is_active: true
          }
        ]

        const { data: insertedTemplates, error: insertError } = await supabase
          .from('whatsapp_templates')
          .insert(defaultTemplates)
          .select()

        if (insertError) {
          console.error('Error creating default templates:', insertError)
          return []
        }

        data = insertedTemplates
      }

      return data || []
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error)
      return []
    }
  }

  // Update message template
  async updateTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating WhatsApp template:', error)
      throw error
    }
  }

  // Send text message via WhatsApp Cloud API
  async sendTextMessage(to, body) {
    const res = await fetch(`${GRAPH_BASE}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
      })
    })
    return res.json()
  }

  // Send template message via WhatsApp Cloud API
  async sendTemplateMessage(to, templateName, params = []) {
    const components = [{
      type: 'body',
      parameters: params.map(p => ({ type: 'text', text: p }))
    }]

    const res = await fetch(`${GRAPH_BASE}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components
        }
      })
    })
    return res.json()
  }

  // Send WhatsApp message via Twilio (legacy)
  async sendMessageViaTwilio(settings, to, message) {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.account_sid}/Messages.json`

    const formData = new URLSearchParams()
    formData.append('To', `whatsapp:${to}`)
    formData.append('From', `whatsapp:${settings.phone_number}`)
    formData.append('Body', message)

    try {
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${settings.account_sid}:${settings.api_secret}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send WhatsApp message')
      }

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      }
    } catch (error) {
      console.error('Twilio API error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Send WhatsApp message via WhatsApp Business API
  async sendMessageViaWhatsAppBusiness(settings, to, message) {
    const whatsappUrl = `https://graph.facebook.com/v18.0/${settings.business_account_id}/messages`

    try {
      const response = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send WhatsApp message')
      }

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        status: 'sent'
      }
    } catch (error) {
      console.error('WhatsApp Business API error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Send WhatsApp message (updated for Cloud API and new schema)
  async sendMessage(clientId, phone, type, messageOrTemplate, templateParams = null) {
    try {
      // Format phone number (remove any non-numeric characters except +)
      const cleanPhone = phone.replace(/[^\d+]/g, '')

      let result
      if (type === 'template') {
        result = await this.sendTemplateMessage(cleanPhone, messageOrTemplate, templateParams || [])
      } else {
        result = await this.sendTextMessage(cleanPhone, messageOrTemplate)
      }

      // Insert into messages table
      const insertResult = await supabase
        .from('messages')
        .insert({
          client_id: clientId,
          phone: cleanPhone,
          type,
          template_name: type === 'template' ? messageOrTemplate : null,
          message_text: type === 'text' ? messageOrTemplate : null,
          provider_message_id: result.messages?.[0]?.id || null,
          status: result.error ? 'failed' : 'sent',
          error_text: result.error?.message || null
        })
        .select()
        .single()

      return {
        success: !result.error,
        messageId: insertResult.data?.id,
        providerMessageId: result.messages?.[0]?.id,
        error: result.error?.message
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)

      // Log failed message
      await supabase
        .from('messages')
        .insert({
          client_id: clientId,
          phone: cleanPhone,
          type,
          template_name: type === 'template' ? messageOrTemplate : null,
          message_text: type === 'text' ? messageOrTemplate : null,
          status: 'failed',
          error_text: error.message
        })

      throw error
    }
  }

  // Log message to database
  async logMessage(logData) {
    try {
      const { error } = await supabase
        .from('whatsapp_logs')
        .insert(logData)

      if (error) {
        console.error('Error logging WhatsApp message:', error)
      }
    } catch (error) {
      console.error('Error logging WhatsApp message:', error)
    }
  }

  // Get message logs
  async getMessageLogs(organizationId, filters = {}) {
    try {
      let query = supabase
        .from('whatsapp_logs')
        .select(`
          *,
          clients:client_id (name, phone)
        `)
        .eq('organization_id', organizationId)
        .order('sent_at', { ascending: false })

      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.startDate) {
        query = query.gte('sent_at', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('sent_at', filters.endDate)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching message logs:', error)
      return []
    }
  }

  // Send bulk messages (updated for new schema)
  async sendBulkMessages(clientIds, messageTemplate) {
    const results = []

    for (const recipient of clientIds) {
      try {
        // Get client details
        const { data: client, error } = await supabase
          .from('clients')
          .select('name, phone, whatsapp_number')
          .eq('id', recipient.id || recipient.client_id)
          .single()

        if (error) {
          results.push({
            clientId: recipient.id || recipient.client_id,
            success: false,
            error: 'Client not found'
          })
          continue
        }

        // Use WhatsApp number if available, otherwise use phone number
        const phoneNumber = client.whatsapp_number || client.phone
        if (!phoneNumber) {
          results.push({
            clientId: recipient.id || recipient.client_id,
            success: false,
            error: 'Client has no phone or WhatsApp number'
          })
          continue
        }

        // Personalize message
        const personalizedMessage = this.personalizeMessage(messageTemplate, recipient)

        // Send message
        const result = await this.sendMessage(
          recipient.id || recipient.client_id,
          phoneNumber,
          'text',
          personalizedMessage
        )

        results.push({
          clientId: recipient.id || recipient.client_id,
          clientName: client.name,
          success: result.success,
          error: result.error
        })

        // Add delay to avoid rate limiting (300ms as per instruction)
        await new Promise(resolve => setTimeout(resolve, 300))

      } catch (error) {
        results.push({
          clientId: recipient.id || recipient.client_id,
          success: false,
          error: error.message
        })
      }
    }

    return results
  }

  // Check if trigger was already sent (for deduplication)
  async checkSentTrigger(clientId, triggerType, triggerDate) {
    const { data, error } = await supabase
      .from('sent_triggers')
      .select('id')
      .eq('client_id', clientId)
      .eq('trigger_type', triggerType)
      .eq('trigger_date', triggerDate)
      .single()

    return !error && data
  }

  // Mark trigger as sent
  async markTriggerSent(clientId, triggerType, triggerDate) {
    const { error } = await supabase
      .from('sent_triggers')
      .insert({
        client_id: clientId,
        trigger_type: triggerType,
        trigger_date: triggerDate
      })
      .select()

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error marking trigger as sent:', error)
    }
  }

  // Personalize message with placeholders
  personalizeMessage(template, data) {
    let message = template

    // Replace placeholders
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`
      const value = data[key] || ''
      message = message.replace(new RegExp(placeholder, 'g'), value)
    })

    return message
  }

  // Get template by type
  async getTemplateByType(organizationId, templateType) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('template_type', templateType)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching template:', error)
      return null
    }
  }

  // Schedule a message for later
  async scheduleMessage(organizationId, messageData) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_scheduled_messages')
        .insert({
          organization_id: organizationId,
          ...messageData
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error scheduling message:', error)
      throw error
    }
  }

  // Get scheduled messages
  async getScheduledMessages(organizationId) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_scheduled_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_sent', false)
        .order('scheduled_date')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching scheduled messages:', error)
      return []
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()
export default whatsappService