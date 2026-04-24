const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/analytics/operator — Operator's revenue & utilisation
router.get('/operator', auth, async (req, res) => {
  if (!['OPERATOR', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Operators only' });
  }

  const lots = await prisma.parkingLot.findMany({ where: { operatorId: req.user.id } });
  const lotIds = lots.map(l => l.id);

  const [totalBookings, revenue, recentBookings] = await Promise.all([
    prisma.booking.count({ where: { lotId: { in: lotIds }, status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } } }),
    prisma.booking.aggregate({
      where: { lotId: { in: lotIds }, status: { in: ['CONFIRMED', 'ACTIVE', 'COMPLETED'] } },
      _sum: { amountPaise: true }
    }),
    prisma.booking.findMany({
      where: { lotId: { in: lotIds } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true, phone: true } } }
    })
  ]);

  res.json({
    success: true,
    stats: {
      totalBookings,
      totalRevenuePaise: revenue._sum.amountPaise || 0,
      totalRupees: Math.round((revenue._sum.amountPaise || 0) / 100),
    },
    recentBookings
  });
});

module.exports = router;