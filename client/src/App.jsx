import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API);

const typeColor = {
  ORGANISED: '#00C48C',
  INFORMAL: '#E8500A',
  ON_STREET: '#1A6EFF'
};

export default function App() {
  const [spots, setSpots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('list');  // list | book | confirm
  const [form, setForm] = useState({ name: '', phone: '', hours: 1 });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/spots`).then(r => setSpots(r.data.spots));

    socket.on('spot:update', ({ spotId, available }) => {
      setSpots(prev =>
        prev.map(s => s.id === spotId ? { ...s, available } : s)
      );
    });

    return () => socket.off('spot:update');
  }, []);

  const availColor = (s) => {
    const pct = s.available / s.total;
    if (pct > 0.3) return '#00C48C';
    if (pct > 0.1) return '#F5A623';
    return '#E8500A';
  };

  const handleBook = async () => {
    if (!form.name || !form.phone) return alert('Please fill all fields');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/bookings`, {
        spotId: selected.id,
        ...form
      });
      setBooking(res.data.booking);
      setView('confirm');
    } catch (e) {
      alert(e.response?.data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  const handleReport = async (spotId, status) => {
    await axios.post(`${API}/api/spots/${spotId}/report`, { status });
    setReport({ spotId, status });
    setTimeout(() => setReport(null), 3000);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', background: '#F5F2EC', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#0A0A0F', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#E8500A', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>P/Q</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>ParkIQ</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Hyderabad · {spots.length} spots loaded</div>
        </div>
      </div>

      {/* CONFIRM VIEW */}
      {view === 'confirm' && booking && (
        <div style={{ padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, textAlign: 'center', border: '2px solid #00C48C' }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginTop: 12 }}>Booking Confirmed!</div>
            <div style={{ color: '#666', marginTop: 8 }}>{booking.spotName}</div>
            <div style={{ background: '#F5F2EC', borderRadius: 12, padding: 20, margin: '20px 0' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{booking.qrCode}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Show this code at entry</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span>Duration</span><strong>{booking.hours} hour(s)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 20 }}>
              <span>Amount</span><strong style={{ color: '#E8500A' }}>₹{booking.amount}</strong>
            </div>
            <div style={{ fontSize: 11, color: '#888', background: '#FFF3CD', padding: '8px 12px', borderRadius: 8, marginBottom: 20 }}>
              💡 In production this would charge via Razorpay UPI
            </div>
            <button onClick={() => { setView('list'); setSelected(null); setBooking(null); }}
              style={{ background: '#0A0A0F', color: 'white', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%' }}>
              Back to Map
            </button>
          </div>
        </div>
      )}

      {/* BOOK VIEW */}
      {view === 'book' && selected && (
        <div style={{ padding: 24 }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', marginBottom: 16, color: '#666' }}>← Back</button>
          <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{selected.address}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={{ background: '#F5F2EC', padding: '4px 10px', borderRadius: 100, fontSize: 12 }}>₹{selected.pricePerHour}/hr</span>
              <span style={{ background: '#F5F2EC', padding: '4px 10px', borderRadius: 100, fontSize: 12, color: availColor(selected) }}>
                {selected.available} slots free
              </span>
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Your Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Rahul Sharma"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Phone Number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="9876543210" type="tel"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Hours</label>
              <select value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 15, boxSizing: 'border-box' }}>
                {[1,2,3,4,6,8].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''} — ₹{h * selected.pricePerHour}</option>)}
              </select>
            </div>
            <div style={{ background: '#F5F2EC', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>Total Amount</span>
              <strong style={{ color: '#E8500A', fontSize: 18 }}>₹{form.hours * selected.pricePerHour}</strong>
            </div>
            <button onClick={handleBook} disabled={loading}
              style={{ background: loading ? '#ccc' : '#E8500A', color: 'white', border: 'none', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%' }}>
              {loading ? 'Booking...' : `Confirm Booking — ₹${form.hours * selected.pricePerHour}`}
            </button>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 12, padding: '0 4px' }}>
            Showing parking near <strong>Hyderabad</strong>
          </div>

          {report && (
            <div style={{ background: '#00C48C', color: 'white', borderRadius: 10, padding: '10px 16px', marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
              ✅ Thanks! Report submitted for spot #{report.spotId}
            </div>
          )}

          {spots.map(spot => (
            <div key={spot.id} style={{ background: 'white', borderRadius: 14, padding: 18, marginBottom: 12, border: '1.5px solid #E8E4DC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{spot.name}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{spot.address}</div>
                </div>
                <div style={{ background: availColor(spot), color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700, marginLeft: 10, whiteSpace: 'nowrap' }}>
                  {spot.available} free
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ background: '#F5F2EC', padding: '4px 10px', borderRadius: 100, fontSize: 12, color: typeColor[spot.type] }}>
                  {spot.type.replace('_', ' ')}
                </span>
                <span style={{ background: '#F5F2EC', padding: '4px 10px', borderRadius: 100, fontSize: 12 }}>
                  ₹{spot.pricePerHour}/hr
                </span>
                <span style={{ background: '#F5F2EC', padding: '4px 10px', borderRadius: 100, fontSize: 12 }}>
                  {spot.total} total slots
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { setSelected(spot); setView('book'); }}
                  disabled={spot.available === 0}
                  style={{ flex: 1, background: spot.available > 0 ? '#0A0A0F' : '#ccc', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 600, fontSize: 14, cursor: spot.available > 0 ? 'pointer' : 'not-allowed' }}>
                  {spot.available > 0 ? 'Book Now' : 'Full'}
                </button>
                <button onClick={() => handleReport(spot.id, 'FREE')}
                  style={{ background: '#E6FBF5', color: '#00A076', border: '1.5px solid #9DE8D1', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  ✅ Free
                </button>
                <button onClick={() => handleReport(spot.id, 'OCCUPIED')}
                  style={{ background: '#FFF0EA', color: '#E8500A', border: '1.5px solid #F5C4AC', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🚫 Full
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}