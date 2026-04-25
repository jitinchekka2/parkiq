import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../store/auth';

export default function Book() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [spot, setSpot] = useState(null);
    const [hours, setHours] = useState(1);
    const [loading, setLoading] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        api.get(`/api/spots/${id}`).then(r => setSpot(r.data.spot));
    }, [id]);

    const handleBook = async () => {
        setLoading(true);
        try {
            const res = await api.post('/api/bookings', { spotId: id, hours });
            const { razorpayOrder, booking } = res.data;

            // Open Razorpay
            const rzp = new window.Razorpay({
                key: razorpayOrder.key,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                order_id: razorpayOrder.id,
                name: 'ParkIQ',
                description: `Booking: ${spot.name}`,
                handler: async (response) => {
                    const verify = await api.post('/api/bookings/verify-payment', {
                        ...response,
                        bookingId: booking.id,
                        spotId: id
                    });
                    navigate(`/booking/${verify.data.booking.id}`);
                },
                theme: { color: '#E8500A' }
            });
            rzp.open();
        } catch (e) {
            alert(e.response?.data?.error || 'Booking failed');
        }
        setLoading(false);
    };

    if (!spot) return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', fontFamily: 'system-ui' }}>
            <div style={{ background: '#0A0A0F', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
                <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>Confirm Booking</span>
                <button
                    onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                    }}
                    style={{ background: 'white', color: '#0A0A0F', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                    Logout
                </button>
            </div>

            <div style={{ padding: 20 }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{spot.name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{spot.address}</div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <span style={{ background: '#F5F2EC', padding: '4px 12px', borderRadius: 100, fontSize: 13 }}>₹{spot.pricing.perHour}/hr</span>
                        <span style={{ background: '#E6FBF5', color: '#00A076', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>
                            {spot.available} slots free
                        </span>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 14 }}>Select Duration</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                        {[1, 2, 3, 4, 6, 8].map(h => (
                            <button key={h} onClick={() => setHours(h)}
                                style={{ background: hours === h ? '#E8500A' : '#F5F2EC', color: hours === h ? 'white' : '#333', border: 'none', borderRadius: 10, padding: '14px 10px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                {h}h<br /><span style={{ fontWeight: 400, fontSize: 12 }}>₹{h * spot.pricing.perHour}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666' }}>Parking fee</span>
                        <span>₹{hours * spot.pricing.perHour}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666' }}>Duration</span>
                        <span>{hours} hour{hours > 1 ? 's' : ''}</span>
                    </div>
                    <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #eee' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>Total</span>
                        <span style={{ fontWeight: 800, fontSize: 20, color: '#E8500A' }}>₹{hours * spot.pricing.perHour}</span>
                    </div>
                </div>

                <button onClick={handleBook} disabled={loading}
                    style={{ width: '100%', background: loading ? '#ccc' : '#E8500A', color: 'white', border: 'none', borderRadius: 14, padding: 18, fontWeight: 800, fontSize: 17, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Processing...' : `Pay ₹${hours * spot.pricing.perHour} via UPI / Card`}
                </button>
            </div>
        </div>
    );
}