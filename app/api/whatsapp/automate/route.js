import { NextResponse } from 'next/server'
import whatsappAutomation from '../../../../lib/whatsappAutomation'

export async function POST(request) {
  try {
    console.log('Starting WhatsApp automation...')

    // Run the automation
    await whatsappAutomation.runAutomation()

    return NextResponse.json({
      success: true,
      message: 'WhatsApp automation completed successfully'
    })

  } catch (error) {
    console.error('Error in WhatsApp automation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run WhatsApp automation',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Also support GET for testing purposes
export async function GET() {
  try {
    console.log('Testing WhatsApp automation...')

    // Run the automation
    await whatsappAutomation.runAutomation()

    return NextResponse.json({
      success: true,
      message: 'WhatsApp automation test completed successfully'
    })

  } catch (error) {
    console.error('Error in WhatsApp automation test:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run WhatsApp automation test',
        details: error.message
      },
      { status: 500 }
    )
  }
}