import cron from 'node-cron';
import { supabase } from './supabase';
import { sendMessageToClient } from './chatwootService';
import { getTemplateByName, renderTemplate } from './messageTemplate';

// Send message using template to a client
async function sendMessage(client, templateName, variables = {}) {
  try {
    const template = await getTemplateByName(supabase, templateName);
    if (!template) {
      console.error(`Template ${templateName} not found`);
      return;
    }

    const message = renderTemplate(template, { ...client, ...variables });
    const result = await sendMessageToClient(client, message);

    if (result.success) {
      // Log the message
      await supabase.from('message_logs').insert({
        client_id: client.id,
        template_name: templateName,
        channel: 'chatwoot', // Could be determined by conversation type
        conversation_id: result.conversationId,
        message_content: message,
        status: 'sent'
      });

      console.log(`Message sent to ${client.name} (${templateName})`);
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

      console.error(`Failed to send message to ${client.name}: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error sending ${templateName} message to ${client.name}:`, error);
  }
}

// Set up all cron jobs
export function setupCronJobs() {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  console.log('Setting up Chatwoot cron jobs...');

  // Birthday wishes - 9 AM daily
  cron.schedule('0 9 * * *', async () => {
    console.log('Running birthday wishes cron job...');
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('birthday', today);

      if (clients && clients.length > 0) {
        console.log(`Sending birthday wishes to ${clients.length} clients`);
        for (const client of clients) {
          await sendMessage(client, 'birthday');
        }
      }
    } catch (error) {
      console.error('Error in birthday cron job:', error);
    }
  });

  // Plan expiring soon (tomorrow) - 10 AM daily
  cron.schedule('0 10 * * *', async () => {
    console.log('Running plan expiry reminder cron job...');
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('plan_expiry', tomorrow);

      if (clients && clients.length > 0) {
        console.log(`Sending expiry reminders to ${clients.length} clients`);
        for (const client of clients) {
          await sendMessage(client, 'plan_expiry');
        }
      }
    } catch (error) {
      console.error('Error in expiry reminder cron job:', error);
    }
  });

  // Plan expired today - 11 AM daily
  cron.schedule('0 11 * * *', async () => {
    console.log('Running plan expired notification cron job...');
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('plan_expiry', today);

      if (clients && clients.length > 0) {
        console.log(`Sending expired notifications to ${clients.length} clients`);
        for (const client of clients) {
          await sendMessage(client, 'plan_expired');
        }
      }
    } catch (error) {
      console.error('Error in expired notification cron job:', error);
    }
  });

  // Marketing messages - 12 PM daily (bulk to all clients)
  cron.schedule('0 12 * * *', async () => {
    console.log('Running marketing messages cron job...');
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('*');

      if (clients && clients.length > 0) {
        console.log(`Sending marketing messages to ${clients.length} clients`);
        for (const client of clients) {
          await sendMessage(client, 'marketing');
        }
      }
    } catch (error) {
      console.error('Error in marketing cron job:', error);
    }
  });

  console.log('Chatwoot cron jobs scheduled successfully');
}

// Manual trigger functions for testing
export async function triggerBirthdayMessages() {
  console.log('Manually triggering birthday messages...');
  const today = new Date().toISOString().slice(0, 10);
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('birthday', today);

  if (clients) {
    for (const client of clients) {
      await sendMessage(client, 'birthday');
    }
  }
}

export async function triggerExpiryReminders() {
  console.log('Manually triggering expiry reminders...');
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('plan_expiry', tomorrow);

  if (clients) {
    for (const client of clients) {
      await sendMessage(client, 'plan_expiry');
    }
  }
}

export async function triggerExpiredNotifications() {
  console.log('Manually triggering expired notifications...');
  const today = new Date().toISOString().slice(0, 10);
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('plan_expiry', today);

  if (clients) {
    for (const client of clients) {
      await sendMessage(client, 'plan_expired');
    }
  }
}

export async function triggerMarketingMessages() {
  console.log('Manually triggering marketing messages...');
  const { data: clients } = await supabase
    .from('clients')
    .select('*');

  if (clients) {
    for (const client of clients) {
      await sendMessage(client, 'marketing');
    }
  }
}