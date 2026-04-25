import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [step, setStep] = useState('phone');   // phone | otp
    const [loading, setLoading] = useState(false);
    const [devOtp, setDevOtp] = useState('');
    const { setAuth } = useAuth();
    const navigate = useNavigate();

    const sendOtp = async () => {
        if (!/^[6-9]\d{9}$/.test(phone)) return alert('Enter a valid 10-digit Indian mobile number');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/send-otp', { phone });
            if (res.data.otp) setDevOtp(`Dev OTP: ${res.data.otp}`);
            setStep('otp');
        } catch (e) {
            alert(e.response?.data?.error || 'Failed to send OTP');
        }
        setLoading(false);
    };

    const verifyOtp = async () => {
        setLoading(true);
        try {
            const res = await api.post('/api/auth/verify-otp', { phone, otp, name });
            setAuth(res.data.user, res.data.token);
            navigate('/map');
        } catch (e) {
            alert(e.response?.data?.error || 'Invalid OTP');
        }
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F2EC', padding: '24px' }}>
            <div style={{ background: '#0A0A0F', color: 'white', borderRadius: 12, padding: '8px 20px', marginBottom: 32, fontWeight: 800, fontSize: 20 }}>
                🅿 ParkIQ
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <h2 style={{ fontWeight: 800, fontSize: 22, marginBottom: 6 }}>
                    {step === 'phone' ? 'Welcome back' : 'Enter OTP'}
                </h2>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>
                    {step === 'phone' ? 'Sign in with your mobile number' : `OTP sent to +91 ${phone}`}
                </p>

                {devOtp && <div style={{ background: '#FFF3CD', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>{devOtp}</div>}

                {step === 'phone' ? (
                    <>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Mobile Number</label>
                        <div style={{ display: 'flex', border: '1.5px solid #ddd', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                            <span style={{ background: '#F5F5F5', padding: '12px 14px', fontSize: 15, borderRight: '1px solid #ddd', color: '#666' }}>+91</span>
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} type="tel"
                                style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: 15, outline: 'none' }} />
                        </div>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>Your Name (optional)</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma"
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 15, marginBottom: 20, boxSizing: 'border-box', outline: 'none' }} />
                        <button onClick={sendOtp} disabled={loading}
                            style={{ width: '100%', background: '#E8500A', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                            {loading ? 'Sending...' : 'Send OTP →'}
                        </button>
                    </>
                ) : (
                    <>
                        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>6-Digit OTP</label>
                        <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} type="tel"
                            style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px solid #ddd', fontSize: 22, textAlign: 'center', letterSpacing: 8, marginBottom: 20, boxSizing: 'border-box', outline: 'none' }} />
                        <button onClick={verifyOtp} disabled={loading}
                            style={{ width: '100%', background: '#0A0A0F', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 12 }}>
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <button onClick={() => { setStep('phone'); setDevOtp(''); }}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer' }}>
                            ← Change number
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}