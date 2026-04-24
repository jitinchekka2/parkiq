import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export default function AttendantApp() {
  const [spots, setSpots] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('a_token'));
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(token ? 'home' : 'phone');
  const [feedback, setFeedback] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (token) {
      axios.get(`${API}/api/spots?lat=17.4065&lng=78.4772&radius=500`, { headers })
        .then(r => setSpots(r.data.spots));
    }
  }, [token]);

  const sendOtp = async () => {
    await axios.post(`${API}/api/auth/send-otp`, { phone });
    setStep('otp');
  };

  const verifyOtp = async () => {
    const res = await axios.post(`${API}/api/auth/verify-otp`, { phone, otp });
    localStorage.setItem('a_token', res.data.token);
    setToken(res.data.token);
    setStep('home');
  };

  const report = async (spotId, status) => {
    await axios.post(`${API}/api/spots/${spotId}/report`, { status }, { headers });
    setFeedback(`✅ Reported as ${status}`);
    setTimeout(() => setFeedback(''), 2000);
  };

  if (step === 'phone' || step === 'otp') {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 340 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 20 }}>Attendant Login</div>
          {step === 'phone' ? (
            <>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #ddd', fontSize: 16, marginBottom: 14, boxSizing: 'border-box' }} />
              <button onClick={sendOtp} style={{ width: '100%', background: '#E8500A', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Send OTP</button>
            </>
          ) : (
            <>
              <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #ddd', fontSize: 22, textAlign: 'center', letterSpacing: 6, marginBottom: 14, boxSizing: 'border-box' }} />
              <button onClick={verifyOtp} style={{ width: '100%', background: '#0A0A0F', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Verify</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EC', fontFamily: 'system-ui' }}>
      <div style={{ background: '#0A0A0F', color: 'white', padding: '16px 20px', fontWeight: 800, fontSize: 18 }}>
        🅿 Attendant Panel
      </div>
      <div style={{ padding: 16 }}>
        {feedback && <div style={{ background: '#00C48C', color: 'white', borderRadius: 10, padding: '10px 16px', marginBottom: 12, fontWeight: 600 }}>{feedback}</div>}
        {spots.map(spot => (
          <div key={spot._id} style={{ background: 'white', borderRadius: 14, padding: 20, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{spot.name}</div>
            <div style={{ fontSize: 13, color: '#888', margin: '4px 0 14px' }}>{spot.available} slots currently free</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => report(spot._id, 'FREE')}
                style={{ flex: 1, background: '#E6FBF5', color: '#00A076', border: '1.5px solid #9DE8D1', borderRadius: 10, padding: 14, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                ✅ Slot Free
              </button>
              <button onClick={() => report(spot._id, 'OCCUPIED')}
                style={{ flex: 1, background: '#FFF0EA', color: '#E8500A', border: '1.5px solid #F5C4AC', borderRadius: 10, padding: 14, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                🚫 Slot Full
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}