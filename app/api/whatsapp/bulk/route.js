import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import whatsappService from '../../../../lib/whatsappService'

export async function POST(request) {
  try {
    const { recipients, messageTemplate } = await request.json()

    if (!recipients || !messageTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields: recipients, messageTemplate' },
        { status: 400 }
      )
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients must be a non-empty array' },
        { status: 400 }
      )
    }

    console.log(`Sending bulk message to ${recipients.length} recipients`)

    // Send bulk messages
    const results = await whatsappService.sendBulkMessages(recipients, messageTemplate)

    return NextResponse.json({
      ok: true,
      results
    })

  } catch (error) {
    console.error('Error sending bulk WhatsApp messages:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to send bulk messages',
        details: error.message
      },
      { status: 500 }
    )
  }
}