import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';

export default function BookingSuccess() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBooking = async () => {
            try {
                const res = await api.get('/api/bookings/my');
                const found = res.data?.bookings?.find((b) => b.id === id) || null;
                setBooking(found);
            } catch {
                setBooking(null);
            }
            setLoading(false);
        };

        loadBooking();
    }, [id]);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading booking...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', fontFamily: 'system-ui', padding: 20 }}>
            <div style={{ maxWidth: 560, margin: '40px auto 0', background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <h1 style={{ margin: 0, fontSize: 24 }}>Booking Confirmed</h1>
                <p style={{ color: '#666', marginTop: 8 }}>
                    Your payment was successful and booking is confirmed.
                </p>

                <div style={{ background: '#F8F8F8', borderRadius: 12, padding: 14, marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>Booking ID</div>
                    <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>{id}</div>
                </div>

                {booking && (
                    <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Status</span>
                            <span style={{ fontWeight: 700 }}>{booking.status}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666' }}>Amount</span>
                            <span style={{ fontWeight: 700 }}>₹{Math.round((booking.amountPaise || 0) / 100)}</span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <button
                        onClick={() => navigate('/my-bookings')}
                        style={{ flex: 1, background: '#F5F2EC', color: '#0A0A0F', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={() => navigate('/map')}
                        style={{ flex: 1, background: '#0A0A0F', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, cursor: 'pointer' }}
                    >
                        Back To Map
                    </button>
                </div>
            </div>
        </div>
    );
}
