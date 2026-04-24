const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { redis, keys } = require('../services/redis');

const prisma = new PrismaClient();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid Indian phone number' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Redis with 10 min expiry
  await redis.setex(keys.otpCode(phone), 600, otp);

  try {
    await client.messages.create({
      body: `Your ParkIQ OTP is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phone}`
    });
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    // In dev, just return OTP directly
    if (process.env.NODE_ENV === 'development') {
      return res.json({ success: true, otp, message: 'Dev mode: OTP returned directly' });
    }
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const stored = await redis.get(keys.otpCode(phone));
  if (!stored || stored !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  await redis.del(keys.otpCode(phone));

  // Upsert user
  const user = await prisma.user.upsert({
    where: { phone },
    update: { name: name || undefined },
    create: { phone, name: name || null, role: 'DRIVER' },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.json({ success: true, token, user: { id: user.id, phone: user.phone, name: user.name, role: user.role } });
});

module.exports = router;