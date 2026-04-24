const mongoose = require('mongoose');

const crowdReportSchema = new mongoose.Schema({
  spotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpot', required: true },
  reporterId: String,
  status: { type: String, enum: ['FREE', 'OCCUPIED'], required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 20 * 60 * 1000) },
}, { timestamps: true });

crowdReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
crowdReportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CrowdReport', crowdReportSchema);