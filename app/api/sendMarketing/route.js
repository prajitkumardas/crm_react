import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendMessageToClient } from '../../../lib/chatwootService'
import { getTemplateByName, renderTemplate } from '../../../lib/messageTemplate'

export async function POST(request) {
  try {
    const { templateName } = await request.json();

    if (!templateName) {
      return NextResponse.json(
        { error: 'templateName is required' },
        { status: 400 }
      );
    }

    // Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json(
        { message: 'No clients found' },
        { status: 200 }
      );
    }

    // Get the template
    const template = await getTemplateByName(supabase, templateName);
    if (!template) {
      return NextResponse.json(
        { error: `Template '${templateName}' not found` },
        { status: 400 }
      );
    }

    const results = [];

    // Send to each client
    for (const client of clients) {
      try {
        const message = renderTemplate(template, client);
        const result = await sendMessageToClient(client, message);

        if (result.success) {
          // Log successful message
          await supabase.from('message_logs').insert({
            client_id: client.id,
            template_name: templateName,
            channel: 'chatwoot',
            conversation_id: result.conversationId,
            message_content: message,
            status: 'sent'
          });
        } else {
          // Log failed message
          await supabase.from('message_logs').insert({
            client_id: client.id,
            template_name: templateName,
            channel: 'chatwoot',
            message_content: message,
            status: 'failed',
            error_message: result.error
          });
        }

        results.push({
          clientId: client.id,
          clientName: client.name,
          success: result.success,
          error: result.error
        });

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error sending to client ${client.id}:`, error);
        results.push({
          clientId: client.id,
          clientName: client.name,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: results.length,
      successful: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    console.error('Error in sendMarketing API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}