const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Mock spot data — Hyderabad locations
const spots = [
    {
        id: '1',
        name: 'GVK One Mall Parking',
        lat: 17.4239, lng: 78.4738,
        total: 200, available: 45,
        pricePerHour: 40,
        type: 'ORGANISED',
        address: 'Road No. 1, Banjara Hills, Hyderabad'
    },
    {
        id: '2',
        name: 'Inorbit Mall Parking',
        lat: 17.4334, lng: 78.3876,
        total: 500, available: 120,
        pricePerHour: 30,
        type: 'ORGANISED',
        address: 'Inorbit Mall, Cyberabad, Hyderabad'
    },
    {
        id: '3',
        name: 'Shilparamam Open Lot',
        lat: 17.4497, lng: 78.3759,
        total: 80, available: 12,
        pricePerHour: 20,
        type: 'INFORMAL',
        address: 'Shilparamam, Hi-Tech City, Hyderabad'
    },
    {
        id: '4',
        name: 'Jubilee Hills Roadside',
        lat: 17.4317, lng: 78.4074,
        total: 30, available: 8,
        pricePerHour: 10,
        type: 'ON_STREET',
        address: 'Road No. 36, Jubilee Hills, Hyderabad'
    },
    {
        id: '5',
        name: 'Forum Sujana Mall',
        lat: 17.4950, lng: 78.3763,
        total: 300, available: 200,
        pricePerHour: 30,
        type: 'ORGANISED',
        address: 'KPHB Colony, Kukatpally, Hyderabad'
    }
];

// In-memory bookings store
const bookings = [];

// GET spots
app.get('/api/spots', (req, res) => {
    res.json({ success: true, spots });
});

// GET single spot
app.get('/api/spots/:id', (req, res) => {
    const spot = spots.find(s => s.id === req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    res.json({ success: true, spot });
});

// POST booking
app.post('/api/bookings', (req, res) => {
    const { spotId, name, phone, hours } = req.body;
    const spot = spots.find(s => s.id === spotId);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });
    if (spot.available <= 0) return res.status(400).json({ error: 'No slots available' });

    // Deduct availability
    spot.available -= 1;

    const booking = {
        id: `BK${Date.now()}`,
        spotId,
        spotName: spot.name,
        name,
        phone,
        hours: parseInt(hours),
        amount: spot.pricePerHour * parseInt(hours),
        status: 'CONFIRMED',
        qrCode: `PARKIQ-${spotId}-${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);

    // Broadcast updated availability to all clients
    io.emit('spot:update', { spotId, available: spot.available });

    res.json({ success: true, booking });
});

// POST crowd report
app.post('/api/spots/:id/report', (req, res) => {
    const { status } = req.body; // FREE | OCCUPIED
    const spot = spots.find(s => s.id === req.params.id);
    if (!spot) return res.status(404).json({ error: 'Spot not found' });

    if (status === 'FREE') spot.available = Math.min(spot.available + 1, spot.total);
    if (status === 'OCCUPIED') spot.available = Math.max(spot.available - 1, 0);

    io.emit('spot:update', { spotId: req.params.id, available: spot.available });
    res.json({ success: true, message: 'Report received', available: spot.available });
});

// GET all bookings (for demo/admin)
app.get('/api/bookings', (req, res) => {
    res.json({ success: true, bookings });
});

// Health check
app.get('/', (req, res) => res.json({ status: 'ParkIQ API running ✅' }));

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
let currentPort = DEFAULT_PORT;

function startServer(port) {
    currentPort = port;
    httpServer.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const nextPort = currentPort + 1;
        console.warn(`Port in use. Retrying on port ${nextPort}...`);
        startServer(nextPort);
        return;
    }

    throw err;
});

startServer(DEFAULT_PORT);