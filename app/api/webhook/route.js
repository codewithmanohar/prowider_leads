import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Provider from '@/models/Provider';
import WebhookEvent from '@/models/WebhookEvent';

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { eventId, type } = body;

  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  // ✅ Idempotency check — if already processed, return success without doing anything
  const alreadyProcessed = await WebhookEvent.findOne({ eventId });
  if (alreadyProcessed) {
    return NextResponse.json({ success: true, message: 'Already processed' });
  }

  if (type === 'quota-reset') {
    // Reset all providers
    await Provider.updateMany({}, { leadsReceived: 0, monthlyQuota: 10 });

    // Mark this event as processed
    await WebhookEvent.create({ eventId, type });

    return NextResponse.json({ success: true, message: 'Quota reset complete' });
  }

  return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
}