import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Provider from '@/models/Provider';
import { assignProviders } from '@/lib/allocate';
import { notifyClients } from '@/lib/sse'; // we'll build this next

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { customerName, phone, city, serviceType, description } = body;

  // Start a MongoDB transaction for concurrency safety
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // Check duplicate (also enforced by DB index, this gives a clean error)
    const existing = await Lead.findOne({ phone, serviceType }, null, { session: mongoSession });
    if (existing) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: 'This phone number already has a lead for this service.' },
        { status: 409 }
      );
    }

    // Run allocation logic
    const assignedProviders = await assignProviders(serviceType, mongoSession);

    // Create the lead
    const lead = await Lead.create([{
      customerName, phone, city, serviceType, description,
      assignedProviders
    }], { session: mongoSession });

    // Update provider lead lists
    await Provider.updateMany(
      { providerNumber: { $in: assignedProviders } },
      { $push: { leads: lead[0]._id } },
      { session: mongoSession }
    );

    await mongoSession.commitTransaction();

    // Notify all open dashboards via SSE
    notifyClients({ type: 'NEW_LEAD', lead: lead[0], assignedProviders });

    return NextResponse.json({ success: true, lead: lead[0] }, { status: 201 });

  } catch (err) {
    await mongoSession.abortTransaction();
    
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate lead for this phone + service.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
}