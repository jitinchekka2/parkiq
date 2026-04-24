import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [spots, setSpots] = useState([]);
  const { logout } = useAuth();

  useEffect(() => {
    api.get('/api/analytics/operator').then(r => setStats(r.data.stats));
    // Fetch operator's spots
  }, []);

  const updateAvailability = async (spotId, available) => {
    await api.patch(`/api/spots/${spotId}/availability`, { available });
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
          <p style={{ color: '#888', fontSize: 14 }}>
            Add your lots via the API or contact support to get listed. Once listed, manage live availability here.
          </p>
        </div>
      </div>
    </div>
  );
}