import Provider from '@/models/Provider';
import AllocationState from '@/models/AllocationState';

// Business rules defined here
const RULES = {
  'Service 1': { mandatory: [1],    pool: [2, 3, 4],          totalSlots: 3 },
  'Service 2': { mandatory: [5],    pool: [6, 7, 8],          totalSlots: 3 },
  'Service 3': { mandatory: [1, 4], pool: [2, 3, 5, 6, 7, 8], totalSlots: 3 },
};

export async function assignProviders(serviceType, session) {
  const rule = RULES[serviceType];
  const assigned = [];

  // Step 1: Add mandatory providers (if quota available)
  for (const providerNum of rule.mandatory) {
    const provider = await Provider.findOne(
      { providerNumber: providerNum },
      null,
      { session }
    );
    
    if (provider && provider.leadsReceived < provider.monthlyQuota) {
      assigned.push(providerNum);
    }
    // Note: if mandatory provider has no quota, still count the slot
    // but don't assign — adjust business logic here if needed
  }

  // Step 2: How many more do we need from the pool?
  const needed = rule.totalSlots - assigned.length;

  // Step 3: Fair round-robin from pool
  if (needed > 0) {
    const poolProviders = rule.pool.filter(n => !assigned.includes(n));
    const roundRobinPicks = await fairPick(serviceType, poolProviders, needed, session);
    assigned.push(...roundRobinPicks);
  }

  // Step 4: Update leadsReceived for all assigned providers
  await Provider.updateMany(
    { providerNumber: { $in: assigned } },
    { $inc: { leadsReceived: 1 } },
    { session }
  );

  return assigned;
}

async function fairPick(serviceType, pool, needed, session) {
  // Get or create allocation state for this service
  let state = await AllocationState.findOneAndUpdate(
    { serviceType },
    { $setOnInsert: { currentIndex: 0 } },
    { upsert: true, new: true, session }
  );

  const picked = [];
  let index = state.currentIndex;
  let attempts = 0;

  // Get quota info for all pool providers
  const providers = await Provider.find(
    { providerNumber: { $in: pool } },
    null,
    { session }
  );

  const quotaMap = {};
  providers.forEach(p => {
    quotaMap[p.providerNumber] = p.monthlyQuota - p.leadsReceived;
  });

  // Round-robin through the pool, skipping full providers
  while (picked.length < needed && attempts < pool.length * 2) {
    const candidate = pool[index % pool.length];

    if (quotaMap[candidate] > 0 && !picked.includes(candidate)) {
      picked.push(candidate);
      quotaMap[candidate]--; // decrement in memory to avoid picking same again
    }

    index++;
    attempts++;
  }

  // Save the updated index back to DB so next lead continues from here
  await AllocationState.findOneAndUpdate(
    { serviceType },
    { currentIndex: index % pool.length },
    { session }
  );

  return picked;
}