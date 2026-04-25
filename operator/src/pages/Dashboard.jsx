import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    api.get('/api/analytics/operator').then(r => setStats(r.data.stats));

    api
      .get('/api/spots/mine')
      .then((r) => setSpots(r.data.spots || []))
      .finally(() => setLoadingSpots(false));
  }, []);

  const updateAvailability = async (spotId, available) => {
    await api.patch(`/api/spots/${spotId}/availability`, { available });
    setSpots((prev) => prev.map((spot) => (spot._id === spotId ? { ...spot, available } : spot)));
  };

  const statCard = (label, value, accent) => (
    <div style={{ background: 'white', borderRadius: 16, padding: 24, flex: 1 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 28, color: accent || '#0A0A0F' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', fontFamily: 'system-ui' }}>
      <div style={{ background: '#0A0A0F', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 20 }}>🅿 ParkIQ Operator</span>
        <button
          onClick={logout}
          style={{ background: 'white', color: '#0A0A0F', border: '1px solid #ddd', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {stats && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            {statCard('Total Bookings', stats.totalBookings)}
            {statCard('Revenue Today', `₹${stats.totalRupees}`, '#E8500A')}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Your Parking Lots</div>

          {loadingSpots && <p style={{ color: '#888', fontSize: 14 }}>Loading your parking lots...</p>}

          {!loadingSpots && spots.length === 0 && (
            <p style={{ color: '#888', fontSize: 14 }}>
              You have no parking lots yet. Add your lots via the API or contact support to get listed.
            </p>
          )}

          {!loadingSpots && spots.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {spots.map((spot) => (
                <div
                  key={spot._id}
                  style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
                >
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{spot.name}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>{spot.address || 'Address not provided'}</div>
                    <div style={{ color: '#444', fontSize: 13, marginTop: 6 }}>
                      Available: {spot.available} / {spot.totalSlots}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateAvailability(spot._id, Math.max((spot.available || 0) - 1, 0))}
                      style={{ border: '1px solid #ddd', background: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateAvailability(spot._id, Math.min((spot.available || 0) + 1, spot.totalSlots))}
                      style={{ border: '1px solid #ddd', background: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      +1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}