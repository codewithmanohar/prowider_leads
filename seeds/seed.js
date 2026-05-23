import { connectDB } from '../lib/mongodb.js';
import Provider from '../models/Provider.js';
import AllocationState from '../models/AllocationState.js';

async function seed() {
  await connectDB();

  await Provider.deleteMany({});
  await AllocationState.deleteMany({});

  const providers = Array.from({ length: 8 }, (_, i) => ({
    providerNumber: i + 1,
    name: `Provider ${i + 1}`,
    monthlyQuota: 10,
    leadsReceived: 0,
    leads: []
  }));

  await Provider.insertMany(providers);

  // Initialize round-robin state for each service
  await AllocationState.insertMany([
    { serviceType: 'Service 1', currentIndex: 0 },
    { serviceType: 'Service 2', currentIndex: 0 },
    { serviceType: 'Service 3', currentIndex: 0 },
  ]);

  console.log('✅ Seed complete');
  process.exit(0);
}

seed();