import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth';
import Home from './pages/Home';
import Login from './pages/Login';
import MapView from './pages/Map';
import Book from './pages/Book';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
      <Route path="/book/:id" element={<PrivateRoute><Book /></PrivateRoute>} />
      <Route path="/booking/:id" element={<PrivateRoute><BookingSuccess /></PrivateRoute>} />
      <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
    </Routes>
  </BrowserRouter>
);