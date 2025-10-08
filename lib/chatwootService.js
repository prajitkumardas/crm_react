// Chatwoot Service
// Handles all Chatwoot API interactions

const CHATWOOT_URL = process.env.CHATWOOT_URL;
const CHATWOOT_API_KEY = process.env.CHATWOOT_API_KEY;
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || 1;

// Send message via Chatwoot API
export async function sendMessage(conversationId, message, messageType = 'outgoing') {
  if (!conversationId || !message) {
    throw new Error('Conversation ID and message are required');
  }

  const url = `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_API_KEY
      },
      body: JSON.stringify({
        content: message,
        message_type: messageType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Chatwoot API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
      conversationId: conversationId
    };
  } catch (error) {
    console.error('Error sending message via Chatwoot:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Create conversation for a client (if doesn't exist)
export async function createConversation(clientPhone, clientName, inboxId = 1) {
  const url = `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': CHATWOOT_API_KEY
      },
      body: JSON.stringify({
        inbox_id: inboxId,
        contact: {
          name: clientName,
          phone_number: clientPhone
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create conversation: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      conversationId: data.id,
      contactId: data.contact.id
    };
  } catch (error) {
    console.error('Error creating Chatwoot conversation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get conversation by contact phone
export async function getConversationByPhone(phoneNumber) {
  const url = `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api_access_token': CHATWOOT_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const data = await response.json();
    const conversations = data.data || data;

    // Find conversation by phone number
    for (const conversation of conversations) {
      if (conversation.contact?.phone_number === phoneNumber) {
        return {
          success: true,
          conversationId: conversation.id,
          contactId: conversation.contact.id
        };
      }
    }

    return { success: false, error: 'Conversation not found' };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Send message with automatic conversation creation
export async function sendMessageToClient(client, message) {
  let conversationId = client.chatwoot_conversation_id;

  // If no conversation exists, try to find or create one
  if (!conversationId) {
    // Try to find existing conversation
    const existing = await getConversationByPhone(client.phone);
    if (existing.success) {
      conversationId = existing.conversationId;
    } else {
      // Create new conversation
      const created = await createConversation(client.phone, client.name);
      if (created.success) {
        conversationId = created.conversationId;
      } else {
        return {
          success: false,
          error: `Failed to create conversation: ${created.error}`
        };
      }
    }
  }

  // Send the message
  const result = await sendMessage(conversationId, message);

  if (result.success) {
    result.conversationId = conversationId;
  }

  return result;
}