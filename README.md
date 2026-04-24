# 🅿️ ParkIQ — Smart Urban Parking for Indian Cities

> Find it. Book it. Park it. — Reducing parking chaos in Indian cities through real-time intelligence and crowd-powered data.

---

## 🚗 Problem

Urban parking in India is fragmented, time-consuming, and stressful. Drivers spend 20–30 extra minutes per trip hunting for spots, contributing to congestion, fuel waste, and lost productivity. No unified system connects supply (parking lots, informal attendants, on-street spots) with demand (millions of daily drivers).

---

## 💡 Solution: ParkIQ

ParkIQ is a full-stack, real-time parking intelligence platform that:

- **Shows live parking availability** via a map-first interface
- **Supports pre-booking** for organised lots (malls, offices, hospitals)
- **Crowdsources informal spot data** from drivers and attendants
- **Integrates IoT sensors** for premium lot operators
- **Provides analytics** for city planners and lot owners

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          Client Layer                           │
│ React PWA (Driver) | React Web (Operator) | React PWA (Attendant)
└──────────────────────────────┬───────────────────────────────────┘
                               │ REST + WebSocket
┌──────────────────────────────▼───────────────────────────────────┐
│                 API Gateway (Node.js / Express)                 │
│     Auth | Spots | Bookings | Analytics | Realtime Events       │
└─────────────┬─────────────┬─────────────┬───────────────────────┘
              │             │             │
            Redis       PostgreSQL      MongoDB
           (cache)      (bookings)   (spots/reports)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Zustand |
| Styling | Inline styles + custom CSS |
| Maps | Mapbox GL JS |
| Backend | Node.js, Express.js |
| Realtime | Socket.io (WebSocket) |
| Database | PostgreSQL (Prisma), MongoDB (Mongoose) |
| Cache | Redis (live availability, OTP/session helpers) |
| Auth | JWT + OTP via Twilio |
| Payments | Razorpay |
| Hosting | Railway / Vercel |

---

## 📁 Project Structure

```
parkiq/
├── client/               # Driver app (React + Vite)
├── operator/             # Operator dashboard (React + Vite)
├── attendant/            # Attendant app (React + Vite)
├── server/               # Node.js + Express API
│   ├── routes/           # auth, spots, bookings, analytics
│   ├── models/           # Mongoose models
│   ├── middleware/       # auth middleware
│   ├── services/         # redis, integrations
│   └── prisma/           # PostgreSQL schema + migrations
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL
- MongoDB
- Redis

### Installation

```bash
cd server && npm install
cd ../client && npm install
cd ../operator && npm install
cd ../attendant && npm install
```

### Environment Variables

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/parkiq
MONGODB_URI=mongodb://localhost:27017/parkiq
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
TWILIO_SID=your_twilio_sid
TWILIO_AUTH=your_twilio_auth
RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_OPERATOR_URL=http://localhost:5174
VITE_ATTENDANT_URL=http://localhost:5175
```

Create `operator/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Create `attendant/.env`:

```env
VITE_API_URL=http://localhost:5000
```

---

## ▶️ Run Locally

Start backend:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
npm start
```

Start frontend apps in separate terminals:

```bash
cd client && npm run dev
cd operator && npm run dev
cd attendant && npm run dev
```

Default URLs:

- Driver app: http://localhost:5173
- Operator app: http://localhost:5174
- Attendant app: http://localhost:5175
- API: http://localhost:5000

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone |
| POST | `/api/auth/verify-otp` | Verify OTP & get JWT |

### Parking Spots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spots?lat=&lng=&radius=` | Get nearby spots |
| GET | `/api/spots/:id` | Get spot details + live availability |
| POST | `/api/spots` | Create parking lot (operator/admin) |
| PATCH | `/api/spots/:id/availability` | Manually update availability |
| POST | `/api/spots/:id/report` | Crowd report a spot status |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| POST | `/api/bookings/verify-payment` | Verify Razorpay payment |
| GET | `/api/bookings/my` | Get current user's bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/bookings/:id/checkin` | Check in via QR |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/operator` | Operator stats |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `spot:update` | Server → Client | `{ spotId, available }` |

---

## 👥 Stakeholders Addressed

| Stakeholder | How ParkIQ Helps |
|-------------|------------------|
| **Drivers** | Real-time map, pre-booking, navigation |
| **Parking Lot Operators** | Dashboard, live overrides, revenue visibility |
| **Informal Attendants** | Fast reporting app for slot status |
| **Municipal Corporations** | Potential aggregated demand insights |

---

## 🗺️ Roadmap

**Hackathon MVP (48h)**

- [x] Map view with live spot data
- [x] Booking flow with Razorpay
- [x] Real-time updates via Socket.io
- [x] Operator dashboard
- [x] Attendant reporting flow

**Phase 2 (Month 1–3)**

- [ ] IoT sensor SDK for lot operators
- [ ] Vernacular onboarding for attendants
- [ ] Predictive availability (ML)

**Phase 3 (Month 3–6)**

- [ ] City API partnerships
- [ ] EV charging slot integration
- [ ] Monthly subscription passes

---

## 🤝 Team

Built with ❤️ for Indian cities at Krithathon 4.0 2026.

---

## 📄 License

MIT
