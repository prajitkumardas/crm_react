# Chatwoot Multi-Channel Messaging System

## Overview

This CRM now uses **Chatwoot** for multi-channel messaging instead of direct WhatsApp API. This provides a much cleaner, more scalable solution that supports WhatsApp, Telegram, Email, SMS, and other channels through a single API.

## Why Chatwoot?

✅ **Multi-channel support**: WhatsApp, Telegram, Email, SMS
✅ **Free and open-source**: No API costs
✅ **Unified API**: Single integration for all messaging
✅ **Conversation management**: Built-in customer support features
✅ **Scalable**: Easy to add new channels
✅ **Professional**: Better for business use

## Setup Instructions

### 1. Environment Variables

Update your `.env.local`:

```bash
# Chatwoot Configuration (Multi-channel messaging)
CHATWOOT_API_KEY=your_chatwoot_api_key
CHATWOOT_URL=https://your_chatwoot_instance.com
CHATWOOT_ACCOUNT_ID=1
```

### 2. Database Migration

Run the migration: `supabase/step11_chatwoot_messaging.sql`

This creates:
- `message_templates` table for storing message templates
- `message_logs` table for tracking sent messages
- Updates `clients` table with Chatwoot conversation IDs

### 3. Default Templates

The migration includes default templates:
- `birthday`: Birthday wishes
- `plan_expiry`: Plan expiring soon reminder
- `plan_expired`: Plan expired notification
- `marketing`: Marketing messages

## Features

### 🤖 Automated Messages

**Cron Jobs Schedule:**
- **9 AM**: Birthday wishes to clients with today's birthday
- **10 AM**: Plan expiry reminders (for tomorrow)
- **11 AM**: Plan expired notifications (for today)
- **12 PM**: Marketing messages to all clients

### 📢 Bulk Marketing

Send marketing messages to all or selected clients using templates.

### 📝 Template System

Templates support variables:
- `{name}`: Client name
- `{plan_name}`: Package/plan name
- `{plan_expiry}`: Expiry date
- `{email}`: Client email
- `{phone}`: Client phone

## API Endpoints

### Send Individual Message
```
POST /api/sendMessage
{
  "conversation_id": 123,
  "message": "Hello from CRM!"
}
```

### Send Marketing Campaign
```
POST /api/sendMarketing
{
  "templateName": "marketing"
}
```

## Usage

### Manual Testing

```bash
# Test cron jobs initialization
npm run test-cron

# Run cron jobs manually
node cron.js
```

### Production Deployment

```bash
# Enable cron jobs in production
ENABLE_CRON=true npm start

# Or run cron separately
npm run cron
```

## Architecture

```
CRM App (Next.js)
    ↓
Chatwoot API
    ↓
WhatsApp/Telegram/Email/SMS
```

### Components

- **`lib/chatwootService.js`**: Chatwoot API integration
- **`lib/messageTemplate.js`**: Template parsing and rendering
- **`lib/cronJobs.js`**: Automated messaging scheduler
- **`components/BulkMessageModal.js`**: Frontend for bulk messaging

## Migration from WhatsApp API

The old WhatsApp Cloud API implementation is still available but deprecated. The new Chatwoot system:

1. **Replaces** direct WhatsApp API calls
2. **Unifies** all messaging channels
3. **Simplifies** setup and maintenance
4. **Reduces** costs (Chatwoot is free)

## Benefits Over Previous Implementation

| Feature | Old (WhatsApp API) | New (Chatwoot) |
|---------|-------------------|----------------|
| Channels | WhatsApp only | Multi-channel |
| Cost | Paid API | Free |
| Setup | Complex | Simple |
| Scalability | Limited | High |
| Maintenance | High | Low |
| Templates | Meta approval required | Database-managed |

## Troubleshooting

### Cron Jobs Not Running
```bash
# Check if cron is enabled
ENABLE_CRON=true npm run dev

# Manual trigger
npm run test-cron
```

### Chatwoot Connection Issues
1. Verify `CHATWOOT_API_KEY` and `CHATWOOT_URL`
2. Check Chatwoot instance is running
3. Ensure account ID is correct

### Template Variables Not Working
Templates use `{variable}` syntax. Ensure variables exist in client data.

## Future Enhancements

- Webhook integration for incoming messages
- Conversation history in CRM
- Advanced segmentation for marketing
- A/B testing for marketing campaigns
- Analytics dashboard for messaging performance

---

**🎉 Your CRM now has enterprise-grade multi-channel messaging!**