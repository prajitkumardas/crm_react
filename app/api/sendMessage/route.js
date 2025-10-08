import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendMessageToClient } from '../../../lib/chatwootService'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { conversation_id, message } = req.body;

  if (!conversation_id || !message) {
    return res.status(400).json({ error: 'Missing conversation_id or message' });
  }

  try {
    // For backward compatibility, we'll use the conversation_id directly
    // In a full implementation, you'd look up the client first
    const result = await sendMessageToClient({ chatwoot_conversation_id: conversation_id }, message);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error in sendMessage API:', error);
    res.status(500).json({ error: error.message });
  }
}

// Next.js 13+ App Router version
export async function POST(request) {
  try {
    const { conversation_id, message } = await request.json();

    if (!conversation_id || !message) {
      return NextResponse.json(
        { error: 'Missing conversation_id or message' },
        { status: 400 }
      );
    }

    // For backward compatibility, we'll use the conversation_id directly
    // In a full implementation, you'd look up the client first
    const result = await sendMessageToClient({ chatwoot_conversation_id: conversation_id }, message);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in sendMessage API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}