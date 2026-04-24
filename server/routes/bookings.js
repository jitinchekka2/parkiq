const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { redis, keys } = require('../services/redis');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// POST /api/bookings — Create booking + Razorpay order
router.post('/', auth, async (req, res) => {
  try {
    const { spotId, lotId, hours } = req.body;

    if (!spotId) return res.status(400).json({ error: 'spotId is required' });

    const durationHours = parseInt(hours) || 1;

    // Get spot pricing from MongoDB
    const ParkingSpot = require('../models/ParkingSpot');
    const spot = await ParkingSpot.findById(spotId);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    // Check availability
    const available = parseInt(await redis.get(keys.spotAvailability(spotId)) || spot.totalSlots);
    if (available <= 0) return res.status(400).json({ error: 'No slots available' });

    const amountPaise = spot.pricing.perHour * durationHours * 100;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      notes: { spotId, userId: req.user.id }
    });

    // Generate QR code
    const qrData = `PARKIQ:${spotId}:${req.user.id}:${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Get or create ParkingLot record in PostgreSQL
    let lot = await prisma.parkingLot.findUnique({ where: { mongoSpotId: spotId } });
    if (!lot) {
      // Some seeded Mongo spots may carry legacy operator IDs that do not exist in Prisma User.
      let operatorId = spot.operatorId;
      const operator = operatorId
        ? await prisma.user.findUnique({ where: { id: operatorId }, select: { id: true } })
        : null;

      if (!operator) {
        operatorId = req.user.id;
      }

      lot = await prisma.parkingLot.create({
        data: { operatorId, mongoSpotId: spotId }
      });
    }

    // Create booking in PENDING state
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        lotId: lot.id,
        startTime, endTime,
        status: 'PENDING',
        amountPaise,
        qrCode: qrData,
      }
    });

    // Temporarily hold the slot
    await redis.setex(keys.bookingHold(spotId, req.user.id), 300, booking.id);

    res.json({
      success: true,
      booking: { ...booking, qrCode },
      razorpayOrder: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY
      }
    });
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid spotId' });
    }

    if (err?.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid operator mapping for this spot' });
    }

    console.error('Booking create failed:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// POST /api/bookings/verify-payment — After Razorpay callback
router.post('/verify-payment', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, spotId } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(body).digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  // Confirm booking
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED', paymentId: razorpay_payment_id }
  });

  await prisma.payment.create({
    data: { bookingId, razorpayId: razorpay_payment_id, amount: booking.amountPaise, status: 'captured' }
  });

  // Decrement Redis availability permanently
  await redis.decr(keys.spotAvailability(spotId));
  await redis.del(keys.bookingHold(spotId, req.user.id));

  req.io.emit('spot:update', {
    spotId,
    available: parseInt(await redis.get(keys.spotAvailability(spotId)))
  });

  const qrCode = await QRCode.toDataURL(booking.qrCode);
  res.json({ success: true, booking: { ...booking, qrCode } });
});

// GET /api/bookings/my — Driver's bookings
router.get('/my', auth, async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { lot: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, bookings });
});

// POST /api/bookings/:id/checkin — Operator scans QR
router.post('/:id/checkin', auth, async (req, res) => {
  if (!['OPERATOR', 'ATTENDANT', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE', checkedIn: true }
  });
  res.json({ success: true, booking });
});

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', auth, async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking || booking.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
  if (['ACTIVE', 'COMPLETED'].includes(booking.status)) {
    return res.status(400).json({ error: 'Cannot cancel active/completed booking' });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' }
  });

  // Restore slot
  const lot = await prisma.parkingLot.findUnique({ where: { id: booking.lotId } });
  await redis.incr(keys.spotAvailability(lot.mongoSpotId));

  res.json({ success: true, booking: updated });
});

module.exports = router;