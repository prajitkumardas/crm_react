import { NextResponse } from 'next/server'
import whatsappService from '../../../../lib/whatsappService'

export async function POST(request) {
  try {
    const { client_id, phone, type, message, templateName, templateParams } = await request.json()

    if (!client_id || !phone || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, phone, type' },
        { status: 400 }
      )
    }

    if (type === 'template' && !templateName) {
      return NextResponse.json(
        { error: 'templateName is required for template messages' },
        { status: 400 }
      )
    }

    if (type === 'text' && !message) {
      return NextResponse.json(
        { error: 'message is required for text messages' },
        { status: 400 }
      )
    }

    console.log(`Sending ${type} message to ${phone}`)

    let result
    if (type === 'template') {
      result = await whatsappService.sendMessage(client_id, phone, type, templateName, templateParams)
    } else {
      result = await whatsappService.sendMessage(client_id, phone, type, message)
    }

    return NextResponse.json({
      ok: true,
      result
    })

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to send message',
        details: error.message
      },
      { status: 500 }
    )
  }
}