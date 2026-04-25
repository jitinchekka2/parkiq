import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const availColor = (available, total) => {
    const pct = available / total;
    if (pct > 0.3) return '#00C48C';
    if (pct > 0.1) return '#F5A623';
    return '#E8500A';
};

export default function MapView() {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const moveDebounceRef = useRef(null);
    const [spots, setSpots] = useState([]);
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const clearMarkers = () => {
        Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
        markersRef.current = {};
    };

    const getDynamicRadius = () => {
        const map = mapInstance.current;
        if (!map) return 3000;

        const center = map.getCenter();
        const northEast = map.getBounds().getNorthEast();
        const viewportRadius = Math.ceil(center.distanceTo(northEast));

        // Keep requests practical while still reflecting current zoom level.
        return Math.min(Math.max(viewportRadius, 500), 20000);
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
            const { latitude: lat, longitude: lng } = coords;

            mapInstance.current = new mapboxgl.Map({
                container: mapRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [lng, lat],
                zoom: 14,
            });

            mapInstance.current.addControl(new mapboxgl.NavigationControl());

            // User location marker
            new mapboxgl.Marker({ color: '#1A6EFF' }).setLngLat([lng, lat]).addTo(mapInstance.current);

            mapInstance.current.on('load', () => {
                fetchSpots(lat, lng, getDynamicRadius());
            });

            mapInstance.current.on('moveend', () => {
                clearTimeout(moveDebounceRef.current);
                moveDebounceRef.current = setTimeout(() => {
                    const center = mapInstance.current.getCenter();
                    fetchSpots(center.lat, center.lng, getDynamicRadius());
                }, 250);
            });
        }, () => {
            // Fallback to Hyderabad
            mapInstance.current = new mapboxgl.Map({
                container: mapRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [78.4772, 17.4065],
                zoom: 13,
            });

            mapInstance.current.on('load', () => {
                fetchSpots(17.4065, 78.4772, getDynamicRadius());
            });

            mapInstance.current.on('moveend', () => {
                clearTimeout(moveDebounceRef.current);
                moveDebounceRef.current = setTimeout(() => {
                    const center = mapInstance.current.getCenter();
                    fetchSpots(center.lat, center.lng, getDynamicRadius());
                }, 250);
            });
        });

        return () => {
            clearTimeout(moveDebounceRef.current);
            clearMarkers();
            mapInstance.current?.remove();
        };
    }, []);

    const fetchSpots = async (lat, lng, radius = 3000) => {
        const res = await api.get(`/api/spots?lat=${lat}&lng=${lng}&radius=${radius}`);
        clearMarkers();
        setSpots(res.data.spots);
        res.data.spots.forEach(addMarker);
    };

    const addMarker = (spot) => {
        const el = document.createElement('div');
        el.style.cssText = `
      background: ${availColor(spot.available, spot.totalSlots)};
      color: white; font-weight: 700; font-size: 12px;
      padding: 6px 10px; border-radius: 100px;
      cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      white-space: nowrap;
    `;
        el.textContent = `₹${spot.pricing.perHour}/hr · ${spot.available} free`;
        el.addEventListener('click', () => setSelected(spot));

        const marker = new mapboxgl.Marker(el)
            .setLngLat(spot.location.coordinates)
            .addTo(mapInstance.current);

        markersRef.current[spot._id] = { marker, el, spot };
    };

    useSocket('spot:update', ({ spotId, available }) => {
        setSpots(prev => prev.map(s => s._id === spotId ? { ...s, available } : s));
        const ref = markersRef.current[spotId];
        if (ref) {
            const color = availColor(available, ref.spot.totalSlots);
            ref.el.style.background = color;
            ref.el.textContent = `₹${ref.spot.pricing.perHour}/hr · ${available} free`;
        }
    });

    return (
        <div style={{ height: '100vh', position: 'relative' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Header */}
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: '#0A0A0F', color: 'white', borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: 16 }}>
                    🅿 ParkIQ
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => navigate('/my-bookings')}
                        style={{ background: 'white', color: '#0A0A0F', border: '1px solid #ddd', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login', { replace: true });
                        }}
                        style={{ background: 'white', color: '#0A0A0F', border: '1px solid #ddd', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Selected spot panel */}
            {selected && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: 24, boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.name}</div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{selected.address}</div>
                        </div>
                        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                        <span style={{ background: '#F5F2EC', padding: '4px 12px', borderRadius: 100, fontSize: 13 }}>₹{selected.pricing.perHour}/hr</span>
                        <span style={{ background: availColor(selected.available, selected.totalSlots), color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>
                            {selected.available} slots free
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.location.coordinates[1]},${selected.location.coordinates[0]}`, '_blank')}
                            style={{ flex: 1, background: '#F5F2EC', border: 'none', borderRadius: 12, padding: 14, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                            🗺 Navigate
                        </button>
                        <button
                            onClick={() => navigate(`/book/${selected._id}`)}
                            disabled={selected.available === 0}
                            style={{ flex: 2, background: selected.available > 0 ? '#E8500A' : '#ccc', color: 'white', border: 'none', borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 15, cursor: selected.available > 0 ? 'pointer' : 'not-allowed' }}>
                            {selected.available > 0 ? 'Book Now →' : 'No Slots'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}