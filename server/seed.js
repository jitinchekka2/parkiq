require('dotenv').config();
const mongoose = require('mongoose');
const ParkingSpot = require('./models/ParkingSpot');
const { redis, keys } = require('./services/redis');

const SPOTS = [
  { name: 'GVK One Mall Parking', lat: 17.4239, lng: 78.4738, total: 200, price: 40, type: 'ORGANISED', address: 'Road No. 1, Banjara Hills', amenities: ['covered', 'cctv'] },
  { name: 'Inorbit Mall Parking', lat: 17.4334, lng: 78.3876, total: 500, price: 30, type: 'ORGANISED', address: 'Inorbit Mall, Cyberabad', amenities: ['covered', 'cctv', 'ev_charging'] },
  { name: 'Shilparamam Open Lot', lat: 17.4497, lng: 78.3759, total: 80, price: 20, type: 'INFORMAL', address: 'Shilparamam, Hi-Tech City', amenities: ['attendant'] },
  { name: 'Jubilee Hills Roadside', lat: 17.4317, lng: 78.4074, total: 30, price: 10, type: 'ON_STREET', address: 'Road No. 36, Jubilee Hills', amenities: [] },
  { name: 'Forum Sujana Mall', lat: 17.4950, lng: 78.3763, total: 300, price: 30, type: 'ORGANISED', address: 'KPHB Colony, Kukatpally', amenities: ['covered', 'cctv'] },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await ParkingSpot.deleteMany({});

  for (const s of SPOTS) {
    const spot = await ParkingSpot.create({
      name: s.name, operatorId: 'seed-operator', type: s.type,
      location: { type: 'Point', coordinates: [s.lng, s.lat] },
      address: s.address, totalSlots: s.total,
      pricing: { perHour: s.price },
      amenities: s.amenities, verified: true
    });
    await redis.set(keys.spotAvailability(spot._id.toString()), Math.floor(s.total * 0.4));
    console.log(`✅ Seeded: ${spot.name}`);
  }

  console.log('Seeding complete');
  process.exit(0);
}

seed();