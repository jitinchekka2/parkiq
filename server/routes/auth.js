const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { redis, keys } = require('../services/redis');

const prisma = new PrismaClient();
const hasTwilioConfig = Boolean(
  process.env.TWILIO_SID && process.env.TWILIO_AUTH && process.env.TWILIO_PHONE
);
const twilioClient = hasTwilioConfig
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH)
  : null;

const shouldBypassSms = () => {
  if (process.env.OTP_BYPASS_SMS === 'true') return true;
  return process.env.NODE_ENV !== 'production';
};

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid Indian phone number' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Redis with 10 min expiry
  await redis.setex(keys.otpCode(phone), 600, otp);

  if (!twilioClient) {
    if (shouldBypassSms()) {
      return res.json({
        success: true,
        otp,
        message: 'SMS bypass enabled: OTP returned directly',
      });
    }
    return res.status(503).json({ error: 'OTP service unavailable' });
  }

  try {
    await twilioClient.messages.create({
      body: `Your ParkIQ OTP is ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phone}`
    });
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('OTP send failed:', {
      code: err.code,
      message: err.message,
      status: err.status,
    });

    if (shouldBypassSms()) {
      return res.json({
        success: true,
        otp,
        message: 'SMS failed; OTP returned directly due to bypass mode',
      });
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