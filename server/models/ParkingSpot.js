const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  operatorId: { type: String, required: true },
  type: { type: String, enum: ['ORGANISED', 'INFORMAL', 'ON_STREET'], required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]   // [longitude, latitude]
  },
  address: String,
  landmark: String,
  totalSlots: { type: Number, required: true },
  pricing: {
    perHour: { type: Number, required: true },
    perDay: Number,
  },
  amenities: [{ type: String, enum: ['covered', 'ev_charging', 'cctv', 'attendant', 'accessible'] }],
  images: [String],
  verified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

parkingSpotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);