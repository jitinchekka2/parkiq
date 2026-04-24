# ParkIQ

Smart parking MVP with live slot availability, OTP login, booking and payment flow, and separate web apps for drivers, operators, and attendants.

## What This Project Includes

- Driver app: discover nearby parking spots on map, view live availability, book and pay.
- Operator app: monitor bookings and revenue analytics.
- Attendant app: quickly report slot status (FREE/OCCUPIED) from ground.
- Backend API: auth, parking spots, bookings, analytics, real-time socket events.

## Monorepo Layout

- `client`: Driver-facing React app (Vite).
- `operator`: Operator dashboard React app (Vite).
- `attendant`: Attendant React app (Vite).
- `server`: Node.js + Express API with Redis, MongoDB, Prisma (PostgreSQL), Socket.IO.

## Tech Stack

- Frontend: React, Vite, Axios, Zustand, Socket.IO client.
- Maps: Mapbox GL.
- Backend: Express, Socket.IO, JWT, Twilio, Razorpay.
- Data:
  - MongoDB (parking spots and crowd reports).
  - PostgreSQL via Prisma (users, lots, bookings, payments).
  - Redis (OTP cache, slot availability, temporary booking holds).

## Core Flow

1. Driver logs in with phone OTP.
2. Driver sees nearby spots and live slot counts.
3. Driver creates booking and Razorpay order.
4. Payment is verified, booking confirmed, slot count decremented.
5. Operator views booking and revenue analytics.
6. Attendant crowd-reports slot status, instantly updating clients via Socket.IO.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance
- PostgreSQL instance
- Redis instance
- Twilio account (for production OTP delivery)
- Razorpay account
- Mapbox token

## Environment Variables

Create `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# CORS / client origins
CLIENT_URL=http://localhost:5173
OPERATOR_URL=http://localhost:5174
ATTENDANT_URL=http://localhost:5175
CORS_ORIGINS=

# Data stores
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>?schema=public
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d

# Twilio OTP
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH=xxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+1xxxxxxxxxx

# Razorpay
RAZORPAY_KEY=rzp_test_xxxxxxxxxx
RAZORPAY_SECRET=xxxxxxxxxxxxxxxxxx
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxxxxx
```

Create `operator/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Create `attendant/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Local Setup

Install dependencies in each project:

```bash
cd server && npm install
cd ../client && npm install
cd ../operator && npm install
cd ../attendant && npm install
```

Generate Prisma client and apply migrations:

```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

Optional seed for Mongo parking spots:

```bash
cd server
node seed.js
```

## Run Locally

Start API:

```bash
cd server
npm start
```

Start frontend apps in separate terminals:

```bash
cd client
npm run dev
```

```bash
cd operator
npm run dev
```

```bash
cd attendant
npm run dev
```

Expected default URLs:

- Driver app: http://localhost:5173
- Operator app: http://localhost:5174
- Attendant app: http://localhost:5175
- API: http://localhost:5000

## API Summary

Auth:

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`

Spots:

- `GET /api/spots?lat=&lng=&radius=&type=`
- `GET /api/spots/:id`
- `POST /api/spots` (operator/admin)
- `PATCH /api/spots/:id/availability` (operator/manual)
- `POST /api/spots/:id/report` (attendant/operator/admin)

Bookings:

- `POST /api/bookings`
- `POST /api/bookings/verify-payment`
- `GET /api/bookings/my`
- `POST /api/bookings/:id/checkin`
- `PATCH /api/bookings/:id/cancel`

Analytics:

- `GET /api/analytics/operator`

Health:

- `GET /`

## Real-Time Events

Socket event emitted by server:

- `spot:update` with `{ spotId, available }`

Used by the driver map to refresh slot badges in real time.

## Scripts

Server:

- `npm start`

Client, Operator, Attendant:

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
