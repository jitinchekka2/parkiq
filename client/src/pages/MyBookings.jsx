import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../store/auth';

const statusStyle = {
    PENDING: { bg: '#FFF3E0', color: '#B26A00' },
    CONFIRMED: { bg: '#E7F7EF', color: '#007F55' },
    ACTIVE: { bg: '#E6F0FF', color: '#1D4ED8' },
    COMPLETED: { bg: '#EEF0F3', color: '#374151' },
    CANCELLED: { bg: '#FDECEC', color: '#B42318' },
};

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

const isCancellable = (status) => ['PENDING', 'CONFIRMED'].includes(status);

export default function MyBookings() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await api.get('/api/bookings/my');
                setBookings(res.data?.bookings || []);
            } catch {
                setError('Unable to load bookings right now. Please try again.');
            }
            setLoading(false);
        };

        load();
    }, []);

    const activeCount = useMemo(
        () => bookings.filter((booking) => ['CONFIRMED', 'ACTIVE'].includes(booking.status)).length,
        [bookings]
    );

    const handleCancel = async (bookingId) => {
        setBusyId(bookingId);
        try {
            const res = await api.patch(`/api/bookings/${bookingId}/cancel`);
            const updated = res.data?.booking;
            if (updated) {
                setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, ...updated } : booking)));
            }
        } catch (e) {
            alert(e.response?.data?.error || 'Unable to cancel this booking');
        }
        setBusyId('');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F5F2EC', fontFamily: 'system-ui' }}>
            <div style={{ background: '#0A0A0F', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>←</button>
                <span style={{ fontWeight: 700, fontSize: 17, flex: 1 }}>My Bookings</span>
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

            <div style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 18px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: 24 }}>Bookings Overview</div>
                    <div style={{ marginTop: 4, color: '#666' }}>
                        Total: {bookings.length} · Active: {activeCount}
                    </div>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: 28, color: '#555' }}>Loading bookings...</div>}
                {!loading && error && <div style={{ textAlign: 'center', padding: 28, color: '#B42318' }}>{error}</div>}

                {!loading && !error && bookings.length === 0 && (
                    <div style={{ background: 'white', borderRadius: 16, padding: 28, textAlign: 'center', boxShadow: '0 2px 18px rgba(0,0,0,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>No bookings yet</div>
                        <div style={{ color: '#666', marginTop: 6 }}>Book your first parking spot from the live map.</div>
                        <button
                            onClick={() => navigate('/map')}
                            style={{ marginTop: 16, background: '#E8500A', color: 'white', border: 'none', borderRadius: 12, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Go To Map
                        </button>
                    </div>
                )}

                {!loading && !error && bookings.length > 0 && (
                    <div style={{ display: 'grid', gap: 12 }}>
                        {bookings.map((booking) => {
                            const style = statusStyle[booking.status] || { bg: '#EEE', color: '#444' };
                            return (
                                <article key={booking.id} style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 18px rgba(0,0,0,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontWeight: 800 }}>Booking #{booking.id.slice(-8).toUpperCase()}</div>
                                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Created {dateTime.format(new Date(booking.createdAt))}</div>
                                        </div>
                                        <span style={{ background: style.bg, color: style.color, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#777' }}>Start</div>
                                            <div style={{ fontWeight: 600, marginTop: 2 }}>{dateTime.format(new Date(booking.startTime))}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#777' }}>End</div>
                                            <div style={{ fontWeight: 600, marginTop: 2 }}>{dateTime.format(new Date(booking.endTime))}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#777' }}>Amount</div>
                                            <div style={{ fontWeight: 700, color: '#E8500A', marginTop: 2 }}>
                                                {currency.format(Math.round((booking.amountPaise || 0) / 100))}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#777' }}>Lot Name</div>
                                            <div style={{ fontWeight: 600, marginTop: 2 }}>{booking.lotName || 'Unknown Lot'}</div>
                                        </div>
                                    </div>

                                    {booking.qrCodeImage && (
                                        <div style={{ marginTop: 14 }}>
                                            <div style={{ fontSize: 12, color: '#777', marginBottom: 8 }}>QR Code</div>
                                            <img
                                                src={booking.qrCodeImage}
                                                alt={`QR for booking ${booking.id}`}
                                                style={{ width: 120, height: 120, borderRadius: 10, border: '1px solid #eee', background: 'white' }}
                                            />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                                        <button
                                            onClick={() => navigate(`/booking/${booking.id}`)}
                                            style={{ background: '#F5F2EC', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            View Receipt
                                        </button>
                                        {isCancellable(booking.status) && (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={busyId === booking.id}
                                                style={{ background: busyId === booking.id ? '#e6a185' : '#E8500A', color: 'white', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 700, cursor: busyId === booking.id ? 'not-allowed' : 'pointer' }}
                                            >
                                                {busyId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
