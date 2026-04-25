const express = require('express');
const router = express.Router();
const ParkingSpot = require('../models/ParkingSpot');
const CrowdReport = require('../models/CrowdReport');
const { redis, keys } = require('../services/redis');
const auth = require('../middleware/auth');

const enrichSpotWithAvailability = async (spot) => {
  const available = await redis.get(keys.spotAvailability(spot._id.toString()));
  return {
    ...spot.toObject(),
    available: available !== null ? parseInt(available) : spot.totalSlots,
  };
};

// GET /api/spots?lat=&lng=&radius=&type=
router.get('/', async (req, res) => {
  const { lat, lng, radius = 3000, type } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const query = {
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius)
      }
    }
  };
  if (type) query.type = type;

  const spots = await ParkingSpot.find(query).limit(20);

  // Enrich with live availability from Redis
  const enriched = await Promise.all(spots.map(enrichSpotWithAvailability));

  res.json({ success: true, spots: enriched });
});

// GET /api/spots/mine — Fetch logged-in operator spots
router.get('/mine', auth, async (req, res) => {
  if (!['OPERATOR', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Operators only' });
  }

  const spots = await ParkingSpot.find({ operatorId: req.user.id, isActive: true }).sort({ createdAt: -1 });
  const enriched = await Promise.all(spots.map(enrichSpotWithAvailability));

  res.json({ success: true, spots: enriched });
});

// GET /api/spots/:id
router.get('/:id', async (req, res) => {
  const spot = await ParkingSpot.findById(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Spot not found' });

  res.json({
    success: true,
    spot: await enrichSpotWithAvailability(spot)
  });
});

// POST /api/spots — Operator creates a lot
router.post('/', auth, async (req, res) => {
  if (!['OPERATOR', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Operators only' });
  }

  const { name, lat, lng, address, landmark, totalSlots, pricePerHour, type, amenities } = req.body;

  const spot = await ParkingSpot.create({
    name, operatorId: req.user.id, type,
    location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    address, landmark,
    totalSlots: parseInt(totalSlots),
    pricing: { perHour: parseInt(pricePerHour) },
    amenities: amenities || [],
  });

  // Initialise availability in Redis
  await redis.set(keys.spotAvailability(spot._id.toString()), totalSlots);

  res.json({ success: true, spot });
});

// PATCH /api/spots/:id/availability — Operator manual update
router.patch('/:id/availability', auth, async (req, res) => {
  const { available } = req.body;
  const spot = await ParkingSpot.findById(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Spot not found' });

  const isAllowed = req.user.role === 'ADMIN' || spot.operatorId === req.user.id;
  if (!isAllowed) return res.status(403).json({ error: 'Not allowed to update this spot' });

  const spotKey = keys.spotAvailability(req.params.id);
  await redis.set(spotKey, available);

  // Broadcast to all clients
  req.io.emit('spot:update', { spotId: req.params.id, available: parseInt(available) });

  res.json({ success: true, available: parseInt(available) });
});

// POST /api/spots/:id/report — Crowd report
router.post('/:id/report', auth, async (req, res) => {
  const { status } = req.body;
  const spot = await ParkingSpot.findById(req.params.id);
  if (!spot) return res.status(404).json({ error: 'Spot not found' });

  await CrowdReport.create({
    spotId: spot._id,
    reporterId: req.user.id,
    status,
    location: spot.location,
  });

  const spotKey = keys.spotAvailability(req.params.id);
  const current = parseInt(await redis.get(spotKey) || spot.totalSlots);

  let updated = current;
  if (status === 'FREE') updated = Math.min(current + 1, spot.totalSlots);
  if (status === 'OCCUPIED') updated = Math.max(current - 1, 0);

  await redis.set(spotKey, updated);
  req.io.emit('spot:update', { spotId: req.params.id, available: updated });

  res.json({ success: true, available: updated });
});

module.exports = router;